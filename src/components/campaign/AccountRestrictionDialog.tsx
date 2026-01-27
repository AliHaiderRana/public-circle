import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { paths } from '@/routes/paths';

interface AccountRestrictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restrictionType: 'bandwidth' | 'email' | 'ses' | 'suspended';
  message?: string;
  onUpgrade?: () => void;
}

export function AccountRestrictionDialog({
  open,
  onOpenChange,
  restrictionType,
  message,
  onUpgrade,
}: AccountRestrictionDialogProps) {
  const navigate = useNavigate();

  const getTitle = () => {
    switch (restrictionType) {
      case 'bandwidth':
        return 'Bandwidth Limit Reached';
      case 'email':
        return 'Email Limit Reached';
      case 'ses':
        return 'Account Restrictions';
      case 'suspended':
        return 'Account Suspended';
      default:
        return 'Account Restriction';
    }
  };

  const getDescription = () => {
    if (message) return message;

    switch (restrictionType) {
      case 'bandwidth':
        return 'You have reached your bandwidth limit. Please upgrade your plan or wait for the limit to reset.';
      case 'email':
        return 'You have reached your email sending limit. Please upgrade your plan to continue sending emails.';
      case 'ses':
        return 'Your account has SES restrictions. Please check your email configuration or contact support.';
      case 'suspended':
        return 'Your account has been suspended. Please contact support to resolve this issue.';
      default:
        return 'Your account has restrictions that prevent this action.';
    }
  };

  const handleTopup = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Navigate to subscription page with overage tab open
      navigate(paths.dashboard.general.subscription, { state: { isTopUp: true } });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
          <DialogDescription className="pt-4">{getDescription()}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {(restrictionType === 'bandwidth' || restrictionType === 'email') && (
            <Button onClick={handleTopup}>
              <ExternalLink className="h-4 w-4 mr-2" />
              New Topup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
