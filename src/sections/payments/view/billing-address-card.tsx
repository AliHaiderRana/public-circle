import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingButton } from '@/components/ui/loading-button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from '@/lib/api';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { MapPin, Edit2, CheckCircle2 } from 'lucide-react';

// ----------------------------------------------------------------------

const billingAddressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

type BillingAddressFormData = z.infer<typeof billingAddressSchema>;

// ----------------------------------------------------------------------

export function BillingAddressCard() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [billingAddress, setBillingAddress] = useState<BillingAddressFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BillingAddressFormData>({
    resolver: zodResolver(billingAddressSchema),
  });

  // Fetch company/billing address
  const fetchBillingAddress = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/users/me');
      if (response.data?.data?.company) {
        const company = response.data.data.company;
        const address: BillingAddressFormData = {
          address: company.address || '',
          city: company.city || '',
          province: company.province || '',
          postalCode: company.postalCode || '',
          country: company.country || '',
        };
        setBillingAddress(address);
        reset(address);
      }
    } catch (error) {
      console.error('Error fetching billing address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load address on mount
  useEffect(() => {
    fetchBillingAddress();
  }, []);

  const onSubmit = async (data: BillingAddressFormData) => {
    setIsSaving(true);
    try {
      // Update company information
      const response = await axios.patch('/users/me', {
        company: {
          address: data.address,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
          country: data.country,
        },
      });

      if (response.status === 200) {
        toast.success('Billing address updated successfully');
        setBillingAddress(data);
        setEditDialogOpen(false);
        await mutate('/users/me');
      }
    } catch (error: any) {
      console.error('Error updating billing address:', error);
      toast.error(error?.response?.data?.message || 'Failed to update billing address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    if (billingAddress) {
      setValue('address', billingAddress.address);
      setValue('city', billingAddress.city);
      setValue('province', billingAddress.province || '');
      setValue('postalCode', billingAddress.postalCode);
      setValue('country', billingAddress.country);
    }
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasAddress = billingAddress && Object.values(billingAddress).some((v) => v);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Billing Address</CardTitle>
              <CardDescription>Your billing address for invoices and receipts</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              {hasAddress ? 'Edit' : 'Add'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasAddress ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{billingAddress.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {billingAddress.city}
                    {billingAddress.province && `, ${billingAddress.province}`}
                    {billingAddress.postalCode && ` ${billingAddress.postalCode}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{billingAddress.country}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No billing address on file</p>
              <Button variant="outline" onClick={handleEdit}>
                Add Billing Address
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Billing Address Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{hasAddress ? 'Edit' : 'Add'} Billing Address</DialogTitle>
            <DialogDescription>
              Update your billing address. This will be used for invoices and receipts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="123 Main Street"
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register('city')} placeholder="New York" />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">State/Province</Label>
                  <Input id="province" {...register('province')} placeholder="NY" />
                  {errors.province && (
                    <p className="text-sm text-destructive">{errors.province.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" {...register('postalCode')} placeholder="10001" />
                  {errors.postalCode && (
                    <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" {...register('country')} placeholder="United States" />
                  {errors.country && (
                    <p className="text-sm text-destructive">{errors.country.message}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <LoadingButton type="submit" loading={isSaving}>
                Save Address
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
