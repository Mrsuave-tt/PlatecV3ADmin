import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, createUser } from '../services/firebase';
import { resetPassword } from '../services/firebase';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 Login attempt:', { email, password }); // Debug log

    try {
      const result = await loginUser(email, password);

      if (result.success) {
        // Navigation will be handled by AuthContext and App routing
        console.log('✅ Login successful, navigating...');
        setLoading(false);
        // Navigate to root to trigger role-based redirect
        navigate('/', { replace: true });
        return; // Prevent any further execution
      } else {
        console.error('❌ Login failed:', result.error); // Debug log
        setError(result.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('🚨 Login error:', error); // Debug log
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setLoading(true);
    setError('');

    const result = await createUser(
      'admin@attendance.com',
      'admin123456',
      'System Admin',
      'admin'
    );

    if (result.success) {
      setError('Admin user created! You can now login with admin@attendance.com / admin123456');
      setLoading(false);
    } else {
      setError(`Error creating admin: ${result.error}`);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');

    const result = await resetPassword(resetEmail);

    if (result.success) {
      setResetMessage(result.message);
      setError('');
    } else {
      setError(result.error);
    }

    setResetLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/Harvard.png"
            alt="CCS Logo"
            style={{
              height: '90px',
              width: 'auto',
              objectFit: 'contain',
              marginBottom: '14px',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
            }}
          />
          {/* Decorative crimson line */}
          <div style={{
            width: '48px',
            height: '3px',
            background: 'linear-gradient(90deg, var(--harvard-crimson), var(--harvard-light))',
            borderRadius: '2px',
            margin: '0 auto'
          }} />
        </div>

        {showForgotPassword ? (
          <>
            <h2>Reset Password</h2>
            <p style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--harvard-muted)' }}>
              CCS University Portal
            </p>

            {error && (
              <div className="error-message">{error}</div>
            )}

            {resetMessage && (
              <div className="success-message">{resetMessage}</div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
                disabled={resetLoading}
              >
                {resetLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetMessage('');
                  setError('');
                  setResetEmail('');
                }}
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                Back to Login
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Attendance Management System</h2>
            <p style={{ textAlign: 'center', marginBottom: '28px', color: 'var(--harvard-muted)', fontSize: '0.88rem', letterSpacing: '0.3px' }}>
              CCS University Portal
            </p>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your.email@harvard.edu"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-link"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  fontSize: '12px',
                  color: 'var(--harvard-crimson)',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Forgot Password?
              </button>
            </div>



          </>
        )}
      </div>
    </div>
  );
};

export default Login;
