/**
 * TemplatePreviewDrawer Component
 * Drawer component for previewing email templates with desktop/mobile views
 * Includes sample user selection for dynamic variable replacement
 */

import { useState, useEffect, useMemo } from 'react';
import { Monitor, Smartphone, Loader2, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import DOMPurify from 'dompurify';
import { getTemplateById } from '@/actions/templates';
import { getAllUsers } from '@/actions/users';
import { getFilterKeys } from '@/actions/filters';
import { cn } from '@/lib/utils';

export interface TemplatePreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
  htmlContent?: string;
}

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  'First Name'?: string;
  'Last Name'?: string;
  email?: string;
  [key: string]: any;
}

function processTemplateWithUserData(html: string, selectedUser: User | null, filterKeysData: string[]): string {
  if (!html || !selectedUser || !filterKeysData?.length) return html;

  const userFields: Record<string, string> = {};
  filterKeysData.forEach((key) => {
    userFields[key] = selectedUser[key] || '';
  });

  return Object.keys(userFields).reduce((processedHtml, key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    return processedHtml.replace(regex, userFields[key]);
  }, html);
}

export function TemplatePreviewDrawer({
  open,
  onOpenChange,
  templateId,
  htmlContent,
}: TemplatePreviewDrawerProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users and filter keys
  const { allUsers, isLoading: usersLoading } = getAllUsers(1, 100); // Get up to 100 users for selection
  const { filterKeysData } = getFilterKeys();

  const filterKeys = useMemo(() => {
    return filterKeysData?.data || [];
  }, [filterKeysData]);

  // Get user list
  const users = useMemo(() => {
    return Array.isArray(allUsers) ? allUsers : [];
  }, [allUsers]);

  // Auto-select first user when users are loaded
  useEffect(() => {
    if (users.length > 0 && !selectedUser && open) {
      setSelectedUser(users[0]);
    }
  }, [users, selectedUser, open]);

  useEffect(() => {
    if (open && templateId && !htmlContent) {
      // Fetch template if only ID is provided
      setIsLoading(true);
      getTemplateById(templateId)
        .then((response) => {
          if (response?.status === 200 && response.data?.data) {
            const template = response.data.data;
            setTemplateHtml(template.body || template.html || '');
          } else {
            setTemplateHtml('');
          }
        })
        .catch((error) => {
          console.error('Error fetching template:', error);
          setTemplateHtml('');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (htmlContent) {
      setTemplateHtml(htmlContent);
    } else {
      setTemplateHtml('');
    }
  }, [open, templateId, htmlContent]);

  const cleanHtmlForMobile = (html: string): string => {
    // Remove fixed widths and heights that break mobile layout
    let cleaned = html.replace(/(width|max-width|height|max-height)="[^"]*"/gi, '');
    cleaned = cleaned.replace(/(width|max-width|height|max-height)\s*:\s*[^;]+;?/gi, '');
    return cleaned;
  };

  // Process template with user data replacement
  const processedTemplateHtml = useMemo(() => {
    const processed = processTemplateWithUserData(templateHtml, selectedUser, filterKeys);
    return device === 'mobile' ? cleanHtmlForMobile(processed) : processed;
  }, [templateHtml, selectedUser, filterKeys, device]);

  const getUserDisplayLabel = (user: User): string => {
    const firstName = user.firstName || user.first_name || user['First Name'] || '';
    const lastName = user.lastName || user.last_name || user['Last Name'] || '';

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (user.email) {
      return user.email;
    } else if (user._id) {
      return user._id;
    }
    return 'Unknown User';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-full md:w-[90vw] lg:w-[85vw] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <SheetTitle>Template Preview</SheetTitle>
              <SheetDescription>
                Preview how your template will look to recipients
              </SheetDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* Sample User Selection */}
              <div className="flex items-center gap-2 min-w-[200px]">
                <Label htmlFor="sample-user" className="text-sm whitespace-nowrap">
                  Sample user:
                </Label>
                <Select
                  value={selectedUser?._id || ''}
                  onValueChange={(value) => {
                    const user = users.find((u) => u._id === value);
                    setSelectedUser(user || null);
                  }}
                  disabled={usersLoading || users.length === 0}
                >
                  <SelectTrigger id="sample-user" className="w-full">
                    <SelectValue placeholder={usersLoading ? 'Loading...' : 'Select user'}>
                      {selectedUser ? getUserDisplayLabel(selectedUser) : 'Select user'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {usersLoading ? (
                      <SelectItem value="__loading__" disabled>
                        Loading users...
                      </SelectItem>
                    ) : users.length === 0 ? (
                      <SelectItem value="__no_users__" disabled>
                        No users found
                      </SelectItem>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {getUserDisplayLabel(user)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Device Toggle */}
              <Tabs value={device} onValueChange={(v) => setDevice(v as 'desktop' | 'mobile')}>
                <TabsList>
                  <TabsTrigger value="desktop" className="gap-2">
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden bg-gray-50 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !templateHtml ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No template selected</p>
                <p className="text-sm">Select a template to preview</p>
              </div>
            </div>
          ) : (
            <>
              <style>{`
                .preview-mobile, .preview-mobile * {
                  max-width: 100% !important;
                  box-sizing: border-box !important;
                }
                .preview-mobile table {
                  width: 100% !important;
                  table-layout: fixed !important;
                }
                .preview-mobile img {
                  max-width: 100% !important;
                  height: auto !important;
                  display: block !important;
                }
                .preview-mobile td {
                  word-break: break-word !important;
                  overflow-wrap: break-word !important;
                }
                .preview-mobile .footer-flex-responsive {
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  justify-content: center !important;
                  width: 100% !important;
                  gap: 8px !important;
                  padding: 12px 10px !important;
                }
                .preview-mobile .footer-poweredby {
                  display: flex !important;
                  flex-direction: row !important;
                  align-items: center !important;
                  justify-content: center !important;
                  width: 100% !important;
                  text-align: center !important;
                  gap: 4px !important;
                  font-size: 14px !important;
                  color: #fff !important;
                  flex-wrap: wrap !important;
                  white-space: normal !important;
                }
                .preview-mobile .footer-poweredby > a {
                  display: inline-flex !important;
                  align-items: center !important;
                  gap: 4px !important;
                  margin: 0 !important;
                  color: #fff !important;
                  text-decoration: none !important;
                }
                .preview-mobile .footer-poweredby img[alt="Public Circles"] {
                  height: 20px !important;
                  width: auto !important;
                  max-width: 120px !important;
                  margin: 0 !important;
                  vertical-align: middle !important;
                  display: inline-block !important;
                  background-color: transparent !important;
                }
                .preview-mobile .footer-poweredby span {
                  color: #fff !important;
                  font-size: 14px !important;
                  vertical-align: middle !important;
                  white-space: normal !important;
                }
                .preview-mobile .separator-dot {
                  display: none !important;
                }
                .preview-mobile a[href*="unsubscribe"],
                .preview-mobile a[href*="Unsubscribe"] {
                  color: #fff !important;
                  text-decoration: underline !important;
                  white-space: normal !important;
                  word-break: break-word !important;
                }
                .preview-mobile tbody[style*="background-color: #000000"],
                .preview-mobile tbody[style*="background-color:#000000"],
                .preview-mobile tbody[style*="background-color: black"],
                .preview-mobile tbody[style*="background-color:black"] {
                  width: 100% !important;
                  max-width: 100% !important;
                }
              `}</style>
              <div className="h-full overflow-auto">
                <div
                  className={cn(
                    'mx-auto bg-white shadow-lg',
                    device === 'mobile' ? 'max-w-sm preview-mobile' : 'max-w-4xl'
                  )}
                  style={{
                    transform: device === 'mobile' ? 'scale(0.8)' : 'scale(1)',
                    transformOrigin: 'top center',
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(processedTemplateHtml, {
                        WHOLE_DOCUMENT: true,
                        ADD_TAGS: ['style'],
                        ADD_ATTR: ['style'],
                      }),
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}