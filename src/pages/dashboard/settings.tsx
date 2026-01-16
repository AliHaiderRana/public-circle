import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { updateUser } from '@/actions/signup';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, checkUserSession } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Email preferences
  const [emailMarketing, setEmailMarketing] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  // Notification preferences
  const [notifyCampaigns, setNotifyCampaigns] = useState(true);
  const [notifySystem, setNotifySystem] = useState(true);
  const [notifyBilling, setNotifyBilling] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Load preferences from localStorage or user preferences
    const savedEmailMarketing = localStorage.getItem('emailMarketing') !== 'false';
    const savedEmailUpdates = localStorage.getItem('emailUpdates') !== 'false';
    const savedEmailDigest = localStorage.getItem('emailDigest') === 'true';
    const savedNotifyCampaigns = localStorage.getItem('notifyCampaigns') !== 'false';
    const savedNotifySystem = localStorage.getItem('notifySystem') !== 'false';
    const savedNotifyBilling = localStorage.getItem('notifyBilling') !== 'false';

    setEmailMarketing(savedEmailMarketing);
    setEmailUpdates(savedEmailUpdates);
    setEmailDigest(savedEmailDigest);
    setNotifyCampaigns(savedNotifyCampaigns);
    setNotifySystem(savedNotifySystem);
    setNotifyBilling(savedNotifyBilling);
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateUser({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
      });
      await checkUserSession?.();
      toast.success('Settings updated successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailPreferenceChange = (key: string, value: boolean) => {
    localStorage.setItem(key, value.toString());
    if (key === 'emailMarketing') setEmailMarketing(value);
    if (key === 'emailUpdates') setEmailUpdates(value);
    if (key === 'emailDigest') setEmailDigest(value);
    toast.success('Email preferences updated');
  };

  const handleNotificationPreferenceChange = (key: string, value: boolean) => {
    localStorage.setItem(key, value.toString());
    if (key === 'notifyCampaigns') setNotifyCampaigns(value);
    if (key === 'notifySystem') setNotifySystem(value);
    if (key === 'notifyBilling') setNotifyBilling(value);
    toast.success('Notification preferences updated');
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success('Theme preference updated');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={user?.firstName || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={user?.lastName || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.emailAddress || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>Manage your email notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-marketing">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about new features and product updates
              </p>
            </div>
            <Switch
              id="email-marketing"
              checked={emailMarketing}
              onCheckedChange={(checked) => handleEmailPreferenceChange('emailMarketing', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-updates">Account Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive important account and security notifications
              </p>
            </div>
            <Switch
              id="email-updates"
              checked={emailUpdates}
              onCheckedChange={(checked) => handleEmailPreferenceChange('emailUpdates', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-digest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your campaign performance
              </p>
            </div>
            <Switch
              id="email-digest"
              checked={emailDigest}
              onCheckedChange={(checked) => handleEmailPreferenceChange('emailDigest', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Control which notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-campaigns">Campaign Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about campaign status changes and completions
              </p>
            </div>
            <Switch
              id="notify-campaigns"
              checked={notifyCampaigns}
              onCheckedChange={(checked) => handleNotificationPreferenceChange('notifyCampaigns', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-system">System Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive system alerts and important updates
              </p>
            </div>
            <Switch
              id="notify-system"
              checked={notifySystem}
              onCheckedChange={(checked) => handleNotificationPreferenceChange('notifySystem', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-billing">Billing Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about subscription and billing updates
              </p>
            </div>
            <Switch
              id="notify-billing"
              checked={notifyBilling}
              onCheckedChange={(checked) => handleNotificationPreferenceChange('notifyBilling', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Theme Preference */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Preference</CardTitle>
          <CardDescription>Choose your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          {mounted && (
            <RadioGroup
              value={theme || 'light'}
              onValueChange={handleThemeChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light" className="font-normal cursor-pointer">
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark" className="font-normal cursor-pointer">
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system" className="font-normal cursor-pointer">
                  System
                </Label>
              </div>
            </RadioGroup>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
