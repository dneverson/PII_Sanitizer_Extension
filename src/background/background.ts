chrome.runtime.onInstalled.addListener(() => {
  const defaultSanitizations = [
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
    },
    {
      id: '14',
      description: 'ASD',
      pattern: 'asd',
      replacement: 'WEEEeeeEEEE',
      enabled: true,
      isRegex: false
    }
  ];

  const defaultWebsites = [
    { url: 'chat.openai.com', enabled: true },
    { url: 'chatgpt.com', enabled: true },
    { url: 'claude.ai', enabled: true },
    { url: 'bard.google.com', enabled: true }
  ];

  chrome.storage.local.set({
    sanitizations: defaultSanitizations,
    websites: defaultWebsites,
    isGloballyPaused: false,
    darkMode: true
  });
});