export interface Sanitization {
  id: string;
  description: string;
  pattern: string;
  replacement: string;
  enabled: boolean;
  isEditing?: boolean;
  isRegex: boolean;  // New field to distinguish between regex and simple text replacement
}

export interface Website {
  url: string;
  enabled: boolean;
}

export interface Settings {
  darkMode: boolean;
  isGloballyPaused: boolean;
}

export interface StorageData {
  sanitizations: Sanitization[];
  websites: Website[];
  settings: Settings;
}

export type ChromeStorageResponse = {
  sanitizations?: Sanitization[];
  websites?: Website[];
  isGloballyPaused?: boolean;
  settings?: Settings;
};

export interface EditableSanitization extends Sanitization {
  originalDescription?: string;
  originalPattern?: string;
  originalReplacement?: string;
}