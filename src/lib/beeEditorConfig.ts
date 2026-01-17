/**
 * BeeFree Editor Configuration
 * Centralized configuration for the BeeFree email template editor
 */

export interface BeeEditorConfig {
  uid: string;
  container: string;
  autosave: number | false;
  language: string;
  trackChanges: boolean;
  preventClose: boolean;
  mergeTags: Array<{
    name: string;
    value: string;
    style?: Record<string, any>;
  }>;
  [key: string]: any;
}

export interface BeeEditorCallbacks {
  onSave?: (jsonFile: any, htmlFile: string) => void;
  onChange?: (jsonFile: any, response: any) => void;
  onSaveAsTemplate?: (jsonFile: any) => void;
  onAutoSave?: (jsonFile: any) => void;
  onSend?: (htmlFile: string) => void;
  onLoad?: (jsonFile: any) => void;
  onError?: (errorMessage: string) => void;
  onWarning?: (alertMessage: string) => void;
  uploadImage?: (data: any, done: (result: { progress: number; url: string }) => void) => Promise<void>;
  selectImage?: (data: any, done: (result: { url: string }) => void) => Promise<void>;
}

/**
 * Create BeeFree editor configuration
 */
export function createBeeEditorConfig(
  containerId: string,
  mergeTags: Array<{ name: string; value: string; style?: Record<string, any> }> = [],
  callbacks: BeeEditorCallbacks = {}
): BeeEditorConfig {
  return {
    uid: 'CmsUserName', // [mandatory]
    container: containerId, // [mandatory]
    autosave: 30, // [optional, default:false] - autosave every 30 seconds
    language: 'en-US', // [optional, default:'en-US']
    trackChanges: true, // [optional, default: false]
    preventClose: false, // [optional, default:false]
    editorFonts: {}, // [optional, default: see description]
    contentDialog: {}, // [optional, default: see description]
    defaultForm: {}, // [optional, default: {}]
    roleHash: '', // [optional, default: ""]
    rowDisplayConditions: {}, // [optional, default: {}]
    rowsConfiguration: {},
    mergeTags,
    workspace: {
      editSingleRow: false, // [optional, default: false] - when false, enables row editing with options
    },
    commenting: false, // [optional, default: false]
    commentingThreadPreview: true, // [optional, default: true]
    commentingNotifications: true, // [optional, default: true]
    disableLinkSanitize: true, // [optional, default: false]
    loadingSpinnerDisableOnSave: false, // [optional, default: false]
    loadingSpinnerDisableOnDialog: true, // [optional, default: false]
    maxRowsDisplayed: 35, // [optional, set this to number to define the maximum number of rows that a category should display]
    
    // Callbacks
    onSave: callbacks.onSave,
    onChange: callbacks.onChange,
    onSaveAsTemplate: callbacks.onSaveAsTemplate,
    onAutoSave: callbacks.onAutoSave,
    onSend: callbacks.onSend,
    onLoad: callbacks.onLoad,
    onError: callbacks.onError,
    onWarning: callbacks.onWarning,
    uploadImage: callbacks.uploadImage,
    selectImage: callbacks.selectImage,
    
    // Translations
    translations: {
      'bee-common-widget-bar': {
        content: 'MODULES',
      },
    },
  };
}

/**
 * Get BeeFree client ID from environment
 * Note: Client secret should NEVER be in frontend - must be fetched from backend
 */
export function getBeeClientId(): string {
  return import.meta.env.VITE_BEE_CLIENT_ID || '077ccc41-3e5f-44b3-9062-b0a590f6b67f';
}
