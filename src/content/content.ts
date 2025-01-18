import { Sanitization, Website } from '../types/types';

let sanitizations: Sanitization[] = [];
let websites: Website[] = [];
let isGloballyPaused = false;
let isInitialized = false;
let isProgrammaticUpdate = false;

// Load settings from storage
function loadSettings() {
  console.log('Loading settings...');
  chrome.storage.local.get(['sanitizations', 'websites', 'isGloballyPaused'], (result) => {
    sanitizations = result.sanitizations || [];
    websites = result.websites || [];
    isGloballyPaused = result.isGloballyPaused || false;
    console.log('Settings loaded:', { sanitizations, websites, isGloballyPaused });
    
    if (shouldMonitorThisPage() && !isInitialized) {
      console.log('Initializing monitoring...');
      isInitialized = true;
      initializeMonitoring();
    }
  });
}

// Initial load
loadSettings();

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  console.log('Storage changes:', changes);
  
  if (changes.sanitizations) {
    sanitizations = changes.sanitizations.newValue;
  }
  if (changes.websites) {
    websites = changes.websites.newValue;
    if (shouldMonitorThisPage() && !isInitialized) {
      isInitialized = true;
      initializeMonitoring();
    }
  }
  if (changes.isGloballyPaused) {
    isGloballyPaused = changes.isGloballyPaused.newValue;
  }
});

function shouldMonitorThisPage(): boolean {
  const currentHostname = window.location.hostname;
  return websites.some(site => site.enabled && currentHostname.includes(site.url));
}

function isHiddenTextarea(element: HTMLElement): boolean {
  return element instanceof HTMLTextAreaElement && 
         element.style.display === 'none' &&
         element.getAttribute('data-virtualkeyboard') === 'true';
}

function isChatGPTTextarea(element: HTMLElement): boolean {
  return element.id === 'prompt-textarea' && 
         element.classList.contains('ProseMirror');
}

function isClaudeTextarea(element: HTMLElement): boolean {
  return element.matches('textarea[placeholder*="Message Claude"]') ||
         (element.isContentEditable && element.classList.contains('ProseMirror') && 
          window.location.hostname.includes('claude.ai'));
}

function formatForChatGPT(text: string): string {
  const lines = text.split('\n');
  return lines.map(line => 
    `<p>${line || '<br class="ProseMirror-trailingBreak">'}</p>`
  ).join('');
}

function formatForClaude(text: string): string {
  // Normalize all newlines
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into lines and wrap each line in <p> tags
  const formattedText = normalizedText
    .split('\n')
    .map(line => `<p>${line}</p>`)
    .join('');

  return formattedText;
}

function getTextFromContentEditable(element: HTMLElement, isProseMirror: boolean): string {
  if (isProseMirror) {
    // For ProseMirror (both GPT and Claude), extract text from <p> tags
    const paragraphs = element.getElementsByTagName('p');
    return Array.from(paragraphs)
      .map(p => p.textContent?.replace(/\u200B/g, '') || '')
      .join('\n');
  } else {
    // For standard contenteditable
    return element.textContent || '';
  }
}

