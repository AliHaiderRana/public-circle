/**
 * Unlayer Editor Configuration
 * Centralized configuration for the Unlayer (react-email-editor) email template editor
 */

export interface UnlayerEditorOptions {
  projectId: number;
  version?: string;
  appearance?: {
    theme?: 'light' | 'dark' | 'modern_light' | 'modern_dark';
    panels?: {
      tools?: {
        dock?: 'left' | 'right';
        collapsible?: boolean;
      };
    };
    hideBranding?: boolean;
  };
  tools?: {
    button?: {
      properties?: {
        textAlign?: {
          editor?: {
            enabled?: boolean;
          };
        };
      };
    };
  };
  mergeTagsConfig?: {
    autocompleteTriggerChar?: string;
  };
  mergeTags?: Record<string, { name: string; value: string; style?: Record<string, any> }>;
}

export interface UnlayerEditorCallbacks {
  onSave?: (design: any) => void;
  onLoad?: (design: any) => void;
  onChange?: (design: any) => void;
  onError?: (error: any) => void;
}

/**
 * Get Unlayer project ID from environment
 */
export function getUnlayerProjectId(): number {
  const projectId = import.meta.env.VITE_UNLAYER_PROJECT_ID || '272671';
  return parseInt(projectId, 10);
}

/**
 * Create Unlayer editor options
 */
export function createUnlayerEditorOptions(
  mergeTags: Array<{ name: string; value: string; style?: Record<string, any> }> = [],
  callbacks: UnlayerEditorCallbacks = {}
): UnlayerEditorOptions {
  // Convert merge tags array to object format for Unlayer
  const mergeTagsObject: Record<string, { name: string; value: string; style?: Record<string, any> }> = {};
  mergeTags.forEach((tag) => {
    const key = tag.name || tag.value.replace(/[{}]/g, '');
    mergeTagsObject[key] = {
      name: tag.name || key,
      value: tag.value || `{{${key}}}`,
      style: tag.style || { color: '#3b82f6', fontWeight: 'bold' },
    };
  });

  return {
    projectId: getUnlayerProjectId(),
    version: '1.63.2', // Match the version from migration plan
    appearance: {
      theme: 'modern_light',
      panels: {
        tools: {
          collapsible: false,
        },
      },
      hideBranding: true,
    },
    tools: {
      button: {
        properties: {
          textAlign: {
            editor: {
              enabled: false,
            },
          },
        },
      },
    },
    mergeTagsConfig: {
      autocompleteTriggerChar: '@',
    },
    mergeTags: mergeTagsObject,
  };
}
