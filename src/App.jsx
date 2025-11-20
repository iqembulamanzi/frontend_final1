import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './components/Admin';
import Chatbot from './components/Chatbot';
import AssignJob from './components/AssignJob';
import Stats from './components/Stats';
import Home from './components/Home';
import GuardianDashboard from './components/GuardianDashboard';
import CitizenDashboard from './components/CitizenDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import './App.css'; // We'll create this file to reset styles

function App() {
  const [user, setUser] = useState(null);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    console.log('App.jsx useEffect: token =', !!token, 'storedUser =', storedUser);
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('App.jsx: parsed userData =', userData);
        // Set user role based on stored user data
        const userRole = userData.role ? userData.role.toLowerCase() : 'user';
        console.log('App.jsx: setting user to', userRole);
        setUser(userRole);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Fallback to default if parsing fails
        setUser('user');
      }
    } else {
      console.log('App.jsx: No token or stored user, user remains null');
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
        <Route path="/admin/dashboard" element={<Admin user={user || "admin"} onLogout={() => handleLogout()} />} />
        <Route path="/citizen/dashboard" element={<CitizenDashboard user={user || "user"} onLogout={handleLogout} />} />
        {console.log('App.jsx: Rendering /citizen/dashboard route with user =', user, 'passing user prop =', user || "user")}
        <Route path="/technician/dashboard" element={<GuardianDashboard user={user || "guardian"} onLogout={handleLogout} />} />
        <Route path="/manager/dashboard" element={<ManagerDashboard user={user || "manager"} onLogout={handleLogout} />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/assign-job" element={<AssignJob user={user || "manager"} onLogout={handleLogout} />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </Router>
  );
}

export default App;