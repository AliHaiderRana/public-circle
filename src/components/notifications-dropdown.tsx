import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { getNotifications } from '@/actions/notifications';
import { NotificationsCenter } from './notifications-center';

export function NotificationsDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count for badge
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getNotifications({
        pageNumber: 1,
        pageSize: 1,
      });
      const notificationData = response?.data || response;
      if (notificationData) {
        setUnreadCount(notificationData.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Poll every 30 seconds for unread count
  useEffect(() => {
    fetchUnreadCount();
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Poll on window focus
  useEffect(() => {
    const handleFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchUnreadCount]);

  return (
    <NotificationsCenter>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
    </NotificationsCenter>
  );
}
