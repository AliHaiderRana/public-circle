import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plus, Trash2, Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from '@/lib/api';

// ----------------------------------------------------------------------

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_API_KEY || '');

// ----------------------------------------------------------------------

// Card brand SVG icons
const CardBrandIcon = ({ brand }: { brand: string }) => {
  const brandLower = brand?.toLowerCase() || 'default';

  if (brandLower === 'visa') {
    return (
      <svg viewBox="0 0 48 48" className="h-12 w-16">
        <path fill="#1565C0" d="M45 35c0 2.2-1.8 4-4 4H7c-2.2 0-4-1.8-4-4V13c0-2.2 1.8-4 4-4h34c2.2 0 4 1.8 4 4v22z"/>
        <path fill="#FFF" d="M15.2 28.5l1.8-10.9h2.9l-1.8 10.9zM32.7 17.8c-.6-.2-1.5-.5-2.6-.5-2.9 0-4.9 1.5-4.9 3.7 0 1.6 1.5 2.5 2.6 3 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1.1-1.7 1.1-1.2 0-1.8-.2-2.7-.6l-.4-.2-.4 2.4c.7.3 1.9.6 3.2.6 3 0 5-1.5 5-3.8 0-1.3-.8-2.2-2.4-3-.9-.5-1.5-.8-1.5-1.3 0-.4.5-.9 1.5-.9.9 0 1.5.2 2 .4l.2.1.6-2.4zM37.5 23.7c.2-.6 1.1-3.1 1.1-3.1s.2-.6.4-1l.2.9s.5 2.5.6 3h-2.3v.2zm3.5-6.2h-2.2c-.7 0-1.2.2-1.5.9l-4.3 10.1h3s.5-1.4.6-1.7h3.7c.1.4.4 1.7.4 1.7h2.7l-2.4-11zM21.8 17.6l-2.8 7.5-.3-1.5c-.5-1.7-2.1-3.6-3.9-4.5l2.5 9.4h3l4.5-10.9h-3z"/>
        <path fill="#FFC107" d="M13.5 17.6H8.8l-.1.3c3.6.9 6 3.1 7 5.7l-1-5.1c-.2-.7-.7-.9-1.2-.9z"/>
      </svg>
    );
  }

  if (brandLower === 'mastercard') {
    return (
      <svg viewBox="0 0 48 48" className="h-12 w-16">
        <path fill="#3F51B5" d="M45 35c0 2.2-1.8 4-4 4H7c-2.2 0-4-1.8-4-4V13c0-2.2 1.8-4 4-4h34c2.2 0 4 1.8 4 4v22z"/>
        <circle fill="#E91E63" cx="19" cy="24" r="9"/>
        <circle fill="#FFC107" cx="29" cy="24" r="9"/>
        <path fill="#FF9800" d="M24 17.7c-2.1 1.6-3.4 4.1-3.4 6.8s1.3 5.2 3.4 6.8c2.1-1.6 3.4-4.1 3.4-6.8s-1.3-5.2-3.4-6.8z"/>
      </svg>
    );
  }

  if (brandLower === 'amex') {
    return (
      <svg viewBox="0 0 48 48" className="h-12 w-16">
        <path fill="#1976D2" d="M45 35c0 2.2-1.8 4-4 4H7c-2.2 0-4-1.8-4-4V13c0-2.2 1.8-4 4-4h34c2.2 0 4 1.8 4 4v22z"/>
        <path fill="#FFF" d="M22.9 21.5H20l-1.9 3.4-1.8-3.4h-2.9l3.3 5.5-3.3 5.5h2.9l1.8-3.4 1.9 3.4h2.9l-3.3-5.5 3.3-5.5zM32.5 21.5h-5.1v11h5.1v-2.2h-2.8v-2.3h2.8v-2.2h-2.8v-2.1h2.8v-2.2z"/>
      </svg>
    );
  }

  // Default card icon
  return <CreditCard className="h-12 w-12 text-white/80" />;
};

