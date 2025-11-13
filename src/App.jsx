import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './components/Admin';
import Chatbot from './components/Chatbot';
import AssignJob from './components/AssignJob';
import Stats from './components/Stats';
import Home from './components/Home';
import GuardianDashboard from './components/GuardianDashboard';
import UserDashboard from './components/UserDashboard';
import './App.css'; // We'll create this file to reset styles

function App() {
  const [user, setUser] = useState(null);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // You could validate the token here with the backend
      // For now, we'll assume it's valid and set a default user role
      setUser('manager'); // Changed to manager for testing assign-job route
    }
  }, []);

  const handleLogin = (userRole) => {
    setUser(userRole);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    // Navigate to home page after logout
    window.location.href = '/';
  };

  return (
    <Router>
      {/* Remove any container divs that might have padding/margin */}
      <Routes>
        <Route path="/" element={<Home user={user} onLogin={handleLogin} onLogout={handleLogout} />} />
        <Route path="/admin" element={<Admin user={user || "admin"} onLogout={handleLogout} />} />
        <Route path="/user" element={<UserDashboard user={user || "user"} onLogout={handleLogout} />} />
        <Route path="/guardian" element={<GuardianDashboard user={user || "guardian"} onLogout={handleLogout} />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/assign-job" element={<AssignJob user={user || "manager"} onLogout={handleLogout} />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </Router>
  );
}

export default App;