/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCheck, Loader2, Flag } from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
} from "@/actions/notifications";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { paths } from "@/routes/paths";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
  metadata?: {
    campaignId?: string;
    emailId?: string;
    [key: string]: any;
  };
}

interface NotificationsCenterProps {
  children?: React.ReactNode;
}

export function NotificationsCenter({ children }: NotificationsCenterProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const pageSize = 20;

  const fetchNotifications = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (pageNum === 1) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const response = await getNotifications({
          pageNumber: pageNum,
          pageSize,
        });

        const notificationData = response?.data || response;
        if (notificationData) {
          const items = notificationData.items || [];
          const count = notificationData.unreadCount || 0;

          if (append) {
            setNotifications((prev) => [...prev, ...items]);
          } else {
            setNotifications(items);
          }

          setUnreadCount(count);
          setHasMore(items.length === pageSize);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  // Initial load and refresh
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, false);
      setPage(1);
    }
  }, [isOpen, fetchNotifications]);

  // Poll for unread count when drawer is closed
  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        getNotifications({ pageNumber: 1, pageSize: 1 })
          .then((response) => {
            const notificationData = response?.data || response;
            if (notificationData) {
              setUnreadCount(notificationData.unreadCount || 0);
            }
          })
          .catch(() => {
            // Silent fail for polling
          });
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Poll on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (!isOpen) {
        getNotifications({ pageNumber: 1, pageSize: 1 })
          .then((response) => {
            const notificationData = response?.data || response;
            if (notificationData) {
              setUnreadCount(notificationData.unreadCount || 0);
            }
          })
          .catch(() => {
            // Silent fail for polling
          });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isOpen]);

  // Listen for real-time notifications via socket
  useEffect(() => {
    const socket = getSocket();

    const handleNewNotification = (data: Notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === data._id)) return prev;
        return [data, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification-created", handleNewNotification);
    return () => {
      socket.off("notification-created", handleNewNotification);
    };
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!isOpen || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchNotifications(nextPage, true);
        }
      },
      { threshold: 0.1 },
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isOpen, hasMore, isLoadingMore, page, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      await markNotificationAsUnread(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: false } : n,
        ),
      );
      setUnreadCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error marking notification as unread:", error);
      toast.error("Failed to mark notification as unread");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    const { type, metadata } = notification;

    switch (type) {
      case "CAMPAIGN_COMPLETED":
      case "CAMPAIGN_FAILED":
        if (metadata?.campaignId) {
          navigate(paths.dashboard.logs.detail, {
            state: { campaignId: metadata.campaignId },
          });
        } else {
          navigate(paths.dashboard.logs.list);
        }
        break;
      case "SES_STATUS":
      case "EMAIL_VERIFICATION":
      case "PRIVATE_RELAY_VERIFIED":
      case "PRIVATE_RELAY_AUTO_UNVERIFIED":
        navigate(paths.dashboard.configurations.emailconfiguration, {
          state: { emailId: metadata?.emailId },
        });
        break;
      case "MEMBER_SIGNUP_COMPLETED":
        navigate(paths.dashboard.configurations.roles, {
          state: { userId: metadata?.userId },
        });
        break;
      case "CONTACT_IMPORT":
        navigate(paths.dashboard.contacts.import);
        break;
      default:
        if (metadata?.campaignId) {
          navigate(paths.dashboard.logs.detail, {
            state: { campaignId: metadata.campaignId },
          });
        }
        break;
    }

    setIsOpen(false);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up!"}
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "all" | "unread")}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="h-[calc(100vh-200px)] overflow-y-auto scrollbar-none" ref={scrollAreaRef}>
              {isLoading && page === 1 ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2 p-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {activeTab === "unread"
                      ? "No unread notifications"
                      : "No notifications yet"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeTab === "unread"
                      ? "You're all caught up!"
                      : "Notifications will appear here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={cn(
                        "group relative p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                        !notification.isRead &&
                          "bg-primary/5 border-primary/20",
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-sm font-medium",
                                  !notification.isRead && "font-semibold",
                                )}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className={cn(
                                  "h-6 w-6 flex items-center justify-center flex-shrink-0 rounded-full hover:bg-muted transition-colors",
                                  notification.isRead && "opacity-0 group-hover:opacity-100",
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (notification.isRead) {
                                    handleMarkAsUnread(notification._id);
                                  } else {
                                    handleMarkAsRead(notification._id);
                                  }
                                }}
                              >
                                <div
                                  className={cn(
                                    "h-2.5 w-2.5 rounded-full",
                                    notification.isRead
                                      ? "border border-muted-foreground/50"
                                      : "bg-[hsl(var(--sidebar-primary))]",
                                  )}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {notification.isRead
                                  ? "Mark as unread"
                                  : "Mark as read"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                  {hasMore ? (
                    <div ref={loadMoreRef} className="py-4 text-center">
                      {isLoadingMore && (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Flag className="h-8 w-8 text-[hsl(var(--sidebar-primary))] mb-3" />
                      <p className="text-sm text-muted-foreground">
                        That's all your notifications from the last 30 days.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