const formatCardNumber = (last4: string) => `•••• •••• •••• ${last4}`;

// ----------------------------------------------------------------------

// Get gradient background based on card brand
const getCardGradient = (brand: string) => {
  const brandLower = brand?.toLowerCase() || 'default';
  switch (brandLower) {
    case 'visa':
      return 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900';
    case 'mastercard':
      return 'bg-gradient-to-br from-orange-600 via-red-700 to-red-800';
    case 'amex':
      return 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-900';
    case 'discover':
      return 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700';
    default:
      return 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800';
  }
};

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
  const brand = pm.card?.brand || 'default';
  const gradient = getCardGradient(brand);

  return (
    <div className={`relative rounded-xl ${gradient} p-5 h-[200px] shadow-lg overflow-hidden`}>
      {/* Card chip pattern */}
      <div className="absolute top-4 right-4 opacity-20">
        <div className="w-10 h-8 rounded bg-white/30" />
      </div>

      {/* Card brand icon */}
      <div className="mb-6">
        <CardBrandIcon brand={brand} />
      </div>

      {/* Card number */}
      <p className="font-mono text-xl text-white tracking-[0.2em] mb-4">
        {formatCardNumber(pm.card?.last4 || '')}
      </p>

      {/* Expiry and actions */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Expires</p>
          <p className="font-mono text-sm text-white">
            {String(pm.card?.exp_month || '').padStart(2, '0')}/{String(pm.card?.exp_year || '').slice(-2)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pm.isDefaultPaymentMethod ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-black/40 text-white border border-white/20">
              Default
            </span>
          ) : (
            <>
              <button
                onClick={() => onSetDefault(pm.id)}
                disabled={isSettingDefault || isDeleting}
                className="px-3 py-1 text-xs font-medium rounded-full bg-black text-white hover:bg-black/80 transition-colors disabled:opacity-50"
              >
                {isSettingDefault ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Set Default'
                )}
              </button>
              <button
                onClick={() => onDelete(pm.id)}
                disabled={isDeleting || isSettingDefault}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------

function StripeAddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
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
    <div className="space-y-4">
      {/* Stripe Payment Element */}
      <div className="rounded-lg border border-border p-4 bg-muted/30">
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: {
              billingDetails: {
                address: {
                  country: 'never',
                },
              },
            },
            wallets: {
              applePay: 'never',
              googlePay: 'never',
            },
          }}
        />
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
        <span>Your card information is encrypted and securely processed by Stripe</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={addingCard}
          className="flex-1"
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSaveCard}
          disabled={!stripe || !elements || addingCard}
          loading={addingCard}
          className="flex-1"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </LoadingButton>
      </div>
    </div>
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
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl bg-muted/50 h-[200px] p-5">
            <Skeleton className="h-12 w-16 mb-6" />
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="flex items-end justify-between mt-auto">
              <div>
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Elements
      key={clientSecret}
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            borderRadius: '8px',
          },
        },
      }}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl bg-muted/50 h-[200px] p-5">
                <Skeleton className="h-12 w-16 mb-6" />
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">No Payment Methods</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first payment method to get started
                </p>
              </div>
              <Button onClick={handleAddCard} className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
            <div
              className="rounded-xl border-2 border-dashed border-muted-foreground/30 h-[200px] flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-all group"
              onClick={handleAddCard}
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                <Plus className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Add Payment Method
              </p>
            </div>
          </div>
        )}

        {/* Add Card Dialog */}
        <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                Add Payment Method
              </DialogTitle>
              <DialogDescription>
                Enter your card details below to add a new payment method
              </DialogDescription>
            </DialogHeader>
            <StripeAddCardForm
              onCancel={() => setAddCardOpen(false)}
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
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-left">
                Are you sure you want to delete this payment method? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel disabled={deletingCardId === cardToDelete}>
                Cancel
              </AlertDialogCancel>
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
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Card
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Elements>
  );
}
