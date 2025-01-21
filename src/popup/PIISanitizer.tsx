import React, { useState, useEffect } from 'react';
import { AlertCircle, Moon, Sun, Info, Plus, Play, Pause, Edit2, Save, X, RefreshCw, Globe, Trash2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

// Types
interface Sanitization {
  id: string;
  description: string;
  pattern: string;
  replacement: string;
  enabled: boolean;
  isEditing?: boolean;
  isRegex: boolean;
}

interface Website {
  url: string;
  enabled: boolean;
}

const DEFAULT_WEBSITES = [
  { url: 'chat.openai.com', enabled: true },
  { url: 'chatgpt.com', enabled: true },
  { url: 'claude.ai', enabled: true },
  { url: 'bard.google.com', enabled: true }
];

const DEFAULT_SANITIZATIONS = [
  {
    id: '1',
    description: 'Full Names (e.g., John Doe).',
    pattern: '\\b[A-Z][a-z]+\\s[A-Z][a-z]+\\b',
    replacement: 'John Doe',
    enabled: false,
    isRegex: true
  },
  {
    id: '2',
    description: 'Email Addresses.',
    pattern: '\\b[A-Za-z0-9_%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
    replacement: 'email@domain.com',
    enabled: true,
    isRegex: true
  },
  {
    id: '3',
    description: 'Social Security Numbers (SSN)',
    pattern: '\\b(?!000|666|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0000)\\d{4}\\b',
    replacement: 'XXX-XX-XXXX',
    enabled: true,
    isRegex: true
  },
  {
    id: '4',
    description: 'Credit Card Numbers (All Major Cards)',
    pattern: '\\b(?:3(?:0[0-5]|09|[68][0-9])[0-9]{11,14}|4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11}|62[0-9]{14,17})\\b',
    replacement: '************1234',
    enabled: true,
    isRegex: true
  },
  { //Needs to Trigger Before Phone Numbers
    id: '5',
    description: 'Common API/Auth Tokens',
    pattern: '\\b(?:bearer|api_key|auth_token)\\b\\s+([A-Za-z0-9._+\\-\\/]{20,})\\b',
    replacement: 'API_TOKEN_REMOVED',
    enabled: true,
    isRegex: true
  },
  {
    id: '6',
    description: 'AWS Access Keys',
    pattern: '\\b(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}\\b',
    replacement: 'AWS_KEY_REMOVED',
    enabled: true,
    isRegex: true
},
  {
    id: '7',
    description: 'Phone Numbers (All Common Formats)',
    pattern: '(?:\\+?1[-.\\s]?)?(?:\\([2-9][0-9]{2}\\)|[2-9][0-9]{2})[-.,\\s]?[2-9][0-9]{2}[-.,\\s]?[0-9]{4}|(?:\\+?1[-.,\\s]?)?\\b[2-9][0-9]{2}[-.,\\s]?[2-9][0-9]{2}[-.,\\s]?[0-9]{4}\\b',
    replacement: '(XXX) XXX-XXXX',
    enabled: true,
    isRegex: true
  },
  {
    id: '8',
    description: 'Website URLs',
    pattern: '\\b(?:(?:https?:|ftp:|sftp:)//)?(?:www\\.)?(?!(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b)[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\\.[a-zA-Z]{2,})+(?::[0-9]{1,5})?(?:/[^\\s]*)?\\b',
    replacement: 'https://domain.com',
    enabled: true,
    isRegex: true
  },
  {
    id: '9',
    description: 'MAC Addresses',
    pattern: '\\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\\b',
    replacement: 'XX:XX:XX:XX:XX:XX',
    enabled: true,
    isRegex: true
  },
  {
    id: '10',
    description: 'IPv4 Addresses',
    pattern: '\\b(?<!:)(?<!://)(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?![a-zA-Z])\\b',
    replacement: 'XXX.XXX.XXX.XXX',
    enabled: true,
    isRegex: true
  },
  {
    id: '11',
    description: 'IPv6 Addresses',
    pattern: '(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:)*:(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}|::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:)*::)(?!/)',
    replacement: 'XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX',
    enabled: true,
    isRegex: true
  },
  {
    id: '12',
    description: 'Dates (Various Formats)',
    pattern: '\\b(?:(?:(?:0?[1-9]|1[0-2])[/.-](?:0?[1-9]|[12]\\d|3[01])[/.-](?:19|20)?\\d{2})|(?:(?:0?[1-9]|[12]\\d|3[01])[/.-](?:0?[1-9]|1[0-2])[/.-](?:19|20)?\\d{2})|(?:(?:19|20)?\\d{2}[/.-](?:0?[1-9]|1[0-2])[/.-](?:0?[1-9]|[12]\\d|3[01])))\\b',
    replacement: '1999/12/31',
    enabled: true,
    isRegex: true
  },
  {
    id: '13',
    description: 'VIN Numbers',
    pattern: '\\b(?:VIN|Vehicle|ID)\\s*[:#]?\\s*[A-HJ-NPR-Z0-9]{17}\\b',
    replacement: 'VIN_REMOVED',
    enabled: true,
    isRegex: true
  }
];

const PIISanitizer = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [isGloballyPaused, setIsGloballyPaused] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showWebsitesModal, setShowWebsitesModal] = useState(false);
  const [websites, setWebsites] = useState<Website[]>(DEFAULT_WEBSITES);
  const [newWebsite, setNewWebsite] = useState('');
  const [newSanitization, setNewSanitization] = useState({
    description: '',
    pattern: '',
    replacement: '',
    isRegex: false
  });
  const [sanitizations, setSanitizations] = useState<Sanitization[]>(DEFAULT_SANITIZATIONS);
  const [showDuplicateWebsiteError, setShowDuplicateWebsiteError] = useState('');
  const [showSanitizationError, setShowSanitizationError] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [showResetAlert, setShowResetAlert] = useState(false);
  const [editedSanitization, setEditedSanitization] = useState<Sanitization | null>(null);

  // Load initial state from storage
  useEffect(() => {
    chrome.storage.local.get(['darkMode', 'isGloballyPaused', 'websites', 'sanitizations'], (result) => {
      if (result.darkMode !== undefined) setDarkMode(result.darkMode);
      if (result.isGloballyPaused !== undefined) setIsGloballyPaused(result.isGloballyPaused);
      if (result.websites) setWebsites(result.websites);
      if (result.sanitizations) setSanitizations(result.sanitizations);
    });

    // Get current URL
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setCurrentUrl(url.hostname);
        setNewWebsite(url.hostname);
      }
    });
  }, []);

  // Save state changes to storage
  const saveToStorage = (key: string, value: any) => {
    chrome.storage.local.set({ [key]: value });
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    saveToStorage('darkMode', newDarkMode);
  };

  const toggleGlobalPause = () => {
    const newPausedState = !isGloballyPaused;
    setIsGloballyPaused(newPausedState);
    saveToStorage('isGloballyPaused', newPausedState);
  };

  useEffect(() => {
    if (showDuplicateWebsiteError) {
      const timer = setTimeout(() => {
        setShowDuplicateWebsiteError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showDuplicateWebsiteError]);

  useEffect(() => {
    if (showSanitizationError) {
      const timer = setTimeout(() => {
        setShowSanitizationError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSanitizationError]);

  const validateUrl = (url: string) => {
    try {
      const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
      const parsed = new URL(urlWithProtocol);
      
      const segments = parsed.hostname.split('.');
      if (segments.length < 2) return false;
      
      const validSegment = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
      return segments.every(segment => 
        segment.length > 0 && 
        segment.length <= 63 && 
        validSegment.test(segment)
      );
    } catch {
      return false;
    }
  };

  const addWebsite = () => {
    if (!newWebsite) {
      setShowDuplicateWebsiteError('Please enter a website URL');
      return;
    }

    if (!validateUrl(newWebsite)) {
      setShowDuplicateWebsiteError('Please enter a valid website URL');
      return;
    }

    const hostname = new URL(newWebsite.startsWith('http') ? newWebsite : `https://${newWebsite}`).hostname;
    
    if (websites.some(site => site.url === hostname)) {
      setShowDuplicateWebsiteError('This website is already in the list');
      return;
    }

    const newWebsites = [...websites, { url: hostname, enabled: true }];
    setWebsites(newWebsites);
    saveToStorage('websites', newWebsites);
    setNewWebsite('');
  };

  const addSanitization = () => {
    if (!newSanitization.description || !newSanitization.pattern || !newSanitization.replacement) {
      setShowSanitizationError('Please fill in all fields');
      return;
    }

    const duplicateDesc = sanitizations.find(s => 
      s.description.toLowerCase() === newSanitization.description.toLowerCase()
    );
    const duplicatePattern = sanitizations.find(s => 
      s.pattern === newSanitization.pattern
    );

    if (duplicateDesc) {
      setShowSanitizationError('A sanitization with this description already exists');
      return;
    }

    if (duplicatePattern) {
      setShowSanitizationError('This pattern already exists');
      return;
    }

    if (newSanitization.isRegex) {
      try {
        new RegExp(newSanitization.pattern);
      } catch (e) {
        setShowSanitizationError('Invalid regex pattern');
        return;
      }
    }

    const newRule = {
      id: Date.now().toString(),
      ...newSanitization,
      enabled: true
    };

    setSanitizations([...sanitizations, newRule]);
    saveToStorage('sanitizations', [...sanitizations, newRule]);

    setNewSanitization({
      description: '',
      pattern: '',
      replacement: '',
      isRegex: false
    });
  };

  const toggleSanitization = (id: string) => {
    const newSanitizations = sanitizations.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setSanitizations(newSanitizations);
    saveToStorage('sanitizations', newSanitizations);
  };

  const deleteSanitization = (id: string) => {
    const newSanitizations = sanitizations.filter(s => s.id !== id);
    setSanitizations(newSanitizations);
    saveToStorage('sanitizations', newSanitizations);
  };

  const editSanitization = (sanitization: Sanitization) => {
    setEditedSanitization({ ...sanitization });
    setSanitizations(sanitizations.map(s => 
      s.id === sanitization.id ? { ...s, isEditing: true } : s
    ));
  };

  const saveSanitization = (id: string) => {
    if (!editedSanitization) return;

    if (editedSanitization.isRegex) {
      try {
        new RegExp(editedSanitization.pattern);
      } catch (e) {
        setShowSanitizationError('Invalid regex pattern');
        return;
      }
    }
    
    const newSanitizations = sanitizations.map(s => 
      s.id === id ? { ...editedSanitization, isEditing: false } : s
    );
    setSanitizations(newSanitizations);
    saveToStorage('sanitizations', newSanitizations);
    setEditedSanitization(null);
  };

  const discardChanges = (id: string) => {
    setSanitizations(sanitizations.map(s => 
      s.id === id ? { ...s, isEditing: false } : s
    ));
    setEditedSanitization(null);
  };

  const toggleWebsite = (index: number) => {
    const newWebsites = websites.map((w, i) => 
      i === index ? { ...w, enabled: !w.enabled } : w
    );
    setWebsites(newWebsites);
    saveToStorage('websites', newWebsites);
  };

  const deleteWebsite = (index: number) => {
    const newWebsites = websites.filter((_, i) => i !== index);
    setWebsites(newWebsites);
    saveToStorage('websites', newWebsites);
  };

  const resetToDefaults = () => {
    setSanitizations([...DEFAULT_SANITIZATIONS]);
    saveToStorage('sanitizations', DEFAULT_SANITIZATIONS);
    setShowResetAlert(false);
  };

  const resetWebsitesToDefaults = () => {
    setWebsites([...DEFAULT_WEBSITES]);
    saveToStorage('websites', DEFAULT_WEBSITES);
    setShowDuplicateWebsiteError('Websites reset to defaults');
  };

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 p-2 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleGlobalPause}
            className={`p-2 rounded ${isGloballyPaused ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {isGloballyPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <h1 className="text-xl font-bold">PII Sanitizer</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button onClick={toggleDarkMode} className="p-2 rounded hover:bg-gray-700">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setShowInfoModal(true)} 
            className="p-2 rounded hover:bg-gray-700"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={() => setShowWebsitesModal(true)}
            className="p-2 rounded hover:bg-gray-700"
          >
            <Globe size={20} />
          </button>
          <button 
            onClick={() => setShowResetAlert(true)}
            className="p-2 rounded hover:bg-gray-700"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Reset Alert */}
      {showResetAlert && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            This will reset all sanitizations to default settings. Any custom rules will be lost.
            <div className="mt-4 space-x-4">
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={resetToDefaults}
              >
                Reset
              </button>
              <button 
                className="px-4 py-2 bg-gray-600 text-white rounded"
                onClick={() => setShowResetAlert(false)}
              >
                Cancel
              </button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowInfoModal(false)} />
          <div className={`relative w-full max-w-md rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} shadow-xl`}>
            <h2 className="text-xl font-bold mb-4">About PII Sanitizer</h2>
            <div className="space-y-3 text-sm">
              <p>PII Sanitizer helps protect sensitive information by automatically detecting and replacing personally identifiable information (PII) in your text inputs.</p>
              <p>To use:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Add websites where you want PII protection</li>
                <li>Create custom sanitization rules or use defaults</li>
                <li>Toggle individual rules or pause all sanitization</li>
              </ol>
              <div className="mt-4">
                <a 
                  href="https://www.paypal.com/donate/?hosted_button_id=TPHPL2ZYZA2JL" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:underline"
                >
                  Donate via Paypal
                </a>
                <span className="mx-2">•</span>
                <a 
                  href="https://github.com/dneverson/PII_Sanitizer_Extension" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:underline"
                >
                  View Source Code
                </a>
              </div>
              <div className="mt-4">
                /* INSERT QR IMAGE HERE*/
              </div>
            </div>
            <button 
              onClick={() => setShowInfoModal(false)}
              className="mt-4 w-full p-2 bg-gray-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Websites Modal */}
      {showWebsitesModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowWebsitesModal(false)} />
          <div className={`relative w-full max-w-md rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} shadow-xl`}>
            <h2 className="text-xl font-bold mb-4">Manage Websites</h2>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                placeholder="Enter website URL"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                className={`flex-1 p-2 rounded text-sm ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
              />
              <button 
                onClick={addWebsite}
                className="p-2 bg-green-600 text-white rounded"
              >
                <Plus size={16} />
              </button>
            </div>
            {showDuplicateWebsiteError && (
              <div className="mb-4 p-2 bg-red-600 text-white text-sm rounded">
                {showDuplicateWebsiteError}
              </div>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {websites.map((site, index) => (
                //<div key={index} className="flex items-center justify-between p-2 rounded bg-gray-700">
                <div key={index} className={`flex items-center justify-between p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}>
                  <span className="text-sm">{site.url}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleWebsite(index)}
                      className={`p-1 rounded ${site.enabled ? 'bg-yellow-600' : 'bg-green-600'}`}
                    >
                      {site.enabled ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      onClick={() => deleteWebsite(index)}
                      className="p-1 bg-red-600 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowWebsitesModal(false)}
              className="mt-4 w-full p-2 bg-gray-600 text-white rounded"
            >
              Close
            </button>
            <button 
              onClick={resetWebsitesToDefaults}
              className="mt-2 w-full p-2 bg-blue-600 text-white rounded"
            >
              Restore Default Websites
            </button>
          </div>
        </div>
      )}

      {/* Add New Sanitization */}
      <div className={`p-2 rounded-lg mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {showSanitizationError && (
          <div className="mb-2 p-2 bg-red-600 text-white text-sm rounded">
            {showSanitizationError}
          </div>
        )}
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            placeholder="Description"
            value={newSanitization.description}
            onChange={e => setNewSanitization({...newSanitization, description: e.target.value})}
            className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'}`}
          />
          <input
            type="text"
            placeholder="Pattern (text to find)"
            value={newSanitization.pattern}
            onChange={e => setNewSanitization({...newSanitization, pattern: e.target.value})}
            className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'}`}
          />
          <input
            type="text"
            placeholder="Replacement Value"
            value={newSanitization.replacement}
            onChange={e => setNewSanitization({...newSanitization, replacement: e.target.value})}
            className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'}`}
          />
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="isRegex"
              checked={newSanitization.isRegex}
              onChange={e => setNewSanitization({...newSanitization, isRegex: e.target.checked})}
              className="mr-2 h-4 w-4"
            />
            <label htmlFor="isRegex" className="text-sm">
              Use Regular Expression
            </label>
          </div>
          <button
            onClick={addSanitization}
            className="w-full p-2 bg-green-600 text-white rounded flex items-center justify-center"
          >
            <Plus size={20} className="mr-2" /> Add Sanitization
          </button>
        </div>
      </div>

      {/* Sanitization List */}
      <div className="space-y-2">
        {sanitizations.map(sanitization => (
          <div
            key={sanitization.id}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
          >
            {sanitization.isEditing ? (
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  value={editedSanitization?.description || sanitization.description}
                  onChange={e => setEditedSanitization(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'}`}
                />
                <input
                  type="text"
                  value={editedSanitization?.pattern || sanitization.pattern}
                  onChange={e => setEditedSanitization(prev => 
                    prev ? { ...prev, pattern: e.target.value } : null
                  )}
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'}`}
                />
                <input
                  type="text"
                  value={editedSanitization?.replacement || sanitization.replacement}
                  onChange={e => setEditedSanitization(prev => 
                    prev ? { ...prev, replacement: e.target.value } : null
                  )}
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'}`}
                />
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`isRegex-${sanitization.id}`}
                    checked={editedSanitization?.isRegex || sanitization.isRegex}
                    onChange={e => setEditedSanitization(prev => 
                      prev ? { ...prev, isRegex: e.target.checked } : null
                    )}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor={`isRegex-${sanitization.id}`} className="text-sm">
                    Use Regular Expression
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold mb-1">{sanitization.description}</h3>
                <p className="text-sm opacity-90 mb-1">Pattern: {sanitization.pattern}</p>
                <p className="text-sm opacity-90">Replacement: {sanitization.replacement}</p>
                <p className="text-sm opacity-90 mt-1">Type: {sanitization.isRegex ? 'Regular Expression' : 'Simple Text'}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              {sanitization.isEditing ? (
                <>
                  <button
                    onClick={() => saveSanitization(sanitization.id)}
                    className="p-2 bg-green-600 rounded hover:bg-green-700"
                    title="Save changes"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => discardChanges(sanitization.id)}
                    className="p-2 bg-yellow-600 rounded hover:bg-yellow-700"
                    title="Discard changes"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => deleteSanitization(sanitization.id)}
                    className="p-2 bg-red-600 rounded hover:bg-red-700"
                    title="Delete sanitization"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => toggleSanitization(sanitization.id)}
                    className={`p-2 rounded hover:opacity-80 ${sanitization.enabled ? 'bg-yellow-600' : 'bg-green-600'}`}
                    title={sanitization.enabled ? "Pause sanitization" : "Resume sanitization"}
                  >
                    {sanitization.enabled ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={() => editSanitization(sanitization)}
                    className="p-2 bg-blue-600 rounded hover:bg-blue-700"
                    title="Edit sanitization"
                  >
                    <Edit2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PIISanitizer;