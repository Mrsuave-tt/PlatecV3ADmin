import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getStudentNotifications, markNotificationAsRead, listenToStudentNotifications } from '../services/firebase';

const NotificationsScreen = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    // Set up real-time notification listener
    if (user) {
      console.log('🔄 Setting up real-time notifications for NotificationsScreen');
      const unsubscribe = listenToStudentNotifications(user.uid, (newNotifications) => {
        console.log('🔔 Real-time notifications received in NotificationsScreen:', newNotifications.length);
        setNotifications(newNotifications);
        setLoading(false);
      });
      
      return () => {
        console.log('🔕 Cleaning up notification listener in NotificationsScreen');
        unsubscribe();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const result = await getStudentNotifications(user.uid);
      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
    // Update local state
    setNotifications(notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.notificationUnread]}
      onPress={() => !item.read && handleMarkAsRead(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={[
          styles.typeBadge,
          item.type === 'attendance' ? styles.typeAttendance : styles.typeGeneral
        ]}>
          <Text style={styles.typeBadgeText}>
            {item.type === 'attendance' ? 'Attendance' : 'General'}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
      </View>
      <Text style={[styles.message, !item.read && styles.messageUnread]}>
        {item.message}
      </Text>
      {!item.read && (
        <View style={styles.unreadIndicator}>
          <View style={styles.unreadDot} />
          <Text style={styles.unreadText}>Tap to mark as read</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
          </View>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  unreadBadge: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  notificationCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  typeAttendance: {
    backgroundColor: '#e3f2fd',
  },
  typeGeneral: {
    backgroundColor: '#f3e5f5',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  message: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  messageUnread: {
    fontWeight: '500',
  },
  unreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginRight: 6,
  },
  unreadText: {
    fontSize: 12,
    color: '#667eea',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default NotificationsScreen;
