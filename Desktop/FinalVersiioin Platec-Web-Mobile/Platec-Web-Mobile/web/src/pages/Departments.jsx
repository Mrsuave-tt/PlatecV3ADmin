import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAllUsers,
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from '../services/firebase';
import HarvardNavigation from '../components/HarvardNavigation';

const Departments = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [newDept, setNewDept] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    // Editing teacher assignment per department
    const [editingDeptId, setEditingDeptId] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        const [deptResult, usersResult] = await Promise.all([
            getDepartments(),
            getAllUsers(),
        ]);
        if (deptResult.success) setDepartments(deptResult.data);
        if (usersResult.success) setTeachers(usersResult.data.filter(u => u.role === 'teacher'));
        setLoading(false);
    };

    const showMsg = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3500);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newDept.name.trim()) return;
        setCreating(true);
        const result = await createDepartment({ name: newDept.name.trim(), description: newDept.description.trim(), teacherIds: [] });
        if (result.success) {
            setDepartments(prev => [...prev, { id: result.id, name: newDept.name.trim(), description: newDept.description.trim(), teacherIds: [] }]);
            setNewDept({ name: '', description: '' });
            setShowCreate(false);
            showMsg('✅ Department created!');
        } else {
            showMsg(`❌ ${result.error}`, 'error');
        }
        setCreating(false);
    };

    const handleDeleteDept = async (deptId, deptName) => {
        if (!window.confirm(`Delete department "${deptName}"?`)) return;
        const result = await deleteDepartment(deptId);
        if (result.success) {
            setDepartments(prev => prev.filter(d => d.id !== deptId));
            showMsg('✅ Department deleted.');
        } else {
            showMsg(`❌ ${result.error}`, 'error');
        }
    };

    const handleToggleTeacher = async (dept, teacherId) => {
        const already = (dept.teacherIds || []).includes(teacherId);
        const newIds = already
            ? dept.teacherIds.filter(id => id !== teacherId)
            : [...(dept.teacherIds || []), teacherId];

        setSaving(true);
        const result = await updateDepartment(dept.id, { teacherIds: newIds });
        if (result.success) {
            setDepartments(prev => prev.map(d =>
                d.id === dept.id ? { ...d, teacherIds: newIds } : d
            ));
        } else {
            showMsg(`❌ ${result.error}`, 'error');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <>
                <HarvardNavigation />
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading departments...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <HarvardNavigation />
            <div className="container" style={{ maxWidth: '900px' }}>

                {/* Page header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ color: 'var(--harvard-crimson)', fontSize: '2rem', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.5px' }}>
                        Departments
                    </h1>
                    <p style={{ color: 'var(--harvard-muted)', fontSize: '0.95rem' }}>
                        Manage academic departments and assign faculty members
                    </p>
                </div>

                {/* Message */}
                {message.text && (
                    <div style={{
                        background: message.type === 'error' ? '#FDE8EC' : '#E6F9EE',
                        color: message.type === 'error' ? '#9B1B30' : '#1A7A40',
                        border: `1px solid ${message.type === 'error' ? '#F5C0CB' : '#B7EDD0'}`,
                        borderRadius: '10px', padding: '12px 18px', marginBottom: '20px',
                        fontSize: '13px', fontWeight: '500'
                    }}>{message.text}</div>
                )}

                {/* Action bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <p style={{ color: 'var(--harvard-muted)', fontSize: '13px' }}>{departments.length} department{departments.length !== 1 ? 's' : ''}</p>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        style={{
                            background: 'var(--harvard-crimson)', color: 'white', border: 'none',
                            borderRadius: '10px', padding: '10px 20px', fontWeight: '600',
                            fontSize: '13px', cursor: 'pointer', letterSpacing: '0.3px'
                        }}
                    >
                        {showCreate ? '✕ Cancel' : '+ New Department'}
                    </button>
                </div>

                {/* Create form */}
                {showCreate && (
                    <div className="card" style={{ marginBottom: '24px', background: '#FAFBFE', border: '1.5px dashed var(--harvard-border)' }}>
                        <h3 style={{ color: 'var(--harvard-crimson)', fontWeight: '700', marginBottom: '16px', fontSize: '1rem' }}>New Department</h3>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Department Name <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. Computer Science"
                                    value={newDept.name}
                                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                                    required
                                    style={{ borderRadius: '10px' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Optional short description"
                                    value={newDept.description}
                                    onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                                    style={{ borderRadius: '10px' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={creating}
                                style={{
                                    background: 'var(--harvard-crimson)', color: 'white', border: 'none',
                                    borderRadius: '10px', padding: '10px 24px', fontWeight: '700',
                                    fontSize: '13px', cursor: 'pointer'
                                }}
                            >
                                {creating ? 'Creating...' : 'Create Department'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Departments list */}
                {departments.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏛️</div>
                        <p style={{ color: 'var(--harvard-muted)', fontSize: '1rem' }}>No departments yet. Create your first department above.</p>
                    </div>
                ) : (
                    departments.map(dept => {
                        const deptTeachers = teachers.filter(t => (dept.teacherIds || []).includes(t.id));
                        const isEditing = editingDeptId === dept.id;
                        return (
                            <div key={dept.id} className="card" style={{ marginBottom: '20px' }}>
                                {/* Dept header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '1.3rem' }}>🏛️</span>
                                            <h3 style={{ margin: 0, color: 'var(--harvard-text)', fontWeight: '700', fontSize: '1.1rem' }}>{dept.name}</h3>
                                        </div>
                                        {dept.description && (
                                            <p style={{ color: 'var(--harvard-muted)', fontSize: '13px', margin: '0 0 0 34px' }}>{dept.description}</p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setEditingDeptId(isEditing ? null : dept.id)}
                                            style={{
                                                background: isEditing ? '#E6F9EE' : '#F4F6F9',
                                                color: isEditing ? '#1A7A40' : 'var(--harvard-muted)',
                                                border: `1px solid ${isEditing ? '#B7EDD0' : 'var(--harvard-border)'}`,
                                                borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                            }}
                                        >
                                            {isEditing ? '✓ Done' : '👥 Assign Teachers'}
                                        </button>
                                        <button
                                            className="btn-trash"
                                            onClick={() => handleDeleteDept(dept.id, dept.name)}
                                            title={`Delete ${dept.name}`}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {/* Assigned teachers summary */}
                                {!isEditing && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '28px' }}>
                                        {deptTeachers.length === 0 ? (
                                            <span style={{ fontSize: '13px', color: 'var(--harvard-muted)', fontStyle: 'italic' }}>No teachers assigned yet</span>
                                        ) : (
                                            deptTeachers.map(t => (
                                                <span key={t.id} className="status-badge role-teacher">{t.name}</span>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Teacher assignment panel */}
                                {isEditing && (
                                    <div style={{
                                        background: '#F4F6F9', borderRadius: '12px',
                                        padding: '16px', marginTop: '8px'
                                    }}>
                                        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--harvard-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                                            Select Faculty Members for this Department
                                        </p>
                                        {teachers.length === 0 ? (
                                            <p style={{ fontSize: '13px', color: 'var(--harvard-muted)' }}>No teachers found. Add teachers via User Management first.</p>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                                                {teachers.map(teacher => {
                                                    const assigned = (dept.teacherIds || []).includes(teacher.id);
                                                    return (
                                                        <label
                                                            key={teacher.id}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                                background: assigned ? '#E6F9EE' : 'white',
                                                                border: `1.5px solid ${assigned ? '#B7EDD0' : 'var(--harvard-border)'}`,
                                                                borderRadius: '10px', padding: '10px 14px',
                                                                cursor: 'pointer', transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={assigned}
                                                                onChange={() => handleToggleTeacher(dept, teacher.id)}
                                                                disabled={saving}
                                                                style={{ accentColor: '#1A7A40', width: '16px', height: '16px' }}
                                                            />
                                                            <div>
                                                                <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--harvard-text)' }}>{teacher.name}</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--harvard-muted)' }}>{teacher.email}</div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
};

export default Departments;
