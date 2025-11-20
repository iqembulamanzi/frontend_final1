import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import { authService } from "../services/authService";
import { getDashboardRoute } from "../utils/roleMapping";
import "./Home.css";

const Home = ({ user, onLogin, onLogout }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [stats, setStats] = useState({
    activeIncidents: 24,
    systemEfficiency: "98.2%",
    monitoringPoints: 1243,
    ongoingIncidents: 24
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch real stats on component mount - only if user is logged in
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return; // Don't fetch if not authenticated
        }

        // Only fetch basic stats that don't require authentication
        setStats({
          activeIncidents: 24, // Keep default for now
          systemEfficiency: "98.2%",
          monitoringPoints: 1243,
          ongoingIncidents: 24
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Keep default stats on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const result = await authService.login(credentials.email, credentials.password);
      console.log('Home.jsx handleLogin: result =', result);

      if (result.success) {
        const userRole = result.user.role.toLowerCase();
        console.log('Home.jsx: setting user role to', userRole);
        onLogin(userRole);

        // Navigate to designated dashboard based on user role
        navigate(result.dashboardRoute);
        setIsLoginModalOpen(false);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    onLogout();
  };

  const handleDashboardNavigation = (role) => {
    const dashboardRoute = getDashboardRoute(role);
    navigate(dashboardRoute);
  };

  return (
    <div className="home-container">
      {/* Header with login/logout button */}
      <header className="home-header">
        <div className="right-links">
          {user ? (
            <button onClick={handleLogout} className="nav-link login-btn">
              Logout ({user})
            </button>
          ) : (
            <div className="auth-buttons">
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="nav-link register-btn"
              >
                Register
              </button>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="nav-link login-btn"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="home-main">
        <div className="hero-content">
          <h1>Sewer System Monitoring Platform</h1>
          <p>Advanced monitoring and management for urban sewer infrastructure</p>
          <div className="search-container">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Enter incident reference number..."
                className="search-input"
              />
              <button className="search-button">
                <span className="search-icon">🔍</span>
                Locate
              </button>
            </div>
          </div>
        </div>
        
        {/* Quick stats section */}
        <div className="stats-preview">
          <div className="stat-card">
            <h3>{loading ? '...' : stats.monitoringPoints.toLocaleString()}</h3>
            <p>Active Monitoring Points</p>
          </div>
          <div className="stat-card">
            <h3>{stats.systemEfficiency}</h3>
            <p>System Efficiency</p>
          </div>
          <div className="stat-card">
            <h3>{loading ? '...' : stats.ongoingIncidents}</h3>
            <p>Ongoing Incidents</p>
          </div>
        </div>

        {/* Dashboard Navigation Section */}
        {user && (
          <div className="dashboard-navigation">
            <h2>Access Your Dashboard</h2>
            <p>Continue to your role-specific dashboard to manage sewer system operations</p>
            <button
              className="dashboard-btn primary"
              onClick={() => handleDashboardNavigation(user)}
            >
              Go to {user === 'admin' ? 'Admin' : user === 'manager' ? 'Team Manager' : user === 'guardian' ? 'Field Technician' : user === 'user' ? 'Community Reporter' : 'Dashboard'}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <Link to="/about" className="footer-link">About Us</Link>
        <Link to="/chatbot" className="footer-link">Chatbot Support</Link>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisterSuccess={() => {
          // Optionally show success message or auto-open login
          alert('Registration successful! Please login with your credentials.');
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
};

export default Home;