import axios from '@/lib/api';

// ----------------------------------------------------------------------

export const getNotifications = async (params: {
  pageNumber?: number;
  pageSize?: number;
  isRead?: boolean;
} = {}) => {
  try {
    const { pageNumber = 1, pageSize = 10, isRead } = params;
    const queryParams = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });

    if (isRead !== undefined) {
      queryParams.append('isRead', isRead.toString());
    }

    const response = await axios.get(`/notifications?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const response = await axios.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await axios.patch('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string) => {
  try {
    const response = await axios.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export const markNotificationAsUnread = async (notificationId: string) => {
  try {
    const response = await axios.patch(`/notifications/${notificationId}/unread`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    throw error;
  }
};
