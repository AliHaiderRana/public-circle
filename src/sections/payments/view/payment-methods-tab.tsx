import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  getPaymentMethods,
  deleteCard,
  setDefaultPaymentMethod,
} from '@/actions/payments';
import { toast } from 'sonner';
import { Plus, Trash2, Star, Loader2, CreditCard } from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from '@/lib/api';

// ----------------------------------------------------------------------

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_API_KEY || '');

// ----------------------------------------------------------------------

const brandIconMap: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳',
  dinersclub: '💳',
  jcb: '💳',
  unionpay: '💳',
};

const formatCardNumber = (last4: string) => `•••• •••• •••• ${last4}`;

// ----------------------------------------------------------------------

interface PaymentMethodCardProps {
  pm: any;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  isDeleting: boolean;
  isSettingDefault: boolean;
}

function PaymentMethodCard({
  pm,
  onDelete,
  onSetDefault,
  isDeleting,
  isSettingDefault,
}: PaymentMethodCardProps) {
  const brand = pm.card?.brand?.toLowerCase() || 'default';
  const icon = brandIconMap[brand] || '💳';

  return (
    <Card className="relative">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-semibold text-lg tracking-wider">
                  {formatCardNumber(pm.card?.last4 || '')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expires {String(pm.card?.exp_month || '').padStart(2, '0')}/
                  {pm.card?.exp_year || ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pm.isDefaultPaymentMethod ? (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Default
                </Badge>
              ) : (
                <LoadingButton
                  size="sm"
                  variant="outline"
                  onClick={() => onSetDefault(pm.id)}
                  loading={isSettingDefault}
                  disabled={isDeleting}
                >
                  Set Default
                </LoadingButton>
              )}

              {!pm.isDefaultPaymentMethod && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(pm.id)}
                  disabled={isDeleting || isSettingDefault}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

function StripeAddCardForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [addingCard, setAddingCard] = useState(false);

  const handleSaveCard = async () => {
    if (!stripe || !elements) return;
    setAddingCard(true);
    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });
      if (!error && setupIntent?.payment_method) {
        toast.success('Card added successfully');
        onSuccess();
      } else if (error) {
        toast.error(error.message || 'Failed to add card');
      }
    } catch (error: any) {
      toast.error('Failed to add card');
    } finally {
      setAddingCard(false);
    }
  };

  return (
    <>
      <div className="py-4">
        <PaymentElement />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onSuccess} disabled={addingCard}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSaveCard}
          disabled={!stripe || !elements || addingCard}
          loading={addingCard}
        >
          Add Card
        </LoadingButton>
      </DialogFooter>
    </>
  );
}

// ----------------------------------------------------------------------

export function PaymentMethodsTab() {
  const { paymentMethods, isLoading } = getPaymentMethods();
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [settingDefaultCardId, setSettingDefaultCardId] = useState<string | null>(null);

  const fetchNewSecret = useCallback(async () => {
    try {
      const res = await axios.get('/stripe/setup-intent');
      if (res?.status === 200) {
        setClientSecret(res.data?.data?.client_secret ?? '');
      }
    } catch (err) {
      console.error('Unable to fetch client secret', err);
    }
  }, []);

  useEffect(() => {
    fetchNewSecret();
  }, [fetchNewSecret]);

  const handleDeleteCard = useCallback((id: string) => {
    setCardToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteCard = useCallback(async () => {
    if (!cardToDelete) return;

    setDeletingCardId(cardToDelete);
    try {
      const res = await deleteCard(cardToDelete);
      if (res.status === 200) {
        setDeleteConfirmOpen(false);
        setCardToDelete(null);
      }
    } catch (error) {
      // Error is handled in the action
    } finally {
      setDeletingCardId(null);
    }
  }, [cardToDelete]);

  const handleSetDefault = useCallback(
    async (id: string) => {
      setSettingDefaultCardId(id);
      try {
        await setDefaultPaymentMethod(id);
      } catch (error) {
        // Error is handled in the action
      } finally {
        setSettingDefaultCardId(null);
      }
    },
    []
  );

  const handleAddCard = useCallback(async () => {
    try {
      const res = await axios.get('/stripe/setup-intent');
      if (res?.status === 200) {
        setClientSecret(res.data?.data?.client_secret ?? '');
        setAddCardOpen(true);
      }
    } catch (err) {
      console.error('Unable to fetch client secret', err);
    }
  }, []);

  if (!clientSecret || clientSecret.trim() === '') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <CreditCard className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No Payment Methods</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add your first payment method to get started
                  </p>
                </div>
                <Button onClick={handleAddCard}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paymentMethods.map((pm: any) => (
              <PaymentMethodCard
                key={pm.id}
                pm={pm}
                onDelete={handleDeleteCard}
                onSetDefault={handleSetDefault}
                isDeleting={deletingCardId === pm.id}
                isSettingDefault={settingDefaultCardId === pm.id}
              />
            ))}
            <Card
              className="border-dashed cursor-pointer hover:border-primary transition-colors"
              onClick={handleAddCard}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">Add Payment Method</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Card Dialog */}
        <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method to your account. Your card information is securely
                processed by Stripe.
              </DialogDescription>
            </DialogHeader>
            <StripeAddCardForm
              onSuccess={async () => {
                setAddCardOpen(false);
                // Refresh payment methods
                window.location.reload(); // Simple refresh, could use SWR mutate
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this payment method? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingCardId === cardToDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteCard}
                disabled={deletingCardId === cardToDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingCardId === cardToDelete ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Elements>
  );
}
