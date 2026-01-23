/**
 * EmailTemplateEditor Component
 * Main component for the Unlayer (react-email-editor) email template editor
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import EmailEditor from 'react-email-editor';
import type { EditorRef } from 'react-email-editor';
import { useUnlayerEditor, type UseUnlayerEditorOptions } from '@/hooks/useUnlayerEditor';
import { createUnlayerEditorOptions } from '@/lib/unlayerConfig';
import { EditorLoader } from './EditorLoader';
import { EditorError } from './EditorError';

export interface EmailTemplateEditorProps extends Omit<UseUnlayerEditorOptions, 'containerId'> {
  containerId?: string;
  onReady?: () => void;
  onInstanceReady?: (instance: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function EmailTemplateEditor({
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
  const emailEditorRef = useRef<EditorRef>(null);
  const [editorReady, setEditorReady] = useState(false);
  
  // Debug: Log when initialTemplate prop changes
  useEffect(() => {
    console.log('📦 [EmailTemplateEditor] initialTemplate prop changed:', {
      hasTemplate: !!initialTemplate,
      hasBody: !!initialTemplate?.body,
      rowsCount: initialTemplate?.body?.rows?.length || 0,
    });
  }, [initialTemplate]);

  // Track if template has been loaded to prevent duplicate loads
  const templateLoadedRef = useRef(false);
  
  // Initialize editor when EmailEditor is ready
  const handleEditorReady = useCallback((unlayer: any) => {
    if (emailEditorRef.current?.editor || unlayer) {
      setEditorReady(true);
      
      // Get the editor instance from ref or parameter
      const editor = emailEditorRef.current?.editor || unlayer;
      
      if (!editor) return;
      
      // Register image callbacks
      if (uploadImage) {
        editor.registerCallback('image', uploadImage);
      }
      if (selectImage) {
        editor.registerCallback('selectImage', selectImage);
      }
      
      // Load initial template if provided - CRITICAL: This is the main loading point
      if (initialTemplate && editor.loadDesign && !templateLoadedRef.current) {
        // Wait a bit longer to ensure editor is fully initialized
        setTimeout(() => {
          try {
            console.log('🔄 [handleEditorReady] Loading template:', {
              hasBody: !!initialTemplate.body,
              rowsCount: initialTemplate.body?.rows?.length || 0,
              hasRows: !!initialTemplate.body?.rows,
              templateKeys: Object.keys(initialTemplate),
            });
            
            // Validate template structure
            if (!initialTemplate.body) {
              console.error('❌ Template missing body:', initialTemplate);
              return;
            }
            
            if (!initialTemplate.body.rows || initialTemplate.body.rows.length === 0) {
              console.warn('⚠️ Template has no rows, loading empty template');
              editor.loadDesign({ body: { rows: [] } });
              return;
            }
            
            // Load the template
            editor.loadDesign(initialTemplate);
            templateLoadedRef.current = true;
            console.log('✅ [handleEditorReady] Template loaded successfully');
          } catch (error) {
            console.error('❌ [handleEditorReady] Error loading template:', error);
            templateLoadedRef.current = false;
          }
        }, 500); // Increased delay to 500ms
      } else if (!initialTemplate) {
        console.log('ℹ️ [handleEditorReady] No initial template provided');
      }
    }
  }, [uploadImage, selectImage, initialTemplate]);

  const {
    editorInstance,
    isInitializing,
    isReady,
    error,
    save,
    exportHtml,
    load,
    preview,
    setEditorInstance,
  } = useUnlayerEditor({
    initialTemplate,
    mergeTags,
    onSave,
    onChange,
    onLoad: (design) => {
      onLoad?.(design);
      onReady?.();
    },
    onError: (errorMessage) => {
      onErrorProp?.(errorMessage);
    },
    uploadImage,
    selectImage,
    enabled: enabled && editorReady,
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
    }
  }, [editorInstance, isReady, onReady, onInstanceReady]);

  // Create editor options
  const editorOptions = createUnlayerEditorOptions(mergeTags);

  // Store editor instance when ready and expose to parent
  useEffect(() => {
    if (editorReady && emailEditorRef.current?.editor) {
      const unlayer = {
        editor: emailEditorRef.current.editor,
      };
      // Set editor instance in hook
      setEditorInstance(unlayer);
      
      // Store instance for parent access
      if (onInstanceReady) {
        onInstanceReady(unlayer);
      }
    }
  }, [editorReady, setEditorInstance, onInstanceReady]);

  // Load template when initialTemplate changes after editor is ready
  // This handles cases where template arrives after editor is ready
  useEffect(() => {
    if (editorReady && emailEditorRef.current?.editor && initialTemplate && !templateLoadedRef.current) {
      const editor = emailEditorRef.current.editor;
      
      // Use a delay to ensure editor is fully initialized
      const timeoutId = setTimeout(() => {
        try {
          console.log('🔄 [useEffect] Loading template into editor:', {
            hasBody: !!initialTemplate.body,
            rowsCount: initialTemplate.body?.rows?.length || 0,
            hasRows: !!initialTemplate.body?.rows,
            templateKeys: Object.keys(initialTemplate),
          });
          
          // Verify template structure
          if (!initialTemplate.body) {
            console.error('❌ [useEffect] Template missing body:', initialTemplate);
            return;
          }
          
          if (!initialTemplate.body.rows || initialTemplate.body.rows.length === 0) {
            console.warn('⚠️ [useEffect] Template has no rows');
            return;
          }
          
          editor.loadDesign(initialTemplate);
          templateLoadedRef.current = true;
          console.log('✅ [useEffect] Template loaded successfully');
        } catch (error) {
          console.error('❌ [useEffect] Error loading template:', error);
          templateLoadedRef.current = false;
        }
      }, 600);
      
      return () => clearTimeout(timeoutId);
    }
  }, [initialTemplate, editorReady]);
  
  // Reset template loaded flag when initialTemplate changes significantly
  const prevTemplateRef = useRef<any>(null);
  useEffect(() => {
    const templateChanged = JSON.stringify(prevTemplateRef.current) !== JSON.stringify(initialTemplate);
    if (templateChanged) {
      templateLoadedRef.current = false;
      prevTemplateRef.current = initialTemplate;
      console.log('🔄 Template changed, resetting loaded flag');
    }
  }, [initialTemplate]);

  // Container ref for direct height calculation
  const containerRef = useRef<HTMLDivElement>(null);

  // Add class to body to prevent scrolling when editor is mounted
  useEffect(() => {
    document.body.classList.add('email-editor-page');
    return () => {
      document.body.classList.remove('email-editor-page');
    };
  }, []);

  // Calculate and apply height based on available space
  useEffect(() => {
    const calculateAndApplyHeight = () => {
      if (!containerRef.current) return;

      // Get viewport height
      const viewportHeight = window.innerHeight;
      
      // Find the header element - look for the header with border-b and shrink-0
      let headerHeight = 0;
      const headerSelectors = [
        '[class*="border-b"][class*="shrink-0"]',
        'header',
        '[class*="Header"]',
        '.bg-card.border-b'
      ];
      
      for (const selector of headerSelectors) {
        const header = document.querySelector(selector) as HTMLElement;
        if (header) {
          const rect = header.getBoundingClientRect();
          if (rect.height > 0 && rect.height < 300) {
            headerHeight = rect.height;
            break;
          }
        }
      }

      // Calculate available height: viewport - header - small buffer
      // Subtract an extra buffer (64px) to avoid page scroll bars
      const calculatedHeight = viewportHeight - (headerHeight || 180) - 120; // Increased buffer to prevent scrolling

      // Also try to get parent's actual height as a secondary check
      const parent = containerRef.current.parentElement;
      let parentHeight = 0;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        parentHeight = parentRect.height;
      }

      // Use the larger of calculated height or parent height (but prefer calculated)
      // This ensures we get the full available space
      const fixedHeight = Math.max(
        calculatedHeight, // Primary: viewport - header
        parentHeight > 200 ? parentHeight : calculatedHeight // Secondary: parent if valid
      );

      // Ensure minimum height for usability
      if (fixedHeight < 400) {
        console.warn('Editor height too small, using minimum');
        return;
      }
      
      // Apply height to container and all children
      applyHeightToChildren(containerRef.current, fixedHeight);
    };

    // Helper function to apply height to container and all children
    const applyHeightToChildren = (container: HTMLElement, height: number) => {
      // Force height on container - use CSS custom property for global access
      container.style.setProperty('--editor-height', `${height}px`);
      container.style.height = `${height}px`;
      container.style.minHeight = `${height}px`;
      container.style.maxHeight = `${height}px`;
      container.style.display = 'flex';
      container.style.flexDirection = 'column';

      // Apply to ALL nested divs recursively
      const allDivs = container.querySelectorAll('div');
      allDivs.forEach((div) => {
        const computedStyle = window.getComputedStyle(div);
        const divEl = div as HTMLElement;
        
        // Skip absolutely positioned elements
        if (computedStyle.position === 'absolute' || computedStyle.position === 'fixed') {
          return;
        }
        
        // Force height on all other divs
        divEl.style.height = `${height}px`;
        divEl.style.minHeight = `${height}px`;
        divEl.style.display = 'flex';
        divEl.style.flexDirection = 'column';
      });

      // Apply to ALL iframes - THIS IS THE CRITICAL FIX
      const allIframes = container.querySelectorAll('iframe');
      allIframes.forEach((iframe) => {
        const iframeEl = iframe as HTMLElement;
        iframeEl.style.height = `${height}px`;
        iframeEl.style.minHeight = `${height}px`;
        iframeEl.style.maxHeight = `${height}px`;
        iframeEl.style.display = 'block';
        iframeEl.style.width = '100%';
        iframeEl.style.border = 'none';
        
        // Also set height when iframe loads
        iframe.addEventListener('load', () => {
          iframeEl.style.height = `${height}px`;
          iframeEl.style.minHeight = `${height}px`;
          iframeEl.style.maxHeight = `${height}px`;
        }, { once: true });
      });
    };

    // Calculate immediately
    calculateAndApplyHeight();

    // Recalculate on window resize
    window.addEventListener('resize', calculateAndApplyHeight);
    
    // Recalculate after delays to catch dynamically created elements
    const timeouts = [
      setTimeout(calculateAndApplyHeight, 100),
      setTimeout(calculateAndApplyHeight, 300),
      setTimeout(calculateAndApplyHeight, 500),
      setTimeout(calculateAndApplyHeight, 1000),
      setTimeout(calculateAndApplyHeight, 2000),
    ];

    // Use ResizeObserver for container
    const resizeObserver = new ResizeObserver(() => {
      calculateAndApplyHeight();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Use MutationObserver to catch DOM changes
    const mutationObserver = new MutationObserver(() => {
      calculateAndApplyHeight();
    });

    if (containerRef.current) {
      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'height'],
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', calculateAndApplyHeight);
      timeouts.forEach(clearTimeout);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [editorReady]);

  if (!enabled) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Editor is disabled</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Unlayer Editor CSS Fixes */}
      <style>{`
        /* Ensure Unlayer editor container takes full height */
        .email-editor-container {
          position: relative !important;
          overflow: hidden !important;
          height: var(--editor-height, calc(100vh - 300px)) !important;
          min-height: var(--editor-height, calc(100vh - 300px)) !important;
          max-height: var(--editor-height, calc(100vh - 300px)) !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Prevent page scrolling only when editor is mounted */
        body.email-editor-page {
          overflow: hidden !important;
          height: 100vh !important;
        }

        /* Target all nested divs in the container */
        .email-editor-container > div,
        .email-editor-container > div > div,
        .email-editor-container > div > div > div,
        .email-editor-container div[style*="height"],
        .email-editor-container div[style*="min-height"] {
          height: 100% !important;
          min-height: 100% !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }

        /* Ensure all iframes take full height - CRITICAL FIX */
        .email-editor-container iframe,
        .email-editor-container > div iframe,
        .email-editor-container > div > div iframe,
        .email-editor-container > div > div > div iframe,
        iframe[src*="unlayer"],
        iframe[src*="editor.unlayer.com"],
        iframe[src*="unlayer.com"] {
          height: 100% !important;
          min-height: 100% !important;
          max-height: 100% !important;
          width: 100% !important;
          border: none !important;
          display: block !important;
          flex: 1 1 auto !important;
          position: relative !important;
        }

        /* Fix for react-email-editor wrapper */
        [data-testid="email-editor"],
        [data-testid="email-editor"] > div,
        [data-testid="email-editor"] > div > div {
          height: 100% !important;
          min-height: 100% !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }

        /* Fix for editor panels and content area */
        .unlayer-editor,
        .unlayer-editor * {
          box-sizing: border-box !important;
        }

        /* Ensure proper flex layout for all nested elements */
        .email-editor-container > div {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          min-height: 100% !important;
          flex: 1 !important;
        }
      `}</style>
      <div 
        className={`w-full h-full ${className}`} 
        style={{ 
          height: '100%', 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Editor Container */}
        <div 
          ref={containerRef}
          style={{ 
            flex: '1 1 auto', 
            minHeight: 0,
            position: 'relative', 
            width: '100%', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }} 
          className="email-editor-container"
        >
          <EmailEditor
            ref={emailEditorRef}
            onLoad={handleEditorReady}
            style={{ 
              height: '100%', 
              width: '100%', 
              minHeight: '100%',
              maxHeight: '100%',
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column'
            }}
            options={editorOptions}
          />
        </div>

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
    </>
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
