import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { verifyAppleRelay } from '@/actions/configurations';
import { mutate } from 'swr';
import { endpoints } from '@/lib/api';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';

interface AppleRelayVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailAddress: string;
  emailDomain?: string;
  isVerified: boolean;
}

export function AppleRelayVerificationModal({
  open,
  onOpenChange,
  emailAddress,
  emailDomain,
  isVerified,
}: AppleRelayVerificationModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!isVerified) {
      return;
    }

    setIsVerifying(true);
    try {
      const senderEmail = emailDomain || emailAddress;
      const result = await verifyAppleRelay(senderEmail);
      if (result) {
        await mutate(endpoints.configurations.configuration);
        // Close modal after a short delay to show success
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error verifying Apple Relay:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Apple Private Relay Verification
          </DialogTitle>
          <DialogDescription>
            Verify your email address for Apple Private Relay functionality
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isVerified ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                Please verify your {emailDomain ? 'domain' : 'email address'} first before setting up
                Apple Private Relay.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Email:</strong> {emailAddress}
                </p>
                {emailDomain && (
                  <p className="text-sm text-blue-800">
                    <strong>Domain:</strong> {emailDomain}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">How it works:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>We'll send a verification email to Apple's Private Relay service</li>
                  <li>The email contains an invisible tracking pixel</li>
                  <li>When Apple loads the pixel, verification is complete</li>
                  <li>You'll receive a notification when verification succeeds</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isVerifying}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={!isVerified || isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Verification...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Start Verification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
