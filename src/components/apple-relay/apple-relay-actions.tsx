import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AppleRelayStatusBadge } from './apple-relay-status-badge';
import { AppleRelayVerificationModal } from './apple-relay-verification-modal';
import { verifyAppleRelay, disablePrivateRelay } from '@/actions/configurations';
import { mutate } from 'swr';
import { endpoints } from '@/lib/api';
import { RefreshCw, Settings, CircleOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type AppleRelayStatus = 'VERIFIED' | 'IN_PROGRESS' | 'NOT_VERIFIED' | undefined;

interface AppleRelayActionsProps {
  status: AppleRelayStatus;
  emailAddress: string;
  emailDomain?: string;
  isEmailVerified: boolean;
  isDomainVerified?: boolean;
  onStatusChange?: () => void;
}

export function AppleRelayActions({
  status,
  emailAddress,
  emailDomain,
  isEmailVerified,
  isDomainVerified = false,
  onStatusChange,
}: AppleRelayActionsProps) {
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  // Determine if verification is allowed
  const canVerify = emailDomain ? isDomainVerified : isEmailVerified;

  const handleQuickVerify = async () => {
    setIsVerifying(true);
    try {
      const senderEmail = emailDomain || emailAddress;
      const result = await verifyAppleRelay(senderEmail);
      if (result) {
        await mutate(endpoints.configurations.configuration);
        onStatusChange?.();
      }
    } catch (error) {
      console.error('Error verifying Apple Relay:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      const result = await disablePrivateRelay(emailAddress);
      if (result) {
        await mutate(endpoints.configurations.configuration);
        onStatusChange?.();
      }
    } catch (error) {
      console.error('Error disabling Apple Relay:', error);
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <AppleRelayStatusBadge status={status} />

      {status === 'NOT_VERIFIED' || !status ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVerificationModalOpen(true)}
                disabled={!canVerify}
                className="h-8"
              >
                <Settings className="h-4 w-4 mr-1" />
                Setup
              </Button>
            </TooltipTrigger>
            {!canVerify && (
              <TooltipContent>
                <p>Please verify {emailDomain ? 'domain' : 'email'} first</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ) : status === 'IN_PROGRESS' ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickVerify}
                disabled={isVerifying || !canVerify}
                className="h-8"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isVerifying ? 'animate-spin' : ''}`}
                />
                Re-verify
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Re-verify this address</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : status === 'VERIFIED' ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8" disabled={isDisabling}>
              <CircleOff className="h-4 w-4 mr-1" />
              Disable
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable Apple Private Relay?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to disable Apple Private Relay for{' '}
                <strong>{emailAddress}</strong>? This will prevent sending emails to Apple Private
                Relay addresses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisable}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDisabling}
              >
                {isDisabling ? 'Disabling...' : 'Disable'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      <AppleRelayVerificationModal
        open={isVerificationModalOpen}
        onOpenChange={setIsVerificationModalOpen}
        emailAddress={emailAddress}
        emailDomain={emailDomain}
        isVerified={canVerify}
      />
    </div>
  );
}
