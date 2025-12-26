import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Check Auth
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        setUser(JSON.parse(userData));

        // 2. Fetch Projects
        api.get('/projects')
            .then(res => setProjects(res.data.data))
            .catch(err => console.error("Error fetching projects:", err));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleCreateProject = async () => {
        const name = prompt("Enter project name:");
        if (!name) return;

        try {
            await api.post('/projects', { name, description: 'New project created via Dashboard' });
            // Refresh list
            const res = await api.get('/projects');
            setProjects(res.data.data);
        } catch (err) {
            alert("Failed to create project");
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
            {/* Navbar */}
            <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#2563eb' }}>SaaS Platform</div>

                    {/* Navigation Links */}
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <span style={{ fontWeight: '500', color: '#111827', cursor: 'default' }}>Dashboard</span>
                        {user?.role === 'tenant_admin' && (
                            <button
                                onClick={() => navigate('/users')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem' }}
                            >
                                Manage Team
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {user?.email}
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '8px', textTransform: 'capitalize' }}>
                            {user?.role?.replace('_', ' ')}
                        </span>
                    </span>
                    <button
                        onClick={handleLogout}
                        style={{ background: 'white', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>My Projects</h1>
                    <button onClick={handleCreateProject} className="btn btn-primary" style={{ width: 'auto' }}>
                        + New Project
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '0.5rem', border: '1px dashed #d1d5db' }}>
                        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No projects found.</p>
                        <button onClick={handleCreateProject} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Create your first project</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {projects.map(p => (
                            <div key={p.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>{p.name}</h3>
                                    <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1rem' }}>{p.description}</p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '1rem', marginTop: '1rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: '10px' }}>Active</span>
                                    <button
                                        onClick={() => navigate(`/projects/${p.id}`)}
                                        style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
                                    >
                                        View Tasks →
                                    </button>
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