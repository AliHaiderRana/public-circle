import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { signOut } from '@/auth/actions/auth';
import { resetTour } from '@/actions/users';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { accountMenuItems } from './nav-data';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DashboardSidebar } from './sidebar';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import { SesStatusBadge } from '@/components/ses-status/ses-status-badge';
import { SesStatusDialog } from '@/components/ses-status/ses-status-dialog';
import { SubscriptionStatusAlert } from '@/components/subscription/subscription-status-alert';
import { getActiveSubscription } from '@/actions/payments';
import { CompanyLogo } from '@/components/company-logo';

export function DashboardHeader() {
  const { user, checkUserSession } = useAuthContext();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sesStatusDialogOpen, setSesStatusDialogOpen] = useState(false);
  const { subscription: activeSubscription } = getActiveSubscription();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/jwt/sign-in');
  };

  const handleClickTour = useCallback(async () => {
    try {
      const res = await resetTour();
      if (res) {
        toast.success('Tour reset successfully');
        await checkUserSession?.();
      }
    } catch (error) {
      console.error('Error resetting tour:', error);
    }
  }, [checkUserSession]);

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  const filteredMenuItems = accountMenuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role?.name || '');
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-3 sm:px-4" style={{ maxWidth: '1400px' }}>
        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-64 p-0 sm:w-80"
            aria-label="Navigation menu"
          >
            <DashboardSidebar 
              onNavigate={() => setMobileMenuOpen(false)} 
            />
          </SheetContent>
        </Sheet>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* SES Status Indicator */}
          {user?.company && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setSesStatusDialogOpen(true)}
            >
              <SesStatusBadge user={user} />
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.photoURL} alt={user?.firstName} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.emailAddress}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filteredMenuItems.map((item, index) => (
                <DropdownMenuItem
                  key={`account-menu-${item.label}-${index}`}
                  onClick={item.isTour ? handleClickTour : undefined}
                  asChild={!item.isTour}
                >
                  {item.isTour ? (
                    <div className="flex items-center gap-2 cursor-pointer">
                      {item.icon}
                      {item.label}
                    </div>
                  ) : (
                    <Link to={item.href} className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* SES Status Dialog */}
      <SesStatusDialog
        open={sesStatusDialogOpen}
        onClose={() => setSesStatusDialogOpen(false)}
        user={user}
      />
    </header>
  );
}
