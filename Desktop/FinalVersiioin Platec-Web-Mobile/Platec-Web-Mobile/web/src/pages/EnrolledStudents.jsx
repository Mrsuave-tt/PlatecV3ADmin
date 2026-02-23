import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers } from '../services/firebase';
import { assignStudentToTeacher } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import HarvardNavigation from '../components/HarvardNavigation';

const EnrolledStudents = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) setUsers(result.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = async (studentId, teacherId) => {
    setSavingId(studentId);
    const result = await assignStudentToTeacher(studentId, teacherId);
    if (result.success) {
      setUsers(prev => prev.map(u =>
        u.id === studentId ? { ...u, assignedTeacher: teacherId || null } : u
      ));
      setMessage('✅ Teacher assignment updated!');
      setTimeout(() => setMessage(''), 3000);
    }
    setSavingId(null);
  };

  if (loading) {
    return (
      <>
        <HarvardNavigation />
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading enrolled students...</p>
          </div>
        </div>
      </>
    );
  }

  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');

  return (
    <>
      <HarvardNavigation />
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: 'var(--harvard-crimson)', fontSize: '2rem', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.5px' }}>
            Enrolled Students
          </h1>
          <p style={{ color: 'var(--harvard-muted)', fontSize: '0.95rem' }}>
            Manage student enrollment and teacher assignments
          </p>
        </div>

        {message && (
          <div style={{
            background: '#E6F9EE', color: '#1A7A40', border: '1px solid #B7EDD0',
            borderRadius: '10px', padding: '12px 18px', marginBottom: '20px',
            fontSize: '13px', fontWeight: '500'
          }}>{message}</div>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ color: 'var(--harvard-crimson)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '2px' }}>
                Student Directory
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--harvard-muted)' }}>
                {students.length} enrolled · {students.filter(s => s.assignedTeacher).length} assigned to a teacher
              </p>
            </div>
            <button
              style={{
                background: '#F4F6F9', color: 'var(--harvard-muted)', border: '1px solid var(--harvard-border)',
                borderRadius: '10px', padding: '9px 18px', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
              }}
              onClick={() => navigate('/admin')}
            >
              ← Back
            </button>
          </div>

          {students.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--harvard-muted)', padding: '40px' }}>No students enrolled</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Student ID</th>
                  <th>Assign Teacher</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const assignedTeacher = users.find(u => u.id === student.assignedTeacher);
                  return (
                    <tr key={student.id}>
                      <td style={{ fontWeight: '600', color: 'var(--harvard-text)' }}>{student.name}</td>
                      <td style={{ color: 'var(--harvard-muted)', fontSize: '13px' }}>{student.email}</td>
                      <td>
                        <span style={{
                          fontFamily: 'monospace', background: 'var(--harvard-light-gray)',
                          padding: '3px 8px', borderRadius: '6px', fontSize: '12px'
                        }}>
                          {student.id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <select
                            value={student.assignedTeacher || ''}
                            onChange={(e) => handleAssignTeacher(student.id, e.target.value)}
                            disabled={savingId === student.id}
                            style={{
                              border: '1.5px solid var(--harvard-border)',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              fontFamily: 'inherit',
                              background: '#FAFBFC',
                              cursor: 'pointer',
                              color: 'var(--harvard-text)',
                              minWidth: '160px',
                            }}
                          >
                            <option value="">— Unassigned —</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          {savingId === student.id && (
                            <span style={{ fontSize: '11px', color: 'var(--harvard-muted)' }}>Saving...</span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--harvard-muted)', fontSize: '13px' }}>
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <span className="status-badge role-student">Active</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default EnrolledStudents;
