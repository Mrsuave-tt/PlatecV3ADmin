import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, getAllUsers, getAttendanceRecords, createUser, deleteStudentData, db } from '../services/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import HarvardNavigation from '../components/HarvardNavigation';

const AdminDashboard = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    assignedTeacher: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching fresh data...');
      const [usersResult, attendanceResult] = await Promise.all([
        getAllUsers(),
        getAttendanceRecords()
      ]);

      if (usersResult.success) {
        setUsers(usersResult.data);
        console.log('📊 Users updated:', usersResult.data.length);
        console.log('👥 User breakdown:', {
          total: usersResult.data.length,
          teachers: usersResult.data.filter(u => u.role === 'teacher').length,
          students: usersResult.data.filter(u => u.role === 'student').length,
          admins: usersResult.data.filter(u => u.role === 'admin').length
        });
      } else {
        setMessage(`Error fetching users: ${usersResult.error}`);
      }

      if (attendanceResult.success) {
        setAttendance(attendanceResult.data);
        console.log('📋 Attendance updated:', attendanceResult.data.length);
      } else {
        setMessage(`Error fetching attendance: ${attendanceResult.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      navigate('/login');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔧 Creating user with data:', newUser);

    const result = await createUser(
      newUser.email,
      newUser.password,
      newUser.name,
      newUser.role,
      null, // Admin creates users, no createdBy needed
      newUser.role === 'student' ? newUser.assignedTeacher : newUser.role === 'teacher' ? newUser.assignedTeacher : null
    );

    if (result.success) {
      console.log('✅ User created successfully:', result.data);
      setMessage(`${result.data.message} ${result.data.warning || ''}`);
      setNewUser({ name: '', email: '', password: '', role: 'teacher', assignedTeacher: '' });
      setShowCreateUser(false);
      fetchData();
    } else {
      console.error('❌ Error creating user:', result.error);
      setMessage(`Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId, userName, userRole) => {
    // 🔒 Guard: Prevent deletion of admin accounts
    if (userRole === 'admin') {
      setMessage('⛔ Admin accounts cannot be deleted for security reasons.');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${userRole} "${userName}"?\n\nThis will also delete ALL of their attendance records and notifications. This action cannot be undone.`)) {
      try {
        // Cascade-delete: removes user doc + all attendance + all notifications
        const result = await deleteStudentData(userId);

        if (!result.success) {
          setMessage(`Error deleting user: ${result.error}`);
          return;
        }

        setMessage(`${userRole.charAt(0).toUpperCase() + userRole.slice(1)} "${userName}" and all related records deleted successfully.`);

        // If deleting current user, force logout and redirect
        if (userId === user.uid) {
          console.log('🔒 Deleting current user, forcing logout...');
          await logoutUser();
          window.location.href = '/login';
        } else {
          setTimeout(() => {
            fetchData();
          }, 500);
        }
      } catch (error) {
        setMessage(`Error deleting user: ${error.message}`);
      }
    }
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.filter(record => record.date === today);
  };

  const getStats = () => {
    const todayAttendance = getTodayAttendance();
    return {
      teachers: users.filter(u => u.role === 'teacher').length,
      students: users.filter(u => u.role === 'student').length,
      present: todayAttendance.filter(a => a.status === 'present').length,
      absent: todayAttendance.filter(a => a.status === 'absent' || a.status === 'late').length,
    };
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <>
      <HarvardNavigation />
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            color: 'var(--harvard-crimson)',
            fontSize: '2.2rem',
            fontWeight: '800',
            marginBottom: '8px',
            letterSpacing: '-0.5px'
          }}>
            Administrative Dashboard
          </h1>
          <p style={{ color: 'var(--harvard-muted)', fontSize: '1rem' }}>
            Welcome back, <strong style={{ color: 'var(--harvard-text)' }}>{userData?.name || 'Administrator'}</strong>
          </p>
        </div>

        {message && (
          <div className={message.includes('success') ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}

        <div className="stats-grid">
          {[
            { label: 'Faculty Members', value: stats.teachers, icon: '👨‍🏫', path: '/faculty-members', color: '#EEF2FF' },
            { label: 'Enrolled Students', value: stats.students, icon: '🎓', path: '/enrolled-students', color: '#F0FDF4' },
            { label: 'Present Today', value: stats.present, icon: '✅', path: '/present-today', color: '#F0FDF4' },
            { label: 'Absent / Late', value: stats.absent, icon: '⚠️', path: '/absent-today', color: '#FFF7ED' },
          ].map(({ label, value, icon, path, color }) => (
            <div
              key={path}
              className="stat-card clickable-stat-card"
              onClick={() => navigate(path)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem'
              }}>
                {icon}
              </div>
              <h3>{value}</h3>
              <p>{label}</p>
              <div style={{ fontSize: '11px', color: 'var(--harvard-muted)', marginTop: '6px', opacity: 0.7 }}>
                Click to view →
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ color: 'var(--harvard-crimson)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '2px' }}>User Management</h2>
              <p style={{ fontSize: '13px', color: 'var(--harvard-muted)' }}>Create and manage system accounts</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => navigate('/today-attendance-summary')}
                style={{
                  background: '#FDF2F8',
                  color: 'var(--harvard-crimson)',
                  border: '1.5px solid #F5C0CB',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  letterSpacing: '0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📋 Today's Attendance Summary
              </button>
              <button
                style={{
                  background: 'var(--harvard-crimson)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  letterSpacing: '0.3px'
                }}
                onClick={() => setShowCreateUser(!showCreateUser)}
              >
                + Create New User
              </button>
            </div>
          </div>

          {showCreateUser && (
            <div className="card" style={{ marginBottom: '20px', backgroundColor: 'var(--harvard-light-gray)', border: '1px solid var(--harvard-border)' }}>
              <h3 style={{ color: 'var(--harvard-crimson)' }}>Create New User Account</h3>
              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="form-select"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {(newUser.role === 'student' || newUser.role === 'teacher') && (
                  <div className="form-group">
                    <label>{newUser.role === 'student' ? 'Assigned Teacher' : 'Supervisor'}</label>
                    <select
                      className="form-select"
                      value={newUser.assignedTeacher}
                      onChange={(e) => setNewUser({ ...newUser, assignedTeacher: e.target.value })}
                    >
                      <option value="">Select {newUser.role === 'student' ? 'Teacher' : 'Supervisor'}</option>
                      {users.filter(u => u.role === (newUser.role === 'student' ? 'teacher' : 'admin')).map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: '10px' }}
                  onClick={() => setShowCreateUser(false)}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ color: 'var(--harvard-crimson)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '2px' }}>User Directory</h2>
              <p style={{ fontSize: '13px', color: 'var(--harvard-muted)' }}>{users.length} total accounts</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="🔍  Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '280px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--harvard-border)',
                  fontSize: '13px',
                  background: '#FAFBFC',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u =>
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    {searchQuery ? 'No users found matching your search' : 'No users found'}
                  </td>
                </tr>
              ) : (
                users.filter(u =>
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(user => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: '600', color: 'var(--harvard-text)' }}>{user.name}</td>
                    <td style={{ color: 'var(--harvard-muted)', fontSize: '13px' }}>{user.email}</td>
                    <td>
                      <span className={`status-badge ${user.role === 'admin' ? 'role-admin' :
                        user.role === 'teacher' ? 'role-teacher' : 'role-student'
                        }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--harvard-muted)', fontSize: '13px' }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <button
                        className="btn-trash"
                        onClick={() => handleDeleteUser(user.id, user.name, user.role)}
                        title={user.role === 'admin' ? 'Cannot delete admin' : `Delete ${user.name}`}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
