import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getAttendanceRecords } from '../services/firebase';
import HarvardNavigation from '../components/HarvardNavigation';

const TodayAttendanceSummary = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersResult, attendanceResult] = await Promise.all([
                getAllUsers(),
                getAttendanceRecords()
            ]);
            if (usersResult.success) setUsers(usersResult.data);
            if (attendanceResult.success) setAttendance(attendanceResult.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTodayRecords = () => {
        const today = new Date().toISOString().split('T')[0];
        return attendance.filter(record => record.date === today);
    };

    if (loading) {
        return (
            <>
                <HarvardNavigation />
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading today's attendance...</p>
                    </div>
                </div>
            </>
        );
    }

    const todayRecords = getTodayRecords();
    const present = todayRecords.filter(r => r.status === 'present').length;
    const absent = todayRecords.filter(r => r.status === 'absent').length;
    const late = todayRecords.filter(r => r.status === 'late').length;

    return (
        <>
            <HarvardNavigation />
            <div className="container">
                {/* Page Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ color: 'var(--harvard-crimson)', fontSize: '2.5rem', marginBottom: '10px' }}>
                        Today's Attendance Summary
                    </h1>
                    <p style={{ color: 'var(--harvard-muted)', fontSize: '1.1rem', fontStyle: 'italic' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: '30px' }}>
                    <div className="stat-card">
                        <h3>{todayRecords.length}</h3>
                        <p>Total Records</p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ color: '#28a745' }}>{present}</h3>
                        <p>Present</p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ color: '#dc3545' }}>{absent}</h3>
                        <p>Absent</p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ color: '#ffc107' }}>{late}</h3>
                        <p>Late</p>
                    </div>
                </div>

                {/* Table */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ color: 'var(--harvard-crimson)' }}>
                            Attendance Records ({todayRecords.length})
                        </h2>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/admin')}
                        >
                            Back to Dashboard
                        </button>
                    </div>

                    {todayRecords.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--harvard-muted)', padding: '40px' }}>
                            No attendance records for today
                        </p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Status</th>
                                    <th>Marked By</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayRecords.map(record => {
                                    const student = users.find(u => u.id === record.studentId);
                                    const markedBy = users.find(u => u.id === record.markedBy);
                                    return (
                                        <tr key={record.id}>
                                            <td style={{ fontWeight: '600', color: 'var(--harvard-text)' }}>
                                                {student ? student.name : 'Unknown'}
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${record.status}`}>
                                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{markedBy ? markedBy.name : 'Unknown'}</td>
                                            <td style={{ color: 'var(--harvard-muted)', fontSize: '0.9rem' }}>
                                                {record.timestamp
                                                    ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : '-'}
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

export default TodayAttendanceSummary;
