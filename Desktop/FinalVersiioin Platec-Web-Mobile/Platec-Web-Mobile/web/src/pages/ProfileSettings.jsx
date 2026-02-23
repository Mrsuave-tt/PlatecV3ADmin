import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, changeUserPassword } from '../services/firebase';
import HarvardNavigation from '../components/HarvardNavigation';

const ProfileSettings = () => {
    const navigate = useNavigate();
    const { user, userData, refreshUserData } = useAuth();
    const fileInputRef = useRef(null);

    // Profile picture state
    const [profilePicture, setProfilePicture] = useState(userData?.profilePicture || '');
    const [uploading, setUploading] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handlePictureUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            setProfileMessage('Please select an image file.');
            return;
        }
        if (file.size > 500 * 1024) { // 500KB limit for Firestore
            setProfileMessage('Image must be under 500KB. Try a smaller photo.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            setProfilePicture(base64);
            setUploading(true);
            setProfileMessage('');

            const result = await updateUserProfile(user.uid, { profilePicture: base64 });
            if (result.success) {
                setProfileMessage('✅ Profile picture updated!');
                if (refreshUserData) refreshUserData();
            } else {
                setProfileMessage(`❌ ${result.error}`);
            }
            setUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePicture = async () => {
        setUploading(true);
        const result = await updateUserProfile(user.uid, { profilePicture: '' });
        if (result.success) {
            setProfilePicture('');
            setProfileMessage('✅ Profile picture removed.');
            if (refreshUserData) refreshUserData();
        } else {
            setProfileMessage(`❌ ${result.error}`);
        }
        setUploading(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordMessage('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters.');
            return;
        }

        setPasswordLoading(true);
        const result = await changeUserPassword(currentPassword, newPassword);
        if (result.success) {
            setPasswordMessage('✅ Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setPasswordError(result.error);
        }
        setPasswordLoading(false);
    };

    const initials = userData?.name
        ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <>
            <HarvardNavigation />
            <div className="container" style={{ maxWidth: '720px' }}>

                {/* Page Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{
                        color: 'var(--harvard-crimson)',
                        fontSize: '2rem',
                        fontWeight: '800',
                        marginBottom: '6px',
                        letterSpacing: '-0.5px'
                    }}>
                        Profile & Settings
                    </h1>
                    <p style={{ color: 'var(--harvard-muted)', fontSize: '0.95rem' }}>
                        Manage your profile picture and account security
                    </p>
                </div>

                {/* Profile Picture Card */}
                <div className="card" style={{ marginBottom: '28px' }}>
                    <h3 style={{ color: 'var(--harvard-crimson)', marginBottom: '4px', fontSize: '1.15rem', fontWeight: '700' }}>Profile Picture</h3>
                    <p style={{ color: 'var(--harvard-muted)', fontSize: '13px', marginBottom: '24px' }}>Upload a photo to personalize your account</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                        {/* Avatar */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '110px',
                                height: '110px',
                                borderRadius: '50%',
                                background: profilePicture
                                    ? `url(${profilePicture}) center/cover no-repeat`
                                    : 'linear-gradient(135deg, var(--harvard-crimson), var(--harvard-dark))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '2rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                border: '4px solid #F0F2F7',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                flexShrink: 0,
                                transition: 'transform 0.2s ease',
                                position: 'relative'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {!profilePicture && initials}
                            {/* Hover overlay */}
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.4)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.2s ease',
                                fontSize: '1.3rem'
                            }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                            >
                                📷
                            </div>
                        </div>

                        <div>
                            <p style={{ fontWeight: '600', color: 'var(--harvard-text)', fontSize: '1.05rem', marginBottom: '4px' }}>
                                {userData?.name || 'User'}
                            </p>
                            <p style={{ color: 'var(--harvard-muted)', fontSize: '13px', marginBottom: '14px' }}>
                                {userData?.email} • <span className={`status-badge role-${userData?.role}`} style={{ fontSize: '10px', padding: '2px 10px' }}>{userData?.role}</span>
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    style={{
                                        background: 'var(--harvard-crimson)', color: 'white', border: 'none',
                                        borderRadius: '8px', padding: '8px 18px', fontSize: '12px',
                                        fontWeight: '600', cursor: 'pointer', letterSpacing: '0.3px'
                                    }}
                                >
                                    {uploading ? 'Uploading...' : '📁 Upload Photo'}
                                </button>
                                {profilePicture && (
                                    <button
                                        onClick={handleRemovePicture}
                                        disabled={uploading}
                                        style={{
                                            background: '#F0F2F7', color: 'var(--harvard-muted)', border: '1px solid var(--harvard-border)',
                                            borderRadius: '8px', padding: '8px 18px', fontSize: '12px',
                                            fontWeight: '600', cursor: 'pointer'
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePictureUpload}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {profileMessage && (
                        <div style={{
                            marginTop: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
                            background: profileMessage.includes('✅') ? '#E6F9EE' : '#FDE8EC',
                            color: profileMessage.includes('✅') ? '#1A7A40' : '#9B1B30'
                        }}>
                            {profileMessage}
                        </div>
                    )}
                </div>

                {/* Change Password Card */}
                <div className="card" style={{ marginBottom: '28px' }}>
                    <h3 style={{ color: 'var(--harvard-crimson)', marginBottom: '4px', fontSize: '1.15rem', fontWeight: '700' }}>Change Password</h3>
                    <p style={{ color: 'var(--harvard-muted)', fontSize: '13px', marginBottom: '24px' }}>Update your account password for security</p>

                    {passwordMessage && (
                        <div style={{
                            marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
                            background: '#E6F9EE', color: '#1A7A40'
                        }}>
                            {passwordMessage}
                        </div>
                    )}
                    {passwordError && (
                        <div style={{
                            marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
                            background: '#FDE8EC', color: '#9B1B30'
                        }}>
                            {passwordError}
                        </div>
                    )}

                    <form onSubmit={handleChangePassword}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Enter your current password"
                                style={{ borderRadius: '10px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="At least 6 characters"
                                style={{ borderRadius: '10px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Confirm new password"
                                style={{ borderRadius: '10px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={passwordLoading}
                            style={{
                                background: 'var(--harvard-crimson)', color: 'white', border: 'none',
                                borderRadius: '10px', padding: '12px 28px', fontSize: '13px',
                                fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px'
                            }}
                        >
                            {passwordLoading ? 'Changing...' : '🔒 Update Password'}
                        </button>
                    </form>
                </div>

                {/* Back button */}
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'none', border: 'none', color: 'var(--harvard-muted)',
                            fontSize: '13px', cursor: 'pointer', textDecoration: 'underline'
                        }}
                    >
                        ← Back to Dashboard
                    </button>
                </div>

            </div>
        </>
    );
};

export default ProfileSettings;
