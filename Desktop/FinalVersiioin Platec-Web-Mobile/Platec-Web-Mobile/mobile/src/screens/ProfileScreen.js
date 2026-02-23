import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Alert, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, changeUserPassword } from '../services/firebase';

const ProfileScreen = ({ navigation }) => {
    const { user, userData, refreshUserData } = useAuth();

    // Profile picture
    const [profilePicture, setProfilePicture] = useState(userData?.profilePicture || '');
    const [uploading, setUploading] = useState(false);

    // Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const initials = userData?.name
        ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera roll permission is needed to upload a profile photo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.4,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const base64Uri = `data:image/jpeg;base64,${asset.base64}`;

            // Check size (roughly)
            if (asset.base64.length > 500 * 1024) {
                Alert.alert('Image Too Large', 'Please choose a smaller photo (under 500KB).');
                return;
            }

            setProfilePicture(base64Uri);
            setUploading(true);

            const res = await updateUserProfile(user.uid, { profilePicture: base64Uri });
            if (res.success) {
                Alert.alert('Success', 'Profile picture updated!');
                if (refreshUserData) refreshUserData();
            } else {
                Alert.alert('Error', res.error);
            }
            setUploading(false);
        }
    };

    const handleRemovePicture = async () => {
        setUploading(true);
        const res = await updateUserProfile(user.uid, { profilePicture: '' });
        if (res.success) {
            setProfilePicture('');
            if (refreshUserData) refreshUserData();
        }
        setUploading(false);
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }

        setPasswordLoading(true);
        const result = await changeUserPassword(currentPassword, newPassword);
        if (result.success) {
            Alert.alert('Success', 'Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            Alert.alert('Error', result.error);
        }
        setPasswordLoading(false);
    };

    return (
        <ScrollView style={styles.container}>
            {/* Profile Card */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Profile Picture</Text>
                <Text style={styles.sectionSub}>Tap to update your profile photo</Text>

                <View style={styles.avatarRow}>
                    <TouchableOpacity onPress={pickImage} disabled={uploading}>
                        {profilePicture ? (
                            <Image source={{ uri: profilePicture }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarInitials}>{initials}</Text>
                            </View>
                        )}
                        {uploading && (
                            <View style={styles.avatarOverlay}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.avatarInfo}>
                        <Text style={styles.userName}>{userData?.name || 'Student'}</Text>
                        <Text style={styles.userEmail}>{userData?.email}</Text>
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.btnPrimary} onPress={pickImage} disabled={uploading}>
                                <Text style={styles.btnPrimaryText}>{uploading ? 'Uploading...' : '📷 Upload'}</Text>
                            </TouchableOpacity>
                            {profilePicture ? (
                                <TouchableOpacity style={styles.btnSecondary} onPress={handleRemovePicture} disabled={uploading}>
                                    <Text style={styles.btnSecondaryText}>Remove</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                </View>
            </View>

            {/* Password Card */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Change Password</Text>
                <Text style={styles.sectionSub}>Update your account password</Text>

                <Text style={styles.label}>Current Password</Text>
                <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#aaa"
                />

                <Text style={styles.label}>New Password</Text>
                <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#aaa"
                />

                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="#aaa"
                />

                <TouchableOpacity style={styles.btnPrimary} onPress={handleChangePassword} disabled={passwordLoading}>
                    <Text style={styles.btnPrimaryText}>{passwordLoading ? 'Changing...' : '🔒 Update Password'}</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2F7', padding: 16 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 24,
        marginBottom: 20,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#9B1B30', marginBottom: 2 },
    sectionSub: { fontSize: 13, color: '#8A94A6', marginBottom: 20 },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#F0F2F7' },
    avatarPlaceholder: {
        backgroundColor: '#9B1B30', justifyContent: 'center', alignItems: 'center',
    },
    avatarInitials: { color: '#fff', fontSize: 28, fontWeight: '700' },
    avatarOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 45, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarInfo: { flex: 1 },
    userName: { fontSize: 17, fontWeight: '700', color: '#1A1D23', marginBottom: 2 },
    userEmail: { fontSize: 13, color: '#8A94A6', marginBottom: 12 },
    btnRow: { flexDirection: 'row', gap: 10 },
    btnPrimary: {
        backgroundColor: '#9B1B30', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18,
        alignItems: 'center', marginTop: 4,
    },
    btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    btnSecondary: {
        backgroundColor: '#F0F2F7', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18,
        alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: '#E8ECF0',
    },
    btnSecondaryText: { color: '#8A94A6', fontWeight: '600', fontSize: 13 },
    label: {
        fontSize: 11, fontWeight: '700', color: '#444', textTransform: 'uppercase',
        letterSpacing: 1, marginBottom: 6, marginTop: 12,
    },
    input: {
        backgroundColor: '#FAFBFC', borderWidth: 1.5, borderColor: '#E8ECF0',
        borderRadius: 10, padding: 12, fontSize: 15, color: '#1A1D23',
    },
});

export default ProfileScreen;
