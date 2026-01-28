import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/auth/hooks/use-auth-context";
import { signOut } from "@/auth/actions/auth";
import { resetTour } from "@/actions/users";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { accountMenuItems } from "./nav-data";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { SesStatusBadge } from "@/components/ses-status/ses-status-badge";
import { SesStatusDialog } from "@/components/ses-status/ses-status-dialog";
import { SubscriptionHeaderBanner } from "@/components/subscription/subscription-header-banner";
import { RegionSelector } from "@/components/auth/region-selector";
import { LanguageSelector } from "@/components/auth/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanyLogo } from "@/components/company-logo";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  const { user, checkUserSession } = useAuthContext();
  const navigate = useNavigate();
  const [sesStatusDialogOpen, setSesStatusDialogOpen] = useState(false);
  // const { subscription: activeSubscription } = getActiveSubscription();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/jwt/sign-in");
  };

  const handleClickTour = useCallback(async () => {
    try {
      const res = await resetTour();
      if (res) {
        toast.success("Tour reset successfully");
        await checkUserSession?.();
      }
    } catch (error) {
      console.error("Error resetting tour:", error);
    }
  }, [checkUserSession]);

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  // Add cache-busting for profile picture
  const profilePictureUrl = user?.profilePicture || user?.photoURL;
  const avatarSrc = profilePictureUrl
    ? `${profilePictureUrl}?t=${user?.updatedAt || ""}`
    : undefined;

  const filteredMenuItems = accountMenuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role?.name || "");
  });

  return (
    <header className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div
        className="mx-auto flex h-16 w-full items-center justify-between px-3 sm:px-4"
        style={{ maxWidth: "1400px" }}
      >
        {/* Left side - Mobile menu trigger and Company Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile sidebar trigger */}
          <SidebarTrigger className="sm:hidden" />

          {/* Company Logo and Name */}
          {user?.company && (
            <CompanyLogo
              logo={user.company.logo}
              name={user.company.name}
              size="sm"
              showName={false}
              className="flex-shrink-0 sm:hidden"
            />
          )}
          {/* Company Logo with name on larger screens */}
          {user?.company && (
            <CompanyLogo
              logo={user.company.logo}
              name={user.company.name}
              size="sm"
              showName={true}
              className="flex-shrink-0 hidden sm:flex"
            />
          )}
        </div>

        {/* Spacer to push everything to the right */}
        <div className="flex-1" />

        {/* Subscription Banner - inline with other header items */}
        <SubscriptionHeaderBanner className="mr-4 hidden sm:block" />

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* SES Status Indicator - hidden on mobile */}
          {user?.company && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 hidden sm:flex"
              onClick={() => setSesStatusDialogOpen(true)}
            >
              <SesStatusBadge user={user} />
            </Button>
          )}

          {/* Currency and Language Selectors - hidden on mobile */}
          <div className="hidden sm:flex items-center gap-0.5">
            <RegionSelector disabled />
            <LanguageSelector />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationsDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarSrc} alt={user?.firstName} />
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
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive"
              >
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
