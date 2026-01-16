import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { paths } from '@/routes/paths';

interface SubscriptionOverlayProps {
  open: boolean;
}

export function SubscriptionOverlay({ open }: SubscriptionOverlayProps) {
  const navigate = useNavigate();

  const handleGoToSubscription = () => {
    navigate(paths.dashboard.general.subscription);
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-xl">Subscription Inactive</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            Your subscription has been cancelled. To continue using the platform, please reactivate your subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            You can manage your subscription and billing information on the subscription page.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button onClick={handleGoToSubscription} className="w-full sm:w-auto">
            Go to Subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
