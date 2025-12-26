import { useEffect, useState } from 'react';
import api from '../api';
import { useParams, Link } from 'react-router-dom';

function ProjectDetails() {
    const { projectId } = useParams();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const fetchTasks = () => {
        api.get(`/projects/${projectId}/tasks`)
            .then(res => setTasks(res.data.data))
            .catch(err => console.error("Error fetching tasks", err));
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask) return;
        try {
            await api.post(`/projects/${projectId}/tasks`, { title: newTask, status: 'todo' });
            setNewTask('');
            fetchTasks(); // Refresh list
        } catch (err) {
            alert('Failed to add task');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
            <Link to="/dashboard" style={{ color: '#2563eb', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>← Back to Dashboard</Link>

            <div className="card" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Project Tasks</h2>

                <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
                    <input
                        className="input-field"
                        style={{ marginBottom: 0 }}
                        placeholder="What needs to be done?"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Add Task</button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tasks.map(task => (
                        <div key={task.id} style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{task.title}</span>
                            <span style={{
                                background: task.status === 'completed' ? '#d1fae5' : '#fee2e2',
                                color: task.status === 'completed' ? '#065f46' : '#991b1b',
                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', textTransform: 'uppercase'
                            }}>
                                {task.status}
                            </span>
                        </div>
                    ))}
                    {tasks.length === 0 && <p style={{ color: '#6b7280', textAlign: 'center' }}>No tasks yet.</p>}
                </div>
            </div>
        </div>
    );
}

export default ProjectDetails;