/**
 * useBeeEditor Hook
 * Custom hook for managing BeeFree editor instance and lifecycle
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import BeePlugin from '@mailupinc/bee-plugin';
import { toast } from 'sonner';
import { createBeeEditorConfig, getBeeClientId, BeeEditorCallbacks } from '@/lib/beeEditorConfig';

export interface UseBeeEditorOptions {
  containerId?: string;
  initialTemplate?: any;
  mergeTags?: Array<{ name: string; value: string; style?: Record<string, any> }>;
  onSave?: (jsonFile: any, htmlFile: string) => void;
  onChange?: (jsonFile: any, response: any) => void;
  onLoad?: (jsonFile: any) => void;
  onError?: (errorMessage: string) => void;
  onAutoSave?: (jsonFile: any) => void;
  uploadImage?: (data: any, done: (result: { progress: number; url: string }) => void) => Promise<void>;
  selectImage?: (data: any, done: (result: { url: string }) => void) => Promise<void>;
  enabled?: boolean;
}

export interface UseBeeEditorReturn {
  editorInstance: any | null;
  isInitializing: boolean;
  isReady: boolean;
  error: string | null;
  save: () => void;
  exportHtml: () => Promise<string | null>;
  load: (template: any) => void;
  preview: () => void;
}

/**
 * Fetch BeeFree token from backend API
 * TODO: Implement backend endpoint /api/bee/token that returns the BeeFree auth token
 * For now, this uses the client secret from env (which should be moved to backend)
 */
async function fetchBeeToken(beeEditor: any, clientId: string): Promise<string> {
  try {
    // TODO: Replace with backend API call
    // const response = await axios.get('/api/bee/token');
    // return response.data.token;
    
    // Temporary: Using client secret from env (MUST be moved to backend)
    const clientSecret = import.meta.env.VITE_BEE_CLIENT_SECRET || '';
    
    if (!clientSecret) {
      throw new Error('BeeFree client secret not configured. Please set VITE_BEE_CLIENT_SECRET in .env file.');
    }
    
    const token = await beeEditor.getToken(clientId, clientSecret);
    return token;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.non_field_errors?.[0] || error?.message || 'Unknown error';
    
    if (errorMessage.includes('Application is disabled')) {
      throw new Error('BeeFree Application is disabled. Please verify your configuration.');
    } else if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
      throw new Error('Invalid BeeFree credentials. Please check your configuration.');
    } else {
      throw new Error(`BeeFree authentication failed: ${errorMessage}`);
    }
  }
}

export function useBeeEditor({
  containerId = 'bee-plugin-container',
  initialTemplate = null,
  mergeTags = [],
  onSave,
  onChange,
  onLoad,
  onError,
  onAutoSave,
  uploadImage,
  selectImage,
  enabled = true,
}: UseBeeEditorOptions = {}): UseBeeEditorReturn {
  const [editorInstance, setEditorInstance] = useState<any | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any | null>(null);
  const initializationAttempted = useRef(false);
  // Track previous template to detect changes - use undefined to distinguish from null
  const prevTemplateRef = useRef<any | undefined>(undefined);
  const templateLoadedRef = useRef<boolean>(false);

  // Initialize editor
  useEffect(() => {
    if (!enabled || initializationAttempted.current) return;
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`BeeFree editor container "${containerId}" not found`);
      return;
    }

    const initializeEditor = async () => {
      initializationAttempted.current = true;
      setIsInitializing(true);
      setError(null);

      try {
        const beeEditor = new BeePlugin();
        const clientId = getBeeClientId();

        // Fetch authentication token
        let token: string;
        try {
          token = await fetchBeeToken(beeEditor, clientId);
        } catch (tokenError: any) {
          const errorMsg = tokenError.message || 'Failed to authenticate with BeeFree editor';
          setError(errorMsg);
          setIsInitializing(false);
          toast.error(errorMsg);
          console.error('BeeFree token fetch error:', tokenError);
          return;
        }

        // Create editor configuration
        const callbacks: BeeEditorCallbacks = {
          onSave: (jsonFile: any, htmlFile: string) => {
            onSave?.(jsonFile, htmlFile);
          },
          onChange: (jsonFile: any, response: any) => {
            onChange?.(jsonFile, response);
          },
          onLoad: (jsonFile: any) => {
            setIsInitializing(false);
            setIsReady(true);
            onLoad?.(jsonFile);
          },
          onAutoSave: (jsonFile: any) => {
            onAutoSave?.(jsonFile);
          },
          onError: (errorMessage: string) => {
            // Only show non-authentication errors (auth errors are handled in token fetch)
            if (!errorMessage.toLowerCase().includes('authentication') && 
                !errorMessage.toLowerCase().includes('credentials')) {
              toast.error(`Editor error: ${errorMessage}`);
            }
            onError?.(errorMessage);
          },
          onWarning: (alertMessage: string) => {
            console.warn('BeeFree editor warning:', alertMessage);
          },
          uploadImage,
          selectImage,
        };

        const config = createBeeEditorConfig(containerId, mergeTags, callbacks);

        // Fallback: hide loading after 10 seconds if onLoad doesn't fire
        const loadingTimeout = setTimeout(() => {
          if (isInitializing) {
            console.warn('BeeFree editor onLoad callback did not fire within timeout');
            setIsInitializing(false);
            setIsReady(true);
          }
        }, 10000);

        // Wrap onLoad to clear timeout
        const originalOnLoad = config.onLoad;
        config.onLoad = function(jsonFile: any) {
          clearTimeout(loadingTimeout);
          if (originalOnLoad) originalOnLoad(jsonFile);
        };

        // Start the editor with blank template initially
        // Template will be loaded via the useEffect hook when editor is ready
        // This ensures we don't miss template updates that happen after initialization
        console.log('Initializing BeeFree editor (template will load when ready)');
        beeEditor.start(config, null);
        editorRef.current = beeEditor;
        setEditorInstance(beeEditor);
        
        // Reset refs - template will be loaded in the useEffect
        prevTemplateRef.current = undefined;
        templateLoadedRef.current = false;
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to initialize template editor';
        setError(errorMsg);
        setIsInitializing(false);
        toast.error(errorMsg);
        console.error('BeeFree editor initialization error:', err);
      }
    };

    initializeEditor();
  }, [containerId, enabled, mergeTags]);

  // Load template when initialTemplate changes after editor is ready
  // This handles both initial load and updates when template is selected
  useEffect(() => {
    if (!editorInstance || !isReady) {
      // If not ready yet, reset the ref so we can load when ready
      if (!isReady) {
        prevTemplateRef.current = undefined;
        templateLoadedRef.current = false;
      }
      return;
    }
    
    // Check if template actually changed
    // Use JSON stringify for deep comparison to handle object recreation
    const prevTemplateStr = prevTemplateRef.current ? JSON.stringify(prevTemplateRef.current) : 'null';
    const currentTemplateStr = initialTemplate ? JSON.stringify(initialTemplate) : 'null';
    const templateChanged = prevTemplateStr !== currentTemplateStr;
    
    // Also check if we haven't loaded a template yet (first load after editor ready)
    // This handles the case where editor becomes ready before template is loaded
    const needsInitialLoad = !templateLoadedRef.current;
    
    if (templateChanged || needsInitialLoad) {
      const templateToLoad = initialTemplate;
      prevTemplateRef.current = initialTemplate;
      templateLoadedRef.current = true;
      
      try {
        // Load the template (null = blank template, object = template JSON)
        if (editorInstance && editorInstance.load) {
          editorInstance.load(templateToLoad || null);
          if (templateToLoad) {
            console.log('✓ Loaded template into editor:', {
              rows: templateToLoad.body?.rows?.length || 0,
              hasBody: !!templateToLoad.body,
              templateKeys: Object.keys(templateToLoad),
            });
          } else {
            console.log('✓ Loaded blank template into editor');
          }
        }
      } catch (err) {
        console.error('✗ Error loading template:', err);
        // Reset ref on error so we can retry
        prevTemplateRef.current = undefined;
        templateLoadedRef.current = false;
      }
    }
  }, [initialTemplate, editorInstance, isReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try {
          if (editorRef.current.destroy) {
            editorRef.current.destroy();
          }
        } catch (err) {
          console.error('Error cleaning up BeeFree editor:', err);
        }
        editorRef.current = null;
        setEditorInstance(null);
      }
    };
  }, []);

  // Editor methods
  const save = useCallback(() => {
    if (editorInstance?.save) {
      editorInstance.save();
    }
  }, [editorInstance]);

  const exportHtml = useCallback(async (): Promise<string | null> => {
    if (editorInstance?.exportHtml) {
      try {
        const html = await editorInstance.exportHtml();
        return html;
      } catch (err) {
        console.error('Error exporting HTML:', err);
        return null;
      }
    }
    return null;
  }, [editorInstance]);

  const load = useCallback((template: any) => {
    if (editorInstance?.load) {
      editorInstance.load(template);
    }
  }, [editorInstance]);

  const preview = useCallback(() => {
    if (editorInstance?.preview) {
      editorInstance.preview();
    }
  }, [editorInstance]);

  return {
    editorInstance,
    isInitializing,
    isReady,
    error,
    save,
    exportHtml,
    load,
    preview,
  };
}