function sanitizeText(
  text: string | null | undefined,
  cursorPosition: number | null = null,
  isPaste: boolean = false
): { text: string; cursorPosition: number | null } {
  console.log('Sanitizing text:', { text, cursorPosition, isPaste });

  if (!text || isGloballyPaused) {
    console.log('Text empty or globally paused, returning original');
    return { 
      text: text || '', 
      cursorPosition: cursorPosition 
    };
  }

  // Normalize line endings while preserving them
  let sanitizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let newCursorPosition = cursorPosition;
  let lastReplacementEnd = -1;
  let currentPosition = 0;

  // Split text into lines while preserving newlines
  const lines = sanitizedText.split(/(\n)/);
  const sanitizedLines: string[] = [];

  for (const line of lines) {
    // Preserve exact newlines
    if (line === '\n') {
      sanitizedLines.push(line);
      currentPosition += line.length;
      continue;
    }

    let processedLine = line;
    for (const rule of sanitizations) {
      if (!rule.enabled) continue;

      try {
        const originalLine = processedLine;
        
        if (rule.isRegex) {
          const regex = new RegExp(rule.pattern, 'g');
          processedLine = processedLine.replace(regex, rule.replacement);
        } else {
          const escapedPattern = rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedPattern, 'g');
          
          let match;
          while ((match = regex.exec(originalLine)) !== null) {
            if (cursorPosition !== null && !isPaste) {
              const globalMatchIndex = currentPosition + match.index;
              if (globalMatchIndex <= cursorPosition) {
                lastReplacementEnd = globalMatchIndex + rule.replacement.length;
              }
            }
          }
          
          processedLine = processedLine.replace(regex, rule.replacement);
        }
      } catch (e) {
        console.error('Error applying sanitization rule:', { rule, error: e });
      }
    }
    
    sanitizedLines.push(processedLine);
    currentPosition += line.length;
  }

  // Join lines back together while preserving newlines
  sanitizedText = sanitizedLines.join('');

  // Update cursor position
  if (cursorPosition !== null) {
    if (isPaste) {
      newCursorPosition = sanitizedText.length;
    } else {
      if (lastReplacementEnd >= 0) {
        newCursorPosition = lastReplacementEnd;
      } else if (cursorPosition === text.length) {
        newCursorPosition = sanitizedText.length;
      } else {
        newCursorPosition = Math.min(cursorPosition, sanitizedText.length);
      }
    }
  }

  return { text: sanitizedText, cursorPosition: newCursorPosition };
}

function handleInput(event: Event) {
  if (isGloballyPaused || isProgrammaticUpdate) {
    return;
  }

  const target = event.target as HTMLElement;
  
  if (isHiddenTextarea(target)) {
    return;
  }

  let text: string | null = null;
  let cursorPosition: number | null = null;

  const isGPT = isChatGPTTextarea(target);
  const isClaude = isClaudeTextarea(target);

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    text = target.value;
    cursorPosition = target.selectionStart;
  } else if (target instanceof HTMLElement && target.isContentEditable) {
    text = getTextFromContentEditable(target, isGPT || isClaude);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPosition = range.startOffset;
    }
  }

  if (text !== null) {
    const isPaste = target.dataset.justPasted === 'true';
    const { text: sanitizedText, cursorPosition: newCursorPosition } = 
      sanitizeText(text, cursorPosition, isPaste);
    
    if (sanitizedText !== text) {
      isProgrammaticUpdate = true;
      try {
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          target.value = sanitizedText;
          if (newCursorPosition !== null) {
            target.setSelectionRange(newCursorPosition, newCursorPosition);
          }
        } else if (target instanceof HTMLElement && target.isContentEditable) {
          if (isGPT) {
            target.innerHTML = formatForChatGPT(sanitizedText);
          } else if (isClaude) {
            target.innerHTML = formatForClaude(sanitizedText);
          } else {
            target.textContent = sanitizedText;
          }

          if (newCursorPosition !== null && window.getSelection) {
            const selection = window.getSelection();
            if (selection) {
              try {
                const range = document.createRange();
                if (isGPT || isClaude) {
                  // For ProseMirror editors, position at end of content
                  const lastChild = target.lastElementChild || target;
                  range.selectNodeContents(lastChild);
                  range.collapse(false);
                } else if (target.firstChild) {
                  // For standard contenteditable
                  const safePosition = Math.min(newCursorPosition, sanitizedText.length);
                  range.setStart(target.firstChild, safePosition);
                  range.setEnd(target.firstChild, safePosition);
                }
                selection.removeAllRanges();
                selection.addRange(range);
              } catch (e) {
                console.error('Error setting cursor position:', e);
                const range = document.createRange();
                range.selectNodeContents(target);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }
        }
      } finally {
        isProgrammaticUpdate = false;
        delete target.dataset.justPasted;
      }
    }
  }
}

