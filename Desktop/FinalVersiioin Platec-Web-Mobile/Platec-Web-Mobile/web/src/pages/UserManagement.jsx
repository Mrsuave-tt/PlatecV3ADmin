import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, createUser } from '../services/firebase';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [message, setMessage] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    const result = await createUser(
      newUser.email,
      newUser.password,
      newUser.name,
      newUser.role
    );

    if (result.success) {
      setMessage('User created successfully!');
      setNewUser({ name: '', email: '', password: '', role: 'teacher' });
      setShowCreateUser(false);
      fetchUsers();
    } else {
      setMessage(`Error: ${result.error}`);
    }
  };

  const getFilteredUsers = () => {
    if (!filterRole) return users;
    return users.filter(u => u.role === filterRole);
  };

  const getUsersByRole = (role) => {
    return users.filter(u => u.role === role).length;
  };

  const filteredUsers = getFilteredUsers();

  const togglePassword = (userId) => {
    setRevealedPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>User Management</h1>
          <p>{users.length} total users</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-success" onClick={() => setShowCreateUser(!showCreateUser)}>
            Create User
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>

      {message && (
        <div className={message.includes('success') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{getUsersByRole('admin')}</h3>
          <p>Admins</p>
        </div>
        <div className="stat-card">
          <h3>{getUsersByRole('teacher')}</h3>
          <p>Teachers</p>
        </div>
        <div className="stat-card">
          <h3>{getUsersByRole('student')}</h3>
          <p>Students</p>
        </div>
        <div className="stat-card">
          <h3>{users.length}</h3>
          <p>Total Users</p>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateUser && (
        <div className="card">
          <h3>Create New User</h3>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
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
            </div>
            <div style={{ marginTop: '15px' }}>
              <button type="submit" className="btn btn-success">
                Create User
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginLeft: '10px' }}
                onClick={() => setShowCreateUser(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ marginBottom: 0 }}>Filter by role:</label>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
          {filterRole && (
            <button className="btn btn-secondary" onClick={() => setFilterRole('')}>
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <h2>Users ({filteredUsers.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Password</th>
              <th>Created By</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => {
                const creator = u.createdBy ? users.find(user => user.id === u.createdBy) : null;
                return (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`status-badge status-${u.role === 'admin' ? 'present' : u.role === 'teacher' ? 'late' : 'absent'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          letterSpacing: revealedPasswords[u.id] ? 'normal' : '2px',
                          color: revealedPasswords[u.id] ? 'var(--harvard-text)' : 'var(--harvard-muted)'
                        }}>
                          {u.password
                            ? (revealedPasswords[u.id] ? u.password : '••••••••')
                            : '—'}
                        </span>
                        {u.password && (
                          <button
                            onClick={() => togglePassword(u.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              color: 'var(--harvard-crimson)'
                            }}
                            title={revealedPasswords[u.id] ? 'Hide password' : 'Show password'}
                          >
                            {revealedPasswords[u.id] ? '🔒' : '👁'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>{creator ? creator.name : u.createdBy ? 'Unknown' : 'System'}</td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
