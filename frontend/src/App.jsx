import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects'; // IMPORT NEW PAGE
import ProjectDetails from './pages/ProjectDetails';
import Users from './pages/Users';
import Tasks from './pages/Tasks';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} /> {/* ADD THIS ROUTE */}
        <Route path="/projects/:projectId" element={<ProjectDetails />} />
        <Route path="/users" element={<Users />} />
        <Route path="/tasks" element={<Tasks />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;