/**
 * EditorHeader Component
 * Header toolbar with template name, status, and primary actions
 */

import { ArrowLeft, Save, Eye, Undo2, Redo2, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface EditorHeaderProps {
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  isSaved: boolean;
  lastSaved?: Date | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onPreview: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onExport?: () => void;
  onExit: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function EditorHeader({
  templateName,
  onTemplateNameChange,
  isSaved,
  lastSaved,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onPreview,
  onUndo,
  onRedo,
  onExport,
  onExit,
  canUndo = false,
  canRedo = false,
}: EditorHeaderProps) {
  return (
    <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Back button and Template Name */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onExit}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <Label htmlFor="template-name" className="sr-only">
                Template Name
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => onTemplateNameChange(e.target.value)}
                placeholder="Untitled Template"
                className="text-lg sm:text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0 h-auto py-0 max-w-md"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Right: Status and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 w-full sm:w-auto">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              {hasUnsavedChanges ? (
                <div className="flex items-center gap-1.5 text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Unsaved changes</span>
                  {lastSaved && (
                    <span className="hidden sm:inline text-gray-500">
                      (Autosaved {lastSaved.toLocaleTimeString()})
                    </span>
                  )}
                </div>
              ) : isSaved && lastSaved ? (
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Undo/Redo */}
              {onUndo && onRedo && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo || isSaving}
                    className="hidden sm:flex"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo || isSaving}
                    className="hidden sm:flex"
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Export */}
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  disabled={isSaving}
                  className="hidden sm:flex"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export HTML
                </Button>
              )}

              {/* Preview */}
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                disabled={isSaving}
              >
                <Eye className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>

              {/* Save */}
              <Button
                onClick={onSave}
                disabled={isSaving}
                size="sm"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
