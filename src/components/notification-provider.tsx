import { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { paths } from '@/routes/paths';

// ----------------------------------------------------------------------

interface NotificationPayload {
  _id: string;
  title: string;
  message: string;
  type?: string;
  metadata?: {
    campaignId?: string;
    emailId?: string;
    [key: string]: unknown;
  };
}

interface NotificationContextValue {
  showNotification: (payload: NotificationPayload, onClick?: () => void) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// ----------------------------------------------------------------------

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
}

function getNavigation(notification: NotificationPayload): { path: string; state?: Record<string, unknown> } | null {
  const { type, metadata } = notification;

  switch (type) {
    case 'CAMPAIGN_COMPLETED':
    case 'CAMPAIGN_FAILED':
      if (metadata?.campaignId) {
        return { path: paths.dashboard.logs.detail, state: { campaignId: metadata.campaignId } };
      }
      return { path: paths.dashboard.logs.list };

    case 'SES_STATUS':
    case 'EMAIL_VERIFICATION':
    case 'PRIVATE_RELAY_VERIFIED':
    case 'PRIVATE_RELAY_AUTO_UNVERIFIED':
      return { path: paths.dashboard.configurations.emailconfiguration, state: { emailId: metadata?.emailId } };

    case 'MEMBER_SIGNUP_COMPLETED':
      return { path: paths.dashboard.configurations.roles, state: { userId: metadata?.userId } };

    case 'CONTACT_IMPORT':
      return { path: paths.dashboard.contacts.import };

    default:
      if (metadata?.campaignId) {
        return { path: paths.dashboard.logs.detail, state: { campaignId: metadata.campaignId } };
      }
      return null;
  }
}

// ----------------------------------------------------------------------

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuthContext();
  const navigateRef = useRef<ReturnType<typeof useNavigate>>(null);
  const nav = useNavigate();
  navigateRef.current = nav;

  const showNotification = useCallback(
    (payload: NotificationPayload, onClick?: () => void) => {
      playNotificationSound();

      toast.custom(
        (t) => (
          <div
            className="w-[356px] rounded-lg border bg-background p-4 shadow-lg cursor-pointer relative overflow-hidden"
            onClick={() => {
              if (onClick) {
                onClick();
              } else {
                const nav = getNavigation(payload);
                if (nav) {
                  navigateRef.current?.(nav.path, { state: nav.state });
                }
              }
              toast.dismiss(t);
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[hsl(var(--sidebar-primary))]" />
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {payload.title && (
                  <p className="text-sm font-semibold">{payload.title}</p>
                )}
                {payload.message && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {payload.message}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ),
        { duration: 5000, position: 'top-right' },
      );
    },
    [],
  );

  // Connect / disconnect socket based on auth state
  useEffect(() => {
    if (!authenticated) {
      disconnectSocket();
      return;
    }

    connectSocket();
    const socket = getSocket();

    const handleNewNotification = (data: NotificationPayload) => {
      showNotification(data);
    };

    socket.on('notification-created', handleNewNotification);

    return () => {
      socket.off('notification-created', handleNewNotification);
    };
  }, [authenticated, showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
