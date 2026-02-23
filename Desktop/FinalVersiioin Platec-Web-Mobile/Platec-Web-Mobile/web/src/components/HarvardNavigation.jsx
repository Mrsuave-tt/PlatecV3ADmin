import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../services/firebase';

const HarvardNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logoutUser();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNavItems = () => [];

  // Dropdown menu items differ by role
  const getDropdownItems = () => {
    if (userData?.role === 'admin') {
      return [
        { label: 'Dashboard', icon: '📊', path: '/admin' },
        { label: 'User Management', icon: '👥', path: '/user-management' },
        { label: 'Departments', icon: '🏛️', path: '/departments' },
        { label: 'Reports', icon: '📋', path: '/attendance-report' },
        { label: 'Settings', icon: '⚙️', path: '/profile-settings' },
      ];
    } else if (userData?.role === 'teacher') {
      return [
        { label: 'Dashboard', icon: '📊', path: '/teacher' },
        { label: 'Reports', icon: '📋', path: '/attendance-report' },
        { label: 'Settings', icon: '⚙️', path: '/profile-settings' },
      ];
    }
    return [{ label: 'Settings', icon: '⚙️', path: '/profile-settings' }];
  };

  const initials = userData?.name
    ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <>
      {/* ── Dropdown overlay styles ── */}
      <style>{`
        .nav-profile-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2.5px solid var(--harvard-crimson);
          object-fit: cover;
        }
        .nav-avatar-placeholder {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--harvard-crimson);
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid var(--harvard-crimson);
          flex-shrink: 0;
        }
        .nav-caret {
          font-size: 10px;
          color: var(--harvard-muted);
          margin-top: 1px;
          transition: transform 0.2s ease;
        }
        .nav-caret.open { transform: rotate(180deg); }

        /* Dropdown panel */
        .profile-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 260px;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.16);
          z-index: 9999;
          overflow: hidden;
          animation: dropIn 0.18s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pd-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 16px 14px;
          border-bottom: 1px solid #F0F2F7;
        }
        .pd-header-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--harvard-crimson);
          flex-shrink: 0;
        }
        .pd-header-avatar-ph {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: var(--harvard-crimson);
          color: #fff;
          font-weight: 700;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pd-name  { font-weight: 700; font-size: 14px; color: #1A1D23; }
        .pd-email { font-size: 11px; color: #8A94A6; margin-top: 1px; }
        .pd-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s ease;
          text-decoration: none;
          color: #1A1D23;
          font-size: 14px;
          font-weight: 500;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .pd-item:hover { background: #F4F6F9; }
        .pd-item-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #F0F2F7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .pd-divider { height: 1px; background: #F0F2F7; margin: 4px 0; }
        .pd-signout .pd-item-icon { background: #FDE8EC; }
        .pd-signout { color: var(--harvard-crimson); }
      `}</style>

      <nav className="harvard-nav">
        <div className="nav-container">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img
              src="/Harvard.png"
              alt="Logo"
              style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div style={{
              fontSize: '1.5rem', color: 'var(--harvard-crimson)', fontWeight: 'bold',
              fontFamily: 'Georgia, serif', width: '40px', height: '40px', display: 'none',
              alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--harvard-crimson)', borderRadius: '50%'
            }}>H</div>
            <a href="/" className="nav-brand" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
              CCS Attendance
            </a>
          </div>

          {/* Main nav links */}
          <ul className="nav-menu">
            {getNavItems().map((item) => (
              <li key={item.path} className="nav-item">
                <a
                  href={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                >
                  <span style={{ marginRight: '5px' }}>{item.icon}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Profile avatar + dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative', marginLeft: '16px' }}>
            <button
              className="nav-profile-btn"
              onClick={() => setDropdownOpen(prev => !prev)}
              aria-label="Profile menu"
            >
              {userData?.profilePicture ? (
                <img src={userData.profilePicture} alt="avatar" className="nav-avatar" />
              ) : (
                <div className="nav-avatar-placeholder">{initials}</div>
              )}
              <span className={`nav-caret ${dropdownOpen ? 'open' : ''}`}>▼</span>
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown">
                {/* Header — name + email */}
                <div className="pd-header">
                  {userData?.profilePicture ? (
                    <img src={userData.profilePicture} alt="avatar" className="pd-header-avatar" />
                  ) : (
                    <div className="pd-header-avatar-ph">{initials}</div>
                  )}
                  <div>
                    <div className="pd-name">{userData?.name || 'User'}</div>
                    <div className="pd-email">{userData?.email || ''}</div>
                  </div>
                </div>

                {/* Menu items */}
                {getDropdownItems().map((item) => (
                  <button
                    key={item.path}
                    className="pd-item"
                    onClick={() => { setDropdownOpen(false); navigate(item.path); }}
                  >
                    <div className="pd-item-icon">{item.icon}</div>
                    {item.label}
                  </button>
                ))}

                <div className="pd-divider" />

                {/* Sign out */}
                <button className="pd-item pd-signout" onClick={handleLogout}>
                  <div className="pd-item-icon">🚪</div>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default HarvardNavigation;
