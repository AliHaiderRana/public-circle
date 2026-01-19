import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import {
  updateUser,
  addOrUpdateCompanyLogo,
  deleteCompanyLogoApi,
  changeCompanyStatus,
} from '@/actions/signup';
import { signOut } from '@/auth/actions/auth';
import { toast } from 'sonner';
import { XCircle, Upload, Trash2 } from 'lucide-react';
import { paths } from '@/routes/paths';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

export default function OrganizationSettingsPage() {
  const navigate = useNavigate();
  const { user, checkUserSession } = useAuthContext();
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoSubmitting, setIsLogoSubmitting] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(user?.company?.logo || '');
  const [openSuspendDialog, setOpenSuspendDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateUser({
        companyName: formData.get('companyName'),
        companySize: formData.get('companySize'),
        country: formData.get('country'),
        province: formData.get('state'),
        city: formData.get('city'),
        address: formData.get('address'),
        postalCode: formData.get('postalCode'),
      });
      await checkUserSession?.();
      toast.success('Organization settings updated successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!companyLogo) {
      toast.error('Please select a logo file');
      return;
    }

    setIsLogoSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('companyLogo', companyLogo);
      const result = await addOrUpdateCompanyLogo(formData);
      if (result?.status === 200 || result?.data) {
        toast.success('Company logo uploaded successfully');
        setCompanyLogoUrl(result?.data?.data?.companyLogo || result?.data?.companyLogo || '');
        setCompanyLogo(null);
        await checkUserSession?.();
      }
    } catch (error: any) {
      // Error already handled in action
    } finally {
      setIsLogoSubmitting(false);
    }
  };

  const handleDeleteLogo = async () => {
    setIsDeletingLogo(true);
    try {
      const result = await deleteCompanyLogoApi();
      if (result?.status === 200 || result?.data) {
        toast.success('Company logo deleted successfully');
        setCompanyLogoUrl('');
        setCompanyLogo(null);
        await checkUserSession?.();
      }
    } catch (error: any) {
      // Error already handled in action
    } finally {
      setIsDeletingLogo(false);
    }
  };

  const handleSuspendAccount = async () => {
    setIsChangingStatus(true);
    try {
      const result = await changeCompanyStatus({ status: 'SUSPENDED' });
      if (result?.status === 200 || result?.data) {
        toast.success('Account suspended successfully');
        setOpenSuspendDialog(false);
        setTimeout(async () => {
          await signOut();
          navigate('/auth/jwt/sign-in');
        }, 1000);
      }
    } catch (error: any) {
      // Error already handled in action
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsChangingStatus(true);
    try {
      const result = await changeCompanyStatus({ status: 'DELETED' });
      if (result?.status === 200 || result?.data) {
        toast.success('Account deleted successfully');
        setOpenDeleteDialog(false);
        setTimeout(async () => {
          await signOut();
          navigate('/auth/jwt/sign-in');
        }, 1000);
      }
    } catch (error: any) {
      // Error already handled in action
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your organization settings and information</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your company information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  defaultValue={user?.company?.name || ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select name="companySize" defaultValue={user?.company?.companySize || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={user?.company?.country || ''}
                  placeholder="Enter country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={user?.company?.province || ''}
                  placeholder="Enter state or province"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={user?.company?.city || ''}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  defaultValue={user?.company?.postalCode || ''}
                  placeholder="Enter postal code"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={user?.company?.address || ''}
                placeholder="Street address or post office box"
              />
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Company Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>Upload or update your company logo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {companyLogoUrl && (
              <div className="relative">
                <img
                  src={companyLogoUrl}
                  alt="Company Logo"
                  className="h-24 w-24 object-contain border rounded"
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Label htmlFor="logo-upload">Logo File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCompanyLogo(file);
                    }
                  }}
                  className="flex-1"
                />
                {companyLogo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setCompanyLogo(null)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Allowed: JPEG, JPG, PNG, GIF. Max size: 3MB
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {companyLogoUrl && (
              <Button
                variant="outline"
                onClick={handleDeleteLogo}
                disabled={isDeletingLogo}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeletingLogo ? 'Deleting...' : 'Delete Logo'}
              </Button>
            )}
            <Button
              onClick={handleLogoUpload}
              disabled={!companyLogo || isLogoSubmitting}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLogoSubmitting ? 'Uploading...' : companyLogoUrl ? 'Update Logo' : 'Upload Logo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Suspending your account will temporarily deactivate it. Deleting your account will permanently remove all data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpenSuspendDialog(true)}
              className="text-destructive"
            >
              Suspend Account
            </Button>
            <Button
              variant="destructive"
              onClick={() => setOpenDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suspend Dialog */}
      <Dialog open={openSuspendDialog} onOpenChange={setOpenSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Suspension</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend your account? You can reactivate it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenSuspendDialog(false)}
              disabled={isChangingStatus}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendAccount}
              disabled={isChangingStatus}
            >
              {isChangingStatus ? 'Suspending...' : 'Suspend Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone and all data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
              disabled={isChangingStatus}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isChangingStatus}
            >
              {isChangingStatus ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
