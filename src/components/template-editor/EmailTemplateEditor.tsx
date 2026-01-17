/**
 * EmailTemplateEditor Component
 * Main component for the BeeFree email template editor
 */

import { useRef, useEffect, useCallback } from 'react';
import { useBeeEditor, type UseBeeEditorOptions } from '@/hooks/useBeeEditor';
import { EditorLoader } from './EditorLoader';
import { EditorError } from './EditorError';

export interface EmailTemplateEditorProps extends Omit<UseBeeEditorOptions, 'containerId'> {
  containerId?: string;
  onReady?: () => void;
  onInstanceReady?: (instance: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function EmailTemplateEditor({
  containerId = 'bee-plugin-container',
  initialTemplate = null,
  mergeTags = [],
  onSave,
  onChange,
  onLoad,
  onError: onErrorProp,
  uploadImage,
  selectImage,
  enabled = true,
  onReady,
  onInstanceReady,
  className = '',
}: EmailTemplateEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    editorInstance,
    isInitializing,
    isReady,
    error,
    save,
    exportHtml,
    load,
    preview,
  } = useBeeEditor({
    containerId,
    initialTemplate,
    mergeTags,
    onSave,
    onChange,
    onLoad: (jsonFile) => {
      onLoad?.(jsonFile);
      onReady?.();
    },
    onError: (errorMessage) => {
      onErrorProp?.(errorMessage);
    },
    uploadImage,
    selectImage,
    enabled,
  });

  // Expose editor instance when ready
  useEffect(() => {
    if (isReady && editorInstance) {
      // Pass editor instance to parent if callback provided
      if (onInstanceReady) {
        onInstanceReady(editorInstance);
      }
      // Call onReady if provided
      if (onReady) {
        onReady();
      }
      // Also store in container element for external access if needed
      if (containerRef.current) {
        const element = containerRef.current as any;
        element._beeEditorInstance = editorInstance;
      }
    }
  }, [editorInstance, isReady, onReady, onInstanceReady]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Editor Container */}
      <div
        id={containerId}
        ref={containerRef}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
          position: 'relative',
        }}
      />

      {/* Loading State */}
      {isInitializing && <EditorLoader />}

      {/* Error State */}
      {error && !isInitializing && (
        <EditorError
          error={error}
          onRetry={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// Export editor methods for external use
export type EmailTemplateEditorRef = {
  save: () => void;
  exportHtml: () => Promise<string | null>;
  load: (template: any) => void;
  preview: () => void;
  getInstance: () => any;
};
