import { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

function Users() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'user' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = () => {
        api.get('/users').then(res => setUsers(res.data.data)).catch(console.error);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', form);
            alert('User added successfully');
            setForm({ fullName: '', email: '', password: '', role: 'user' });
            fetchUsers();
        } catch (err) { alert(err.response?.data?.message || 'Error adding user'); }
    };

    const handleDelete = async (userId) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
        } catch (err) { alert("Failed to delete user"); }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>
            <Link to="/dashboard" style={{ color: '#64748b', textDecoration: 'none', marginBottom: '1.5rem', display: 'inline-block' }}>&larr; Back to Dashboard</Link>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>

                {/* FORM */}
                <div className="card" style={{ maxWidth: '100%', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Add Team Member</h3>
                    <form onSubmit={handleAddUser}>
                        <input className="input-field" placeholder="Full Name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                        <input className="input-field" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        <input className="input-field" type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                        <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                            <option value="user">Regular User</option>
                            <option value="tenant_admin">Tenant Admin</option>
                        </select>
                        <button className="btn btn-primary">Invite User</button>
                    </form>
                </div>

                {/* TABLE */}
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Team Roster</h3>
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Name</th>
                                    <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Role</th>
                                    <th style={{ padding: '1rem', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{u.full_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{u.email}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                background: u.role === 'tenant_admin' ? '#e0e7ff' : '#f1f5f9',
                                                color: u.role === 'tenant_admin' ? '#4338ca' : '#475569',
                                                padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600'
                                            }}>
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button onClick={() => handleDelete(u.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>Remove</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Users;