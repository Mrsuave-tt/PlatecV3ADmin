import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { auth } from './src/services/firebase';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    // Check if non-student tries to access mobile app
    if (userData && userData.role !== 'student') {
      Alert.alert(
        'Access Restricted',
        'This mobile app is for students only. Teachers and admins should use the web portal.',
        [{ text: 'OK' }]
      );
    }
  }, [userData]);

  if (loading) {
    return null; // or a loading screen
  }

  // Block non-students from accessing the app
  if (user && userData && userData.role !== 'student') {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Attendance"
            component={AttendanceScreen}
            options={{
              title: 'Attendance History',
              headerStyle: { backgroundColor: '#667eea' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{
              title: 'Notifications',
              headerStyle: { backgroundColor: '#667eea' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Profile & Settings',
              headerStyle: { backgroundColor: '#9B1B30' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
