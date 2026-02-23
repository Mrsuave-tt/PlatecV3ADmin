import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getDepartments } from '../services/firebase';
import HarvardNavigation from '../components/HarvardNavigation';

const FacultyMembers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [usersResult, deptResult] = await Promise.all([
        getAllUsers(),
        getDepartments(),
      ]);
      if (usersResult.success) setUsers(usersResult.data);
      if (deptResult.success) setDepartments(deptResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <HarvardNavigation />
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading faculty members...</p>
          </div>
        </div>
      </>
    );
  }

  const facultyMembers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');

  // Build a map: teacherId → [department names]
  const teacherDeptMap = {};
  departments.forEach(dept => {
    (dept.teacherIds || []).forEach(tid => {
      if (!teacherDeptMap[tid]) teacherDeptMap[tid] = [];
      teacherDeptMap[tid].push(dept.name);
    });
  });

  return (
    <>
      <HarvardNavigation />
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: 'var(--harvard-crimson)', fontSize: '2rem', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.5px' }}>
            Faculty Members
          </h1>
          <p style={{ color: 'var(--harvard-muted)', fontSize: '0.95rem' }}>
            View faculty, their departments, and assigned students
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ color: 'var(--harvard-crimson)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '2px' }}>
                Faculty Directory
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--harvard-muted)' }}>{facultyMembers.length} faculty member{facultyMembers.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigate('/departments')}
                style={{
                  background: '#FDF2F8', color: 'var(--harvard-crimson)',
                  border: '1.5px solid #F5C0CB', borderRadius: '10px',
                  padding: '9px 16px', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                }}
              >
                🏛️ Manage Departments
              </button>
              <button
                style={{
                  background: '#F4F6F9', color: 'var(--harvard-muted)',
                  border: '1px solid var(--harvard-border)', borderRadius: '10px',
                  padding: '9px 16px', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                }}
                onClick={() => navigate('/admin')}
              >
                ← Back
              </button>
            </div>
          </div>

          {facultyMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👨‍🏫</div>
              <p style={{ color: 'var(--harvard-muted)', marginBottom: '16px' }}>No teachers found.</p>
              <button
                onClick={() => navigate('/user-management')}
                style={{
                  background: 'var(--harvard-crimson)', color: 'white', border: 'none',
                  borderRadius: '10px', padding: '10px 20px', fontWeight: '600',
                  fontSize: '13px', cursor: 'pointer'
                }}
              >
                + Create a Teacher Account
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department(s)</th>
                  <th>Students Assigned</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {facultyMembers.map(teacher => {
                  const assigned = students.filter(s => s.assignedTeacher === teacher.id);
                  const depts = teacherDeptMap[teacher.id] || [];
                  return (
                    <tr key={teacher.id}>
                      <td style={{ fontWeight: '600', color: 'var(--harvard-text)' }}>{teacher.name}</td>
                      <td style={{ color: 'var(--harvard-muted)', fontSize: '13px' }}>{teacher.email}</td>
                      <td>
                        {depts.length === 0 ? (
                          <span
                            onClick={() => navigate('/departments')}
                            style={{
                              color: 'var(--harvard-muted)', fontSize: '12px',
                              cursor: 'pointer', textDecoration: 'underline', fontStyle: 'italic'
                            }}
                          >
                            Not assigned — Add
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {depts.map(d => (
                              <span key={d} className="status-badge role-teacher">{d}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="status-badge role-student">
                          {assigned.length} student{assigned.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge status-present">Active</span>
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

export default FacultyMembers;
