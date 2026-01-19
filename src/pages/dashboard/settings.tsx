import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { updateUser } from '@/actions/signup';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { paths } from '@/routes/paths';
import { Eye, EyeOff, Globe } from 'lucide-react';
import { REGION_KEY } from '@/config/config';

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

  // Password change
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Region/Currency
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    return localStorage.getItem(REGION_KEY) || 'US';
  });
  const [isSavingRegion, setIsSavingRegion] = useState(false);

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

  const handleRegionChange = async (region: string) => {
    setIsSavingRegion(true);
    try {
      const currency = region.toUpperCase() === 'CA' ? 'CAD' : 'USD';
      localStorage.setItem(REGION_KEY, region);
      setSelectedRegion(region);
      
      // Update user's currency preference
      await updateUser({ currency });
      await checkUserSession?.();
      
      toast.success('Region and currency updated successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update region');
    } finally {
      setIsSavingRegion(false);
    }
  };

  const currentCurrency = selectedRegion.toUpperCase() === 'CA' ? 'CAD' : 'USD';
  const currentRegionName = selectedRegion.toUpperCase() === 'CA' ? 'Canada' : 'United States';

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Check for password requirements
    const hasUpperCase = /[A-Z]/.test(passwordForm.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordForm.newPassword);
    const hasNumber = /[0-9]/.test(passwordForm.newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(passwordForm.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      toast.error('Password must include uppercase, lowercase, number, and special character');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updateUser({
        password: passwordForm.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Region & Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Region & Currency</CardTitle>
          <CardDescription>Select your region to set the currency for pricing and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select
              value={selectedRegion}
              onValueChange={handleRegionChange}
              disabled={isSavingRegion}
            >
              <SelectTrigger id="region" className="w-full sm:w-[300px]">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select region" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">
                  <div className="flex items-center gap-2">
                    <span>🇺🇸</span>
                    <span>United States (USD)</span>
                  </div>
                </SelectItem>
                <SelectItem value="CA">
                  <div className="flex items-center gap-2">
                    <span>🇨🇦</span>
                    <span>Canada (CAD)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current region: <strong>{currentRegionName}</strong> | Currency: <strong>{currentCurrency}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Changing your region will update pricing and billing currency. This may affect your subscription.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