function handlePaste(event: ClipboardEvent) {
  console.log('=== PASTE EVENT START ===');
  console.log('Initial target:', {
    element: event.target,
    id: (event.target as HTMLElement).id,
    classList: (event.target as HTMLElement).classList,
    parentElement: (event.target as HTMLElement).parentElement?.id
  });

  if (isGloballyPaused || isProgrammaticUpdate) {
    console.log('Skipping due to pause/programmatic update');
    return;
  }

  const target = event.target as HTMLElement;
  
  if (isHiddenTextarea(target)) {
    console.log('Skipping hidden textarea');
    return;
  }

  target.dataset.justPasted = 'true';

  const isGPT = isChatGPTTextarea(target);
  const isClaude = isClaudeTextarea(target);

  if (isGPT || isClaude) {
    setTimeout(() => {
      console.log('=== POST PASTE PROCESSING FOR EDITOR ===');
      const content = getTextFromContentEditable(target, true);
      console.log('Current content:', content);
      
      const { text: sanitizedText } = sanitizeText(content, null, true);
      console.log('Sanitized content:', sanitizedText);

      if (content !== sanitizedText) {
        isProgrammaticUpdate = true;
        try {
          target.innerHTML = isGPT ? 
            formatForChatGPT(sanitizedText) : 
            formatForClaude(sanitizedText);

          // Position cursor at end
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            const lastChild = target.lastElementChild || target;
            range.selectNodeContents(lastChild);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } finally {
          isProgrammaticUpdate = false;
          delete target.dataset.justPasted;
        }
      }
    }, 0);
  } else {
    // For standard inputs, let input handler process
    console.log('Standard paste handling - letting input handler process');
  }

  console.log('=== PASTE PROCESSING COMPLETE ===');
}

function shouldMonitorElement(element: HTMLElement): boolean {
  if (isHiddenTextarea(element)) {
    return false;
  }

  const chatGPTSelectors = [
    'div[contenteditable="true"]#prompt-textarea',
    'textarea.text-input:not([style*="display: none"])'
  ];
  
  const claudeSelectors = [
    'textarea[placeholder*="Message Claude"]',
    'div[contenteditable="true"]'
  ];
  
  const bardSelectors = [
    'textarea[placeholder*="Enter a prompt"]',
    'div[contenteditable="true"][aria-label*="Prompt"]'
  ];

  const allSelectors = [...chatGPTSelectors, ...claudeSelectors, ...bardSelectors];
  
  return allSelectors.some(selector => element.matches(selector)) ||
         element.matches('input[type="text"], textarea:not([style*="display: none"])');
}

function setupInput(input: HTMLElement) {
  if (!input.classList.contains('pii-monitored') && shouldMonitorElement(input)) {
    console.log('Setting up input:', input);
    
    input.classList.add('pii-monitored');
    
    input.removeEventListener('input', handleInput);
    input.removeEventListener('paste', handlePaste);
    
    input.addEventListener('input', handleInput);
    input.addEventListener('paste', handlePaste);
  }
}

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function initializeMonitoring() {
  const style = document.createElement('style');
  style.textContent = `
    .pii-monitored {
      border: 2px solid #22c55e !important;
      transition: border-color 0.3s ease;
      border-radius: 5px;
    }
    .pii-monitored:focus {
      border-color: #16a34a !important;
      border-radius: 5px;
    }
  `;
  document.head.appendChild(style);

  const debouncedSetup = debounce(() => {
    document.querySelectorAll('input[type="text"], textarea, div[contenteditable="true"]').forEach(input => {
      if (input instanceof HTMLElement) {
        setupInput(input);
      }
    });
  }, 100);

  debouncedSetup();

  const observer = new MutationObserver((mutations) => {
    let shouldSetup = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldSetup = true;
      } else if (mutation.type === 'attributes' && 
                 mutation.target instanceof HTMLElement && 
                 shouldMonitorElement(mutation.target)) {
        shouldSetup = true;
      }
    });

    if (shouldSetup) {
      debouncedSetup();
    }
  });

  const config = {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['contenteditable', 'class', 'id', 'style']
  };

  observer.observe(document.body, config);

  setInterval(debouncedSetup, 2000);
}