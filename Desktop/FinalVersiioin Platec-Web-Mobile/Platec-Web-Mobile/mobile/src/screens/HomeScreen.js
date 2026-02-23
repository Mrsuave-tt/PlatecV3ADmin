import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getStudentAttendance, getAttendanceStats, logoutUser, getStudentNotifications, listenToStudentNotifications, listenToStudentAttendance } from '../services/firebase';

const HomeScreen = ({ navigation }) => {
  const { user, userData } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    // Set up real-time notification listener
    if (user) {
      console.log('🔄 Setting up real-time notifications for user:', user.uid);
      console.log('👤 User logged in:', user.email);

      const unsubscribe = listenToStudentNotifications(user.uid, (newNotifications) => {
        console.log('🔔 Real-time notifications received:', newNotifications.length);
        console.log('📊 New notifications data:', newNotifications);
        setNotifications(newNotifications);
      });

      return () => {
        console.log('🔕 Cleaning up notification listener');
        unsubscribe();
      };
    } else {
      console.log('❌ No user logged in for notifications');
    }
  }, [user]);

  useEffect(() => {
    // Set up real-time attendance listener
    if (user) {
      console.log('🔄 Setting up real-time attendance for user:', user.uid);
      const unsubscribe = listenToStudentAttendance(user.uid, (newAttendance) => {
        console.log('📊 Real-time attendance received:', newAttendance.length);
        setAttendance(newAttendance);
        setStats(getAttendanceStats(newAttendance));
        setLoading(false);
      });

      return () => {
        console.log('🔕 Cleaning up attendance listener');
        unsubscribe();
      };
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      console.log('🔄 Mobile app fetching data for user:', user.uid);

      const [attendanceResult, notificationsResult] = await Promise.all([
        getStudentAttendance(user.uid),
        getStudentNotifications(user.uid)
      ]);

      if (attendanceResult.success) {
        setAttendance(attendanceResult.data);
        setStats(getAttendanceStats(attendanceResult.data));
        console.log('📊 Mobile attendance loaded:', attendanceResult.data.length);
      } else {
        console.error('❌ Mobile attendance error:', attendanceResult.error);
      }

      if (notificationsResult.success) {
        setNotifications(notificationsResult.data);
        console.log('🔔 Mobile notifications loaded:', notificationsResult.data.length);
        notificationsResult.data.forEach(notification => {
          console.log(`📱 Notification: ${notification.title} - ${notification.message}`);
        });
      } else {
        console.error('❌ Mobile notifications error:', notificationsResult.error);
      }
    } catch (error) {
      console.error('❌ Mobile app data fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Mobile - Today\'s date:', today);
    console.log('📊 Mobile - Available attendance records:', attendance);
    const todayRecord = attendance.find(record => record.date === today);
    console.log('🔍 Mobile - Today\'s attendance:', todayRecord);
    return todayRecord;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const todayAttendance = getTodayAttendance();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* === PROFILE BANNER HEADER === */}
      <View style={styles.bannerWrapper}>
        {/* Gradient Banner */}
        <View style={styles.banner}>
          {/* Top-right action buttons */}
          <View style={styles.bannerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.bannerIconBtn}
            >
              <Text style={styles.bannerIcon}>🔔</Text>
              {notifications.filter(n => !n.read).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{notifications.filter(n => !n.read).length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile card overlapping banner */}
        <View style={styles.profileCard}>
          {/* Avatar — centered on top edge of card */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.avatarWrapper}
          >
            {userData?.profilePicture ? (
              <Image source={{ uri: userData.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>
                  {userData?.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName}>{userData?.name || 'Student'}</Text>
          <Text style={styles.profileEmail}>{userData?.email || ''}</Text>
        </View>
      </View>

      {/* Today's Status */}
      <View style={styles.todayCard}>
        <Text style={styles.todayTitle}>Today's Attendance</Text>
        {todayAttendance ? (
          <View style={[
            styles.statusBadge,
            todayAttendance.status === 'present' && styles.statusPresent,
            todayAttendance.status === 'absent' && styles.statusAbsent,
            todayAttendance.status === 'late' && styles.statusLate,
          ]}>
            <Text style={styles.statusText}>
              {todayAttendance.status.toUpperCase()}
            </Text>
          </View>
        ) : (
          <Text style={styles.notMarked}>Not marked yet</Text>
        )}
      </View>

      {/* Statistics */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#28a745' }]}>{stats.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#dc3545' }]}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#ffc107' }]}>{stats.late}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
        </View>
      )}

      {/* Attendance Percentage */}
      {stats && (
        <View style={styles.percentCard}>
          <Text style={styles.percentNumber}>{stats.presentPercent}%</Text>
          <Text style={styles.percentLabel}>Attendance Rate</Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Attendance')}
        >
          <Text style={styles.actionButtonText}>View Attendance History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.actionButtonText}>View Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#9B1B30' }]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>⚙️ Profile & Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F7',
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

  /* === BANNER + PROFILE CARD === */
  bannerWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  banner: {
    width: '100%',
    height: 150,
    backgroundColor: '#667eea',
    // fallback color; use a gradient lib if available
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  bannerActions: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerIconBtn: {
    position: 'relative',
    marginRight: 8,
  },
  bannerIcon: {
    fontSize: 22,
  },
  profileCard: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 18,
    alignItems: 'center',
    paddingTop: 58,       // space for avatar overlap
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginTop: -50,       // pulls card up to overlap banner
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  avatarWrapper: {
    position: 'absolute',
    top: -50,             // sits half above the card
    alignSelf: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarPlaceholder: {
    backgroundColor: '#9B1B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1D23',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#8A94A6',
  },

  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  notificationBadge: {
    position: 'absolute',
    right: -4,
    top: -3,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  /* === CARDS === */
  todayCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  todayTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  statusPresent: { backgroundColor: '#d4edda' },
  statusAbsent: { backgroundColor: '#f8d7da' },
  statusLate: { backgroundColor: '#fff3cd' },
  statusText: { fontSize: 15, fontWeight: '600' },
  notMarked: { fontSize: 15, color: '#666', fontStyle: 'italic' },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  percentCard: {
    backgroundColor: '#667eea',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
  },
  percentNumber: { fontSize: 46, fontWeight: 'bold', color: '#fff' },
  percentLabel: { fontSize: 15, color: '#fff', marginTop: 4 },

  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#667eea',
    textAlign: 'center',
  },
});

export default HomeScreen;
