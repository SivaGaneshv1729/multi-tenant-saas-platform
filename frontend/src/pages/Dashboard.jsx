import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Check if user is logged in
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        setUser(JSON.parse(userData));

        // 2. Fetch Protected Data
        api.get('/projects')
            .then(res => setProjects(res.data.data))
            .catch(err => console.error("Failed to fetch projects", err));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div style={{ padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1>Dashboard</h1>
                <div>
                    <span>Welcome, {user?.email} ({user?.role}) </span>
                    <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
                </div>
            </header>

            <section>
                <h3>My Projects (Tenant Isolated)</h3>
                {projects.length === 0 ? (
                    <p>No projects found.</p>
                ) : (
                    <ul>
                        {projects.map(p => (
                            <li key={p.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
                                <strong>{p.name}</strong>
                                <p>{p.description}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default Dashboard;