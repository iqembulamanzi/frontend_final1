import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reportIncident, getIncidents, updateIncident, deleteReport, getCitizenIncidents, createCitizenIncident, getUserProfile, updateUserProfile } from '../api';
import './UserDashboard.css';

const UserDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('report');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    description: '',
    priority: 'P2',
    location: '',
    category: 'sewer_blockage'
  });
  const [reporting, setReporting] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [editData, setEditData] = useState({
    description: '',
    priority: 'P2',
    location: '',
    category: 'sewer_blockage'
  });

  // User details state
  const [userDetails, setUserDetails] = useState({
    name: "Community User",
    accountId: "USR-2024-001",
    role: "Community Reporter",
    department: "Public Services",
    lastLogin: new Date().toLocaleDateString()
  });

  // Statistics
  const [stats, setStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    avgResponseTime: '2.5 days'
  });

  // Check if user is regular user, redirect if not
  useEffect(() => {
    console.log('UserDashboard: user prop =', user, 'type:', typeof user);
    if (user !== "user") {
      console.log('UserDashboard: User is not a citizen, redirecting to home');
      navigate("/");
    }
  }, [user, navigate]);

  // Load user's previous reports and notifications
  useEffect(() => {
    const loadUserData = async () => {
      if (user === "user") {
        try {
          setLoading(true);

          // Get user data from localStorage
          const storedUser = localStorage.getItem('user');
          let userId = null;
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            userId = userData.id || userData._id;
          }

          // Load citizen incidents
          try {
            const incidents = await getCitizenIncidents();
            const reports = incidents.data || incidents || [];
            setMyReports(reports);

            // Calculate statistics
            const totalReports = reports.length;
            const resolvedReports = reports.filter(r => r.status === 'resolved' || r.status === 'completed').length;
            const pendingReports = reports.filter(r => r.status === 'reported' || r.status === 'pending').length;

            setStats({
              totalReports,
              resolvedReports,
              pendingReports,
              avgResponseTime: totalReports > 0 ? '2.5 days' : 'N/A' // Mock for now
            });
          } catch (error) {
            console.error('Error loading citizen incidents:', error);
            // If API fails, keep empty array
            setMyReports([]);
            setStats({
              totalReports: 0,
              resolvedReports: 0,
              pendingReports: 0,
              avgResponseTime: 'N/A'
            });
          }

          // Load user profile if userId available
          if (userId) {
            try {
              const profile = await getUserProfile(userId);
              if (profile && profile.name) {
                // Update userDetails with real data
                setUserDetails(prev => ({
                  ...prev,
                  name: profile.name,
                  accountId: profile.accountId || prev.accountId,
                  role: profile.role || prev.role,
                  department: profile.department || prev.department,
                  lastLogin: profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : prev.lastLogin
                }));
              }
            } catch (error) {
              console.error('Error loading user profile:', error);
              // Keep default data on error
            }
          }

          // Mock notifications for now (could be extended to real notifications)
          const mockNotifications = [
            {
              id: '1',
              type: 'update',
              message: 'Your incident reports are being processed',
              time: new Date(Date.now() - 3600000).toISOString(),
              read: false
            },
            {
              id: '2',
              type: 'system',
              message: 'Welcome to the Community Reporter Dashboard',
              time: new Date(Date.now() - 7200000).toISOString(),
              read: true
            }
          ];
          setNotifications(mockNotifications);
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [user]);

  const handleReportIncident = async (e) => {
    e.preventDefault();
    if (!reportData.description || !reportData.location) {
      alert('Please fill in all required fields');
      return;
    }

    setReporting(true);
    try {
      // Create incident data for API
      const incidentData = {
        description: reportData.description,
        priority: reportData.priority,
        category: reportData.category,
        location: reportData.location,
        reporterPhone: '123-456-7890' // Mock phone number
      };

      const result = await createCitizenIncident(incidentData);

      // Add to local reports list
      const newReport = {
        _id: result._id || Date.now().toString(),
        incidentNumber: result.incidentNumber || `INC-${Date.now().toString().slice(-3)}`,
        description: reportData.description,
        status: result.status || 'reported',
        priority: reportData.priority,
        location: reportData.location,
        category: reportData.category,
        createdAt: result.createdAt || new Date().toISOString()
      };

      setMyReports(prev => [newReport, ...prev]);

      alert('Incident reported successfully!');
      setShowReportModal(false);
      setReportData({
        description: '',
        priority: 'P2',
        location: '',
        category: 'sewer_blockage'
      });
    } catch (error) {
      console.error('Error reporting incident:', error);
      if (error.message.includes('403')) {
        alert('You do not have permission to report incidents.');
      } else {
        alert('Failed to report incident. Please try again.');
      }
    } finally {
      setReporting(false);
    }
  };

  const handleReportInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditReport = (report) => {
    setEditingReport(report);
    setEditData({
      description: report.description,
      priority: report.priority,
      location: report.location,
      category: report.category
    });
    setShowEditModal(true);
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    if (!editingReport) return;

    try {
      await updateIncident(editingReport._id, {
        description: editData.description,
        priority: editData.priority,
        location: editData.location,
        category: editData.category
      });

      // Update local state
      setMyReports(prev => prev.map(report =>
        report._id === editingReport._id
          ? { ...report, ...editData }
          : report
      ));

      setShowEditModal(false);
      setEditingReport(null);
      alert('Report updated successfully!');
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report. Please try again.');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteReport(reportId);

      // Update local state
      setMyReports(prev => prev.filter(report => report._id !== reportId));
      alert('Report deleted successfully!');
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const renderReportSection = () => (
    <div className="report-section">
      <div className="section-header">
        <h2>Report Sewer Issues</h2>
        <p>Help improve your community by reporting sewer system problems</p>
      </div>

      <div className="report-actions">
        <button
          className="btn-primary large"
          onClick={() => setShowReportModal(true)}
        >
          <span className="btn-icon">🚨</span>
          Report New Incident
        </button>
      </div>

      <div className="reports-history">
        <h3>Your Previous Reports</h3>
        {loading ? (
          <div className="loading">Loading your reports...</div>
        ) : myReports.length === 0 ? (
          <div className="no-reports">
            <h4>No reports yet</h4>
            <p>You haven't submitted any incident reports yet. Click the button above to report your first issue!</p>
          </div>
        ) : (
          <div className="reports-grid">
            {myReports.map(report => (
              <div key={report._id} className="report-card">
                <div className="report-header">
                  <h4>{report.incidentNumber}</h4>
                  <div className={`status-badge status-${report.status?.toLowerCase() || 'reported'}`}>
                    {report.status || 'Reported'}
                  </div>
                </div>

                <div className="report-details">
                  <p><strong>Description:</strong> {report.description}</p>
                  <p><strong>Location:</strong> {report.location}</p>
                  <p><strong>Priority:</strong> {report.priority}</p>
                  <p><strong>Category:</strong> {report.category?.replace('_', ' ')}</p>
                  <p><strong>Reported:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="report-actions">
                  {report.status === 'reported' && (
                    <>
                      <button
                        className="btn-secondary small"
                        onClick={() => handleEditReport(report)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger small"
                        onClick={() => handleDeleteReport(report._id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStatsSection = () => (
    <div className="stats-section">
      <div className="section-header">
        <h2>Incident Statistics</h2>
        <p>Overview of your community reporting activity</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalReports}</h3>
            <p>Total Reports</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.resolvedReports}</h3>
            <p>Resolved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingReports}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>{stats.avgResponseTime}</h3>
            <p>Avg Response Time</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button
            className="action-btn primary"
            onClick={() => setActiveSection("report")}
          >
            <span className="action-icon">🚨</span>
            Report New Incident
          </button>
          <button
            className="action-btn secondary"
            onClick={() => setActiveSection("report")}
          >
            <span className="action-icon">📋</span>
            View My Reports
          </button>
          <button
            className="action-btn secondary"
            onClick={() => setActiveSection("profile")}
          >
            <span className="action-icon">👤</span>
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfileSection = () => (
    <div className="profile-section">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {userDetails.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="profile-info">
            <h2>{userDetails.name}</h2>
            <p>{userDetails.role}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-row">
            <span className="label">Account ID:</span>
            <span className="value">{userDetails.accountId}</span>
          </div>
          <div className="detail-row">
            <span className="label">Department:</span>
            <span className="value">{userDetails.department}</span>
          </div>
          <div className="detail-row">
            <span className="label">Last Login:</span>
            <span className="value">{userDetails.lastLogin}</span>
          </div>
          <div className="detail-row">
            <span className="label">Reports Submitted:</span>
            <span className="value">{myReports.length}</span>
          </div>
        </div>
      </div>

      <div className="notifications-section">
        <h3>Notifications</h3>
        <div className="notifications-list">
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <div className="notification-icon">
                  {notification.type === 'update' && '🔄'}
                  {notification.type === 'system' && '⚙️'}
                  {notification.type === 'alert' && '🚨'}
                </div>
                <div className="notification-content">
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {new Date(notification.time).toLocaleString()}
                  </span>
                </div>
                {!notification.read && <div className="unread-indicator"></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="user-dashboard">
      <header className="user-header">
        <div className="user-brand">
          <h1>🚰 Community Reporter</h1>
        </div>

        <div className="user-profile">
          <div className="user-info">
            <div className="user-avatar">
              {userDetails.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="user-details">
              <div className="user-name">{userDetails.name}</div>
              <div className="user-meta">
                <span className="account-id">{userDetails.accountId}</span>
                <span className="user-role">{userDetails.role}</span>
              </div>
            </div>
          </div>
          <div className="user-actions">
            <Link to="/" className="nav-link-home">
              🏠 Back to Home
            </Link>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="user-content">
        <aside className="user-sidebar">
          <nav className="user-nav">
            <button
              className={`nav-item ${activeSection === "report" ? "active" : ""}`}
              onClick={() => setActiveSection("report")}
            >
              <span className="nav-icon">🚨</span>
              <span className="nav-label">Report Issues</span>
            </button>
            <button
              className={`nav-item ${activeSection === "stats" ? "active" : ""}`}
              onClick={() => setActiveSection("stats")}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Statistics</span>
            </button>
            <button
              className={`nav-item ${activeSection === "profile" ? "active" : ""}`}
              onClick={() => setActiveSection("profile")}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-label">My Profile</span>
            </button>
          </nav>
        </aside>

        <main className="user-main">
          <div className="user-content-area">
            {activeSection === "report" && renderReportSection()}
            {activeSection === "stats" && renderStatsSection()}
            {activeSection === "profile" && renderProfileSection()}
          </div>
        </main>

        {/* Report Incident Modal */}
        {showReportModal && (
          <div className="modal-overlay-enhanced">
            <div className="report-modal-enhanced">
              <div className="modal-header-enhanced">
                <h2>Report New Incident</h2>
                <p>Report a sewer system issue you discovered in your community</p>
                <button
                  className="close-btn-enhanced"
                  onClick={() => setShowReportModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReportIncident} className="report-form">
                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    value={reportData.description}
                    onChange={(e) => handleReportInputChange('description', e.target.value)}
                    placeholder="Describe the incident in detail..."
                    required
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    value={reportData.location}
                    onChange={(e) => handleReportInputChange('location', e.target.value)}
                    placeholder="Street address or location description"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={reportData.priority}
                    onChange={(e) => handleReportInputChange('priority', e.target.value)}
                  >
                    <option value="P0">P0 - Critical (Immediate action required)</option>
                    <option value="P1">P1 - High (Urgent attention needed)</option>
                    <option value="P2">P2 - Medium (Address within normal timeframe)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={reportData.category}
                    onChange={(e) => handleReportInputChange('category', e.target.value)}
                  >
                    <option value="sewer_blockage">Sewer Blockage</option>
                    <option value="pipe_damage">Pipe Damage</option>
                    <option value="pump_failure">Pump Failure</option>
                    <option value="water_contamination">Water Contamination</option>
                    <option value="infrastructure_damage">Infrastructure Damage</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowReportModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={reporting}
                  >
                    {reporting ? 'Reporting...' : 'Report Incident'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Report Modal */}
        {showEditModal && (
          <div className="modal-overlay-enhanced">
            <div className="report-modal-enhanced">
              <div className="modal-header-enhanced">
                <h2>Edit Incident Report</h2>
                <p>Update your incident report details</p>
                <button
                  className="close-btn-enhanced"
                  onClick={() => setShowEditModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateReport} className="report-form">
                <div className="form-group">
                  <label htmlFor="edit-description">Description *</label>
                  <textarea
                    id="edit-description"
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the incident in detail..."
                    required
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-location">Location *</label>
                  <input
                    type="text"
                    id="edit-location"
                    value={editData.location}
                    onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Street address or location description"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-priority">Priority</label>
                  <select
                    id="edit-priority"
                    value={editData.priority}
                    onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="P0">P0 - Critical (Immediate action required)</option>
                    <option value="P1">P1 - High (Urgent attention needed)</option>
                    <option value="P2">P2 - Medium (Address within normal timeframe)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-category">Category</label>
                  <select
                    id="edit-category"
                    value={editData.category}
                    onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="sewer_blockage">Sewer Blockage</option>
                    <option value="pipe_damage">Pipe Damage</option>
                    <option value="pump_failure">Pump Failure</option>
                    <option value="water_contamination">Water Contamination</option>
                    <option value="infrastructure_damage">Infrastructure Damage</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Update Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;