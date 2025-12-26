import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [data, setData] = useState([]); // Stores Projects OR Tenants
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) { navigate('/login'); return; }
        setUser(userData);

        // FETCH DATA BASED ON ROLE
        if (userData.role === 'super_admin') {
            // Super Admin sees Tenants
            api.get('/tenants').then(res => setData(res.data.data.tenants)).catch(console.error);
        } else {
            // Regular Users see Projects
            api.get('/projects').then(res => setData(res.data.data)).catch(console.error);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleCreateProject = async () => {
        const name = prompt("Enter project name:");
        const desc = prompt("Enter description:");
        if (!name) return;
        try {
            await api.post('/projects', { name, description: desc });
            window.location.reload();
        } catch (err) { alert(err.response?.data?.message || "Error"); }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            {/* PROFESSIONAL NAVBAR */}
            <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ fontWeight: '800', fontSize: '1.5rem', color: '#0f172a', letterSpacing: '-0.5px' }}>SaaS<span style={{ color: '#3b82f6' }}>Corp</span></div>
                    {user?.role === 'tenant_admin' && (
                        <button onClick={() => navigate('/users')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: '500' }}>Manage Team</button>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>{user?.email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.role?.replace('_', ' ')}</div>
                    </div>
                    <button onClick={handleLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem' }}>Logout</button>
                </div>
            </nav>

            <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>

                {/* HEADER SECTION */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>
                            {user?.role === 'super_admin' ? 'All Tenants' : 'Dashboard'}
                        </h1>
                        <p style={{ color: '#64748b' }}>Welcome back to your workspace.</p>
                    </div>
                    {user?.role !== 'super_admin' && (
                        <button onClick={handleCreateProject} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>+</span> Create Project
                        </button>
                    )}
                </div>

                {/* CONTENT GRID */}
                {data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>No items found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {data.map(item => (
                            <div key={item.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>

                                {/* CARD HEADER */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{item.name}</h3>
                                    <span style={{
                                        background: item.status === 'active' ? '#dcfce7' : '#f1f5f9',
                                        color: item.status === 'active' ? '#166534' : '#475569',
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase'
                                    }}>
                                        {item.status}
                                    </span>
                                </div>

                                {/* CARD BODY */}
                                <div style={{ flex: 1 }}>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                                        {item.description || (item.subdomain ? `Subdomain: ${item.subdomain}` : 'No description provided.')}
                                    </p>

                                    {/* Super Admin Specifics */}
                                    {user?.role === 'super_admin' && (
                                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>
                                            <div>Plan: <strong>{item.subscription_plan}</strong></div>
                                            <div>Users: {item.max_users} limit</div>
                                        </div>
                                    )}
                                </div>

                                {/* CARD FOOTER */}
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: 'auto' }}>
                                    {user?.role !== 'super_admin' ? (
                                        <button
                                            onClick={() => navigate(`/projects/${item.id}`)}
                                            style={{ width: '100%', padding: '0.6rem', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                                        >
                                            View Tasks &rarr;
                                        </button>
                                    ) : (
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>Tenant ID: {item.id.substring(0, 8)}...</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;