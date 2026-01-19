/**
 * useUnlayerEditor Hook
 * Custom hook for managing Unlayer (react-email-editor) instance and lifecycle
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface UseUnlayerEditorOptions {
  initialTemplate?: any;
  mergeTags?: Array<{ name: string; value: string; style?: Record<string, any> }>;
  onSave?: (design: any, html: string) => void;
  onChange?: (design: any) => void;
  onLoad?: (design: any) => void;
  onError?: (errorMessage: string) => void;
  uploadImage?: (data: any, done: (result: { progress: number; url: string }) => void) => Promise<void>;
  selectImage?: (data: any, done: (result: { url: string }) => void) => Promise<void>;
  enabled?: boolean;
}

export interface UseUnlayerEditorReturn {
  editorInstance: any | null;
  isInitializing: boolean;
  isReady: boolean;
  error: string | null;
  save: () => void;
  exportHtml: () => Promise<string | null>;
  load: (template: any) => void;
  preview: () => void;
  setEditorInstance: (unlayer: any) => void;
}

export function useUnlayerEditor({
  initialTemplate = null,
  mergeTags = [],
  onSave,
  onChange,
  onLoad,
  onError,
  uploadImage,
  selectImage,
  enabled = true,
}: UseUnlayerEditorOptions = {}): UseUnlayerEditorReturn {
  const [editorInstance, setEditorInstance] = useState<any | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any | null>(null);
  const prevTemplateRef = useRef<any | undefined>(undefined);
  const templateLoadedRef = useRef<boolean>(false);

  // Initialize editor when enabled changes and we have a way to access it
  useEffect(() => {
    if (!enabled) {
      setIsInitializing(false);
      return;
    }

    // Editor will be initialized by EmailEditor component via onLoad callback
    // This effect just sets up the initial state
    setIsInitializing(true);
    setIsReady(false);
  }, [enabled]);

  // This will be called by EmailEditor component when editor is ready
  const setEditorInstanceFromExternal = useCallback((unlayer: any) => {
    if (unlayer?.editor) {
      editorRef.current = unlayer;
      setEditorInstance(unlayer);
      setIsInitializing(false);
      setIsReady(true);
      templateLoadedRef.current = true;
      
      // Load initial template if provided
      if (initialTemplate && unlayer.editor.loadDesign) {
        try {
          unlayer.editor.loadDesign(initialTemplate);
          prevTemplateRef.current = initialTemplate;
          console.log('✓ Loaded template into Unlayer editor:', {
            rows: initialTemplate.body?.rows?.length || 0,
            hasBody: !!initialTemplate.body,
          });
        } catch (err) {
          console.error('✗ Error loading template:', err);
        }
      }
    }
  }, [initialTemplate]);

  // Load template when initialTemplate changes after editor is ready
  useEffect(() => {
    if (!editorInstance || !isReady) {
      if (!isReady) {
        prevTemplateRef.current = undefined;
        templateLoadedRef.current = false;
      }
      return;
    }
    
    // Check if template actually changed
    const prevTemplateStr = prevTemplateRef.current ? JSON.stringify(prevTemplateRef.current) : 'null';
    const currentTemplateStr = initialTemplate ? JSON.stringify(initialTemplate) : 'null';
    const templateChanged = prevTemplateStr !== currentTemplateStr;
    const needsInitialLoad = !templateLoadedRef.current;
    
    if (templateChanged || needsInitialLoad) {
      const templateToLoad = initialTemplate;
      prevTemplateRef.current = initialTemplate;
      templateLoadedRef.current = true;
      
      try {
        if (editorInstance?.editor?.loadDesign) {
          editorInstance.editor.loadDesign(templateToLoad || {});
          if (templateToLoad) {
            console.log('✓ Loaded template into Unlayer editor:', {
              rows: templateToLoad.body?.rows?.length || 0,
              hasBody: !!templateToLoad.body,
            });
          } else {
            console.log('✓ Loaded blank template into Unlayer editor');
          }
        }
      } catch (err) {
        console.error('✗ Error loading template:', err);
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
          // Unlayer doesn't have a destroy method, just clear the ref
          editorRef.current = null;
          setEditorInstance(null);
        } catch (err) {
          console.error('Error cleaning up Unlayer editor:', err);
        }
      }
    };
  }, []);

  // Editor methods
  const save = useCallback(() => {
    if (editorInstance?.editor?.saveDesign) {
      editorInstance.editor.saveDesign((design: any) => {
        if (editorInstance?.editor?.exportHtml) {
          editorInstance.editor.exportHtml((data: any) => {
            const { design: savedDesign, html } = data;
            onSave?.(savedDesign, html);
          });
        }
      });
    }
  }, [editorInstance, onSave]);

  const exportHtml = useCallback(async (): Promise<string | null> => {
    if (editorInstance?.editor?.exportHtml) {
      return new Promise((resolve) => {
        editorInstance.editor.exportHtml((data: any) => {
          resolve(data.html || null);
        });
      });
    }
    return null;
  }, [editorInstance]);

  const load = useCallback((template: any) => {
    if (editorInstance?.editor?.loadDesign) {
      editorInstance.editor.loadDesign(template || {});
    }
  }, [editorInstance]);

  const preview = useCallback(() => {
    if (editorInstance?.editor?.preview) {
      editorInstance.editor.preview();
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
    setEditorInstance: setEditorInstanceFromExternal,
  };
}
