import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getIncidents, getAllocatedIncidents, getUnallocatedIncidents, allocateIncident, updateIncident, getIncidentsForMap, getUsers } from "../api";
import { Loader } from "@googlemaps/js-api-loader";
import "./Admin.css";

const Admin = ({ user }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  // Admin details
  const adminDetails = {
    name: "Admin User",
    staffNumber: "ADM-2024-001",
    role: "System Administrator",
    department: "Infrastructure Management",
    lastLogin: new Date().toLocaleDateString()
  };

  // Team members available for assignment
  const [teamMembers] = useState([
    { id: 1, name: "Mike Johnson", role: "Field Technician", status: "Available", avatar: "MJ", tasks: 2 },
    { id: 2, name: "Sarah Wilson", role: "Senior Technician", status: "On Site", avatar: "SW", tasks: 3 },
    { id: 3, name: "David Brown", role: "Maintenance Engineer", status: "Available", avatar: "DB", tasks: 1 },
    { id: 4, name: "Lisa Garcia", role: "Field Technician", status: "On Break", avatar: "LG", tasks: 0 },
    { id: 5, name: "James Miller", role: "Emergency Response", status: "Available", avatar: "JM", tasks: 2 }
  ]);

  // Real data from API
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalUsers: 1,
      activeIncidents: 0,
      systemUptime: "99.8%",
      monitoringPoints: 1243,
      assignedIncidents: 0,
      responseTime: "2.3h"
    },
    recentActivity: [],
    incidents: []
  });
  const [loading, setLoading] = useState(true); // eslint-disable-line no-unused-vars
  const [error, setError] = useState(null); // eslint-disable-line no-unused-vars
  const [heatmapData, setHeatmapData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    notifications: true,
    dataRetention: 365,
    maxFileSize: 10,
    maintenanceMode: false
  });
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalIncidents: 0,
    resolvedIncidents: 0,
    averageResponseTime: '2.3h',
    systemUptime: '99.8%'
  });

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (user !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch real data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [allIncidents, unallocated, allocated, mapIncidents, users] = await Promise.all([
          getIncidents(),
          getUnallocatedIncidents(),
          getAllocatedIncidents(),
          getIncidentsForMap(),
          getUsers()
        ]);

        // Transform API data to match component structure
        const transformedIncidents = allIncidents.map((incident) => ({
          id: incident._id,
          incidentId: incident.incidentNumber,
          location: "Unknown Location", // Would need to be calculated from coordinates
          status: incident.status === 'reported' ? 'Active' :
                  incident.status === 'verified' ? 'Assigned' :
                  incident.status === 'in_progress' ? 'In Progress' :
                  incident.status === 'resolved' ? 'Resolved' : 'Investigating',
          priority: incident.priority === 'P0' ? 'High' :
                   incident.priority === 'P1' ? 'High' :
                   incident.priority === 'P2' ? 'Medium' : 'Low',
          reported: new Date(incident.createdAt).toLocaleString(),
          description: incident.description,
          assignedTo: incident.guardianAssigned ? incident.guardianAssigned.first_name + ' ' + incident.guardianAssigned.last_name : null,
          assignedTime: incident.guardianAssigned ? "Recently" : null,
          estimatedResolution: "TBD",
          area: "Unknown",
          severity: incident.priority === 'P0' ? 'Critical' :
                   incident.priority === 'P1' ? 'High' : 'Moderate'
        }));

        setDashboardData(prev => ({
          ...prev,
          overview: {
            ...prev.overview,
            activeIncidents: unallocated.incidents?.length || 0,
            assignedIncidents: allocated.incidents?.length || 0
          },
          incidents: transformedIncidents,
          recentActivity: [] // Would need to be fetched separately
        }));

        setHeatmapData(mapIncidents.incidents || []);
        setAllUsers(users || []);

        // Mock analytics data
        setAnalyticsData({
          totalUsers: users?.length || 0,
          activeUsers: users?.filter(u => u.status === 'active').length || 0,
          totalIncidents: allIncidents?.length || 0,
          resolvedIncidents: allIncidents?.filter(i => i.status === 'resolved').length || 0,
          averageResponseTime: '2.3h',
          systemUptime: '99.8%'
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user === "admin") {
      fetchDashboardData();
    }
  }, [user]);

  // Handle incident assignment
  const handleAssignIncident = (incident) => {
    setSelectedIncident(incident);
    setShowAssignmentModal(true);
  };

  const handleAssignToTechnician = async (technician) => {
    if (selectedIncident) {
      try {
        // Use the API to allocate incident
        await allocateIncident(selectedIncident.id, technician.id);

        // Update local state optimistically
        const updatedIncidents = dashboardData.incidents.map(incident =>
          incident.id === selectedIncident.id
            ? {
                ...incident,
                assignedTo: technician.name,
                assignedTime: "Just now",
                status: "Assigned"
              }
            : incident
        );

        setDashboardData(prev => ({
          ...prev,
          incidents: updatedIncidents,
          overview: {
            ...prev.overview,
            activeIncidents: Math.max(0, prev.overview.activeIncidents - 1),
            assignedIncidents: prev.overview.assignedIncidents + 1
          },
          recentActivity: [
            {
              id: Date.now(),
              action: "Technician assigned",
              incident: selectedIncident.incidentId,
              technician: technician.name,
              time: "Just now",
              type: "assignment"
            },
            ...prev.recentActivity
          ]
        }));

        setShowAssignmentModal(false);
        setSelectedIncident(null);
      } catch (error) {
        console.error('Error assigning technician:', error);
        alert('Failed to assign technician. Please try again.');
      }
    }
  };

  const handleUpdateIncidentStatus = async (incidentId, newStatus) => {
    try {
      // Map frontend status to API status
      const apiStatus = newStatus === "Resolved" ? "resolved" :
                        newStatus === "In Progress" ? "in_progress" :
                        newStatus === "Assigned" ? "verified" : "reported";

      await updateIncident(incidentId, { status: apiStatus });

      const updatedIncidents = dashboardData.incidents.map(incident =>
        incident.id === incidentId
          ? {
              ...incident,
              status: newStatus,
              ...(newStatus === "Resolved" && { resolvedTime: new Date().toLocaleString() })
            }
          : incident
      );

      setDashboardData(prev => ({
        ...prev,
        incidents: updatedIncidents
      }));
    } catch (error) {
      console.error('Error updating incident status:', error);
      alert('Failed to update incident status. Please try again.');
    }
  };

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      // In a real app, this would call an API to update user role
      setAllUsers(prev => prev.map(user =>
        user._id === userId ? { ...user, role: newRole } : user
      ));
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      // In a real app, this would call an API to block/unblock user
      setAllUsers(prev => prev.map(user =>
        user._id === userId ? { ...user, status: user.status === 'blocked' ? 'active' : 'blocked' } : user
      ));
      alert('User status updated successfully');
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // In a real app, this would call an API to delete user
      setAllUsers(prev => prev.filter(user => user._id !== userId));
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleCreateUser = () => {
    // In a real app, this would open a modal to create a new user
    alert('Create user functionality would open a form here');
  };

  const handleUpdateSettings = (setting, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    alert('Settings updated successfully');
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div className="welcome-text">
          <h1>Welcome back, {adminDetails.name} 👋</h1>
          <p>Here's what's happening with your sewer system today</p>
        </div>
        <div className="current-time">
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-grid">
        <div className="stat-card primary">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>{dashboardData.overview.activeIncidents}</h3>
            <p>Active Incidents</p>
            <span className="trend down">-5% from yesterday</span>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{dashboardData.overview.assignedIncidents}</h3>
            <p>Assigned Incidents</p>
            <span className="trend up">+8% efficiency</span>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>{dashboardData.overview.responseTime}</h3>
            <p>Avg Response Time</p>
            <span className="trend down">-12% faster</span>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">📡</div>
          <div className="stat-content">
            <h3>{dashboardData.overview.monitoringPoints}</h3>
            <p>Monitoring Points</p>
            <span className="trend up">All systems operational</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="main-grid">
        {/* Recent Incidents */}
        <div className="grid-card incidents-preview">
          <div className="card-header">
            <h3>Recent Incidents</h3>
            <button className="view-all-btn">View All →</button>
          </div>
          <div className="incidents-list">
            {dashboardData.incidents.slice(0, 4).map(incident => (
              <div key={incident.id} className="incident-preview-card">
                <div className="incident-priority">
                  <div className={`priority-dot priority-${incident.priority.toLowerCase()}`}></div>
                </div>
                <div className="incident-details">
                  <h4>{incident.incidentId}</h4>
                  <p>{incident.location}</p>
                  <span className="incident-area">{incident.area}</span>
                </div>
                <div className="incident-status">
                  <span className={`status-tag status-${incident.status.toLowerCase().replace(' ', '-')}`}>
                    {incident.status}
                  </span>
                  <span className="incident-time">{incident.reported}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Overview */}
        <div className="grid-card team-overview">
          <div className="card-header">
            <h3>Team Overview</h3>
            <span className="online-count">{teamMembers.filter(m => m.status === 'Available').length} online</span>
          </div>
          <div className="team-grid-compact">
            {teamMembers.map(member => (
              <div key={member.id} className="team-member-compact">
                <div className="member-avatar-status">
                  <div className="member-avatar">
                    {member.avatar}
                  </div>
                  <div className={`online-status ${member.status === 'Available' ? 'online' : member.status === 'On Site' ? 'busy' : 'away'}`}></div>
                </div>
                <div className="member-details-compact">
                  <h4>{member.name}</h4>
                  <p>{member.role}</p>
                </div>
                <div className="member-tasks">
                  <span className="task-count">{member.tasks}</span>
                  <span className="task-label">tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid-card quick-actions-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="action-grid">
            <button className="action-card primary">
              <span className="action-icon">➕</span>
              <span className="action-text">New Incident</span>
            </button>
            <button className="action-card secondary">
              <span className="action-icon">📊</span>
              <span className="action-text">Generate Report</span>
            </button>
            <button className="action-card warning">
              <span className="action-icon">👥</span>
              <span className="action-text">Manage Team</span>
            </button>
            <button className="action-card danger">
              <span className="action-icon">⚙️</span>
              <span className="action-text">System Settings</span>
            </button>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="grid-card activity-feed">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-timeline">
            {dashboardData.recentActivity.map(activity => (
              <div key={activity.id} className="activity-item-enhanced">
                <div className={`activity-icon-enhanced ${activity.type}`}>
                  {activity.type === 'incident' && '🚨'}
                  {activity.type === 'user' && '👤'}
                  {activity.type === 'assignment' && '✅'}
                  {activity.type === 'system' && '⚙️'}
                  {activity.type === 'resolution' && '🎉'}
                </div>
                <div className="activity-content">
                  <p className="activity-message">{activity.action}</p>
                  <div className="activity-meta">
                    {activity.location && <span className="activity-location">📍 {activity.location}</span>}
                    {activity.incident && <span className="activity-incident">#{activity.incident}</span>}
                    {activity.technician && <span className="activity-technician">👨‍💼 {activity.technician}</span>}
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderIncidentsSection = () => (
    <div className="incidents-section-enhanced">
      {/* Header with Stats */}
      <div className="incidents-header">
        <div className="header-content">
          <h1>Incident Management</h1>
          <p>Monitor and manage all sewer system incidents in real-time</p>
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-number">{dashboardData.incidents.length}</span>
            <span className="stat-label">Total Incidents</span>
          </div>
          <div className="header-stat">
            <span className="stat-number">{dashboardData.incidents.filter(i => i.status === 'Active').length}</span>
            <span className="stat-label">Require Attention</span>
          </div>
          <div className="header-stat">
            <span className="stat-number">{dashboardData.incidents.filter(i => i.priority === 'High').length}</span>
            <span className="stat-label">High Priority</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-group">
          <button className="btn-primary">
            <span className="btn-icon">➕</span>
            Report New Incident
          </button>
          <button className="btn-secondary">
            <span className="btn-icon">📋</span>
            Bulk Actions
          </button>
        </div>
        <div className="filter-group">
          <select className="filter-select">
            <option>All Status</option>
            <option>Active</option>
            <option>Assigned</option>
            <option>Resolved</option>
          </select>
          <select className="filter-select">
            <option>All Priority</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search incidents..." className="search-input" />
          </div>
        </div>
      </div>

      {/* Incidents Grid */}
      <div className="incidents-grid">
        {dashboardData.incidents.map(incident => (
          <div key={incident.id} className={`incident-card priority-${incident.priority.toLowerCase()}`}>
            <div className="incident-card-header">
              <div className="incident-id-priority">
                <h3>{incident.incidentId}</h3>
                <div className={`priority-badge-enhanced priority-${incident.priority.toLowerCase()}`}>
                  {incident.priority} Priority
                </div>
              </div>
              <div className="incident-actions-compact">
                <button className="icon-btn" title="View Details">👁️</button>
                <button className="icon-btn" title="Edit">✏️</button>
                <button className="icon-btn" title="History">📋</button>
              </div>
            </div>

            <div className="incident-card-body">
              <div className="incident-location">
                <span className="location-icon">📍</span>
                <div>
                  <h4>{incident.location}</h4>
                  <span className="area-badge">{incident.area}</span>
                </div>
              </div>

              <p className="incident-description">{incident.description}</p>

              <div className="incident-meta">
                <div className="meta-item">
                  <span className="meta-label">Reported</span>
                  <span className="meta-value">{incident.reported}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Severity</span>
                  <span className={`meta-value severity-${incident.severity.toLowerCase()}`}>
                    {incident.severity}
                  </span>
                </div>
              </div>
            </div>

            <div className="incident-card-footer">
              <div className="status-section">
                <select
                  value={incident.status}
                  onChange={(e) => handleUpdateIncidentStatus(incident.id, e.target.value)}
                  className={`status-select-enhanced status-${incident.status.toLowerCase().replace(' ', '-')}`}
                >
                  <option value="Active">🟡 Active</option>
                  <option value="Assigned">🔵 Assigned</option>
                  <option value="Investigating">🟠 Investigating</option>
                  <option value="In Progress">🟣 In Progress</option>
                  <option value="Resolved">🟢 Resolved</option>
                </select>
              </div>

              <div className="assignment-section">
                {incident.assignedTo ? (
                  <div className="assigned-info">
                    <div className="assigned-avatar">
                      {incident.assignedTo.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="assigned-details">
                      <span className="assigned-to">{incident.assignedTo}</span>
                      <span className="assigned-time">{incident.assignedTime}</span>
                    </div>
                    <button
                      className="unassign-btn-circle"
                      onClick={() => handleUpdateIncidentStatus(incident.id, 'Active')}
                      title="Unassign"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    className="assign-btn-enhanced"
                    onClick={() => handleAssignIncident(incident)}
                  >
                    <span className="assign-icon">👨‍💼</span>
                    Assign Technician
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Incident Map */}
      <div className="incidents-map-section">
        <h3>Incident Locations Map</h3>
        <div className="map-container" style={{ marginTop: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <IncidentMap heatmapData={heatmapData} />
        </div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
          Click on markers to view incident details. Map shows real-time incident locations.
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay-enhanced">
          <div className="assignment-modal-enhanced">
            <div className="modal-header-enhanced">
              <h2>Assign Technician</h2>
              <p>Select a team member to handle this incident</p>
              <button 
                className="close-btn-enhanced"
                onClick={() => setShowAssignmentModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content-enhanced">
              <div className="incident-preview-modal">
                <div className="incident-preview-header">
                  <h3>{selectedIncident?.incidentId}</h3>
                  <div className={`priority-badge-modal priority-${selectedIncident?.priority.toLowerCase()}`}>
                    {selectedIncident?.priority} Priority
                  </div>
                </div>
                <div className="incident-preview-details">
                  <p><strong>Location:</strong> {selectedIncident?.location}</p>
                  <p><strong>Description:</strong> {selectedIncident?.description}</p>
                  <p><strong>Severity:</strong> <span className={`severity-badge severity-${selectedIncident?.severity.toLowerCase()}`}>{selectedIncident?.severity}</span></p>
                </div>
              </div>

              <div className="technicians-grid-modal">
                <h4>Available Team Members</h4>
                <div className="technicians-list-modal">
                  {teamMembers.map(technician => (
                    <div 
                      key={technician.id}
                      className="technician-card-modal"
                      onClick={() => handleAssignToTechnician(technician)}
                    >
                      <div className="technician-header-modal">
                        <div className="technician-avatar-modal">
                          {technician.avatar}
                          <div className={`availability-dot ${technician.status === 'Available' ? 'available' : 'busy'}`}></div>
                        </div>
                        <div className="technician-info-modal">
                          <h4>{technician.name}</h4>
                          <p>{technician.role}</p>
                        </div>
                        <div className="workload-indicator">
                          <div className={`workload-bar ${technician.tasks < 2 ? 'low' : technician.tasks < 4 ? 'medium' : 'high'}`}>
                            <div className="workload-fill"></div>
                          </div>
                          <span className="workload-text">{technician.tasks} tasks</span>
                        </div>
                      </div>
                      <div className="technician-status-modal">
                        <span className={`status-tag-modal ${technician.status.toLowerCase().replace(' ', '-')}`}>
                          {technician.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

// Google Maps component for incident visualization
const IncidentMap = ({ heatmapData }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: "AIzaSyDUMMY_API_KEY", // Replace with actual Google Maps API key
          version: "weekly",
        });

        const { Map } = await loader.importLibrary("maps");

        // Default center coordinates (Johannesburg area)
        const center = { lat: -26.2041, lng: 28.0473 };

        const mapInstance = new Map(mapRef.current, {
          center: center,
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        setMap(mapInstance);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!map || !heatmapData) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const newMarkers = heatmapData.map((incident) => {
      const position = { lat: incident.lat, lng: incident.lng };

      // Determine marker color based on status
      let markerColor = '#FF0000'; // Default red for open
      if (incident.status === 'verified') markerColor = '#FFA500'; // Orange
      else if (incident.status === 'resolved') markerColor = '#00FF00'; // Green

      // Priority indicator
      let priorityColor = '#FFFF00'; // Default yellow
      if (incident.priority === 'P0') priorityColor = '#FF0000'; // Red
      else if (incident.priority === 'P1') priorityColor = '#FFA500'; // Orange

      const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: `Incident ${incident.incidentNumber}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 10,
        },
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #1f2937;">${incident.incidentNumber}</h4>
            <p style="margin: 4px 0;"><strong>Status:</strong> ${incident.status}</p>
            <p style="margin: 4px 0;"><strong>Priority:</strong> ${incident.priority}</p>
            <p style="margin: 4px 0;"><strong>Category:</strong> ${incident.category || 'Unknown'}</p>
            <p style="margin: 4px 0;"><strong>Description:</strong> ${incident.description || 'No description'}</p>
            <p style="margin: 4px 0;"><strong>Reported:</strong> ${new Date(incident.createdAt).toLocaleString()}</p>
            ${incident.reporterPhone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${incident.reporterPhone}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      map.fitBounds(bounds);

      // Don't zoom in too much for single points
      const listener = google.maps.event.addListener(map, "idle", () => {
        if (map.getZoom() > 15) map.setZoom(15);
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, heatmapData, markers]);

  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {!map && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          backgroundColor: '#f3f4f6',
          color: '#6b7280'
        }}>
          Loading Google Maps...
        </div>
      )}
    </div>
  );
};

// ======== USER MANAGEMENT SECTION ========
const renderUserManagementSection = () => (
  <div className="user-management-section">
    <div className="incidents-header">
      <div className="header-content">
        <h1>User Management</h1>
        <p>Manage user accounts, roles, and permissions</p>
      </div>
      <div className="header-stats">
        <div className="header-stat">
          <span className="stat-number">{allUsers.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="header-stat">
          <span className="stat-number">{allUsers.filter(u => u.status === 'active').length}</span>
          <span className="stat-label">Active Users</span>
        </div>
        <div className="header-stat">
          <span className="stat-number">{allUsers.filter(u => u.status === 'blocked').length}</span>
          <span className="stat-label">Blocked Users</span>
        </div>
      </div>
    </div>

    <div className="action-bar">
      <div className="action-group">
        <button className="btn-primary" onClick={handleCreateUser}>
          <span className="btn-icon">➕</span>
          Create New User
        </button>
      </div>
      <div className="filter-group">
        <select className="filter-select">
          <option>All Roles</option>
          <option>User</option>
          <option>Guardian</option>
          <option>Manager</option>
          <option>Admin</option>
        </select>
        <select className="filter-select">
          <option>All Status</option>
          <option>Active</option>
          <option>Blocked</option>
        </select>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search users..." className="search-input" />
        </div>
      </div>
    </div>

    <div className="users-grid">
      {allUsers.map(user => (
        <div key={user._id} className="user-card">
          <div className="user-header">
            <div className="user-avatar">
              {user.first_name[0]}{user.last_name[0]}
            </div>
            <div className="user-info">
              <h3>{user.first_name} {user.last_name}</h3>
              <p>{user.email}</p>
              <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                {user.role}
              </span>
            </div>
            <div className="user-actions">
              <select
                value={user.role}
                onChange={(e) => handleUserRoleChange(user._id, e.target.value)}
                className="role-select"
              >
                <option value="User">User</option>
                <option value="Guardian">Guardian</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="user-details">
            <div className="detail-row">
              <span className="label">Status:</span>
              <span className={`value status-${user.status}`}>
                {user.status || 'Active'}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Created:</span>
              <span className="value">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Last Login:</span>
              <span className="value">{user.lastLogin || 'Never'}</span>
            </div>
          </div>

          <div className="user-footer">
            <button
              className={`btn-secondary small ${user.status === 'blocked' ? 'success' : 'warning'}`}
              onClick={() => handleBlockUser(user._id)}
            >
              {user.status === 'blocked' ? 'Unblock' : 'Block'}
            </button>
            <button
              className="btn-danger small"
              onClick={() => handleDeleteUser(user._id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ======== ANALYTICS SECTION ========
const renderAnalyticsSection = () => (
  <div className="analytics-section">
    <div className="incidents-header">
      <div className="header-content">
        <h1>System Analytics</h1>
        <p>Comprehensive analytics and system performance metrics</p>
      </div>
    </div>

    <div className="analytics-grid">
      <div className="analytics-card">
        <h3>User Analytics</h3>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-value">{analyticsData.totalUsers}</span>
            <span className="metric-label">Total Users</span>
          </div>
          <div className="metric">
            <span className="metric-value">{analyticsData.activeUsers}</span>
            <span className="metric-label">Active Users</span>
          </div>
          <div className="metric">
            <span className="metric-value">{Math.round((analyticsData.activeUsers / analyticsData.totalUsers) * 100)}%</span>
            <span className="metric-label">User Engagement</span>
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <h3>Incident Analytics</h3>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-value">{analyticsData.totalIncidents}</span>
            <span className="metric-label">Total Incidents</span>
          </div>
          <div className="metric">
            <span className="metric-value">{analyticsData.resolvedIncidents}</span>
            <span className="metric-label">Resolved</span>
          </div>
          <div className="metric">
            <span className="metric-value">{analyticsData.averageResponseTime}</span>
            <span className="metric-label">Avg Response Time</span>
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <h3>System Performance</h3>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-value">{analyticsData.systemUptime}</span>
            <span className="metric-label">System Uptime</span>
          </div>
          <div className="metric">
            <span className="metric-value">2.3s</span>
            <span className="metric-label">Avg Load Time</span>
          </div>
          <div className="metric">
            <span className="metric-value">98.5%</span>
            <span className="metric-label">Success Rate</span>
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <h3>Activity Trends</h3>
        <div className="chart-placeholder">
          <p>📊 Activity Chart Would Go Here</p>
          <p>Daily incident reports, user logins, and system usage over time</p>
        </div>
      </div>
    </div>
  </div>
);

// ======== SETTINGS SECTION ========
const renderSettingsSection = () => (
  <div className="settings-section">
    <div className="incidents-header">
      <div className="header-content">
        <h1>System Settings</h1>
        <p>Configure system-wide settings and preferences</p>
      </div>
    </div>

    <div className="settings-grid">
      <div className="settings-card">
        <h3>Notifications</h3>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={systemSettings.notifications}
              onChange={(e) => handleUpdateSettings('notifications', e.target.checked)}
            />
            Enable system notifications
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={systemSettings.maintenanceMode}
              onChange={(e) => handleUpdateSettings('maintenanceMode', e.target.checked)}
            />
            Maintenance mode
          </label>
        </div>
      </div>

      <div className="settings-card">
        <h3>Data Management</h3>
        <div className="setting-item">
          <label>Data retention period (days)</label>
          <input
            type="number"
            value={systemSettings.dataRetention}
            onChange={(e) => handleUpdateSettings('dataRetention', parseInt(e.target.value))}
            min="30"
            max="3650"
          />
        </div>
        <div className="setting-item">
          <label>Maximum file size (MB)</label>
          <input
            type="number"
            value={systemSettings.maxFileSize}
            onChange={(e) => handleUpdateSettings('maxFileSize', parseInt(e.target.value))}
            min="1"
            max="100"
          />
        </div>
      </div>

      <div className="settings-card">
        <h3>Security Settings</h3>
        <div className="setting-item">
          <label>Password requirements</label>
          <select>
            <option>Basic (8+ characters)</option>
            <option>Strong (12+ chars, mixed case, numbers)</option>
            <option>Very Strong (16+ chars, special chars)</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Session timeout (minutes)</label>
          <input type="number" defaultValue="60" min="15" max="480" />
        </div>
      </div>

      <div className="settings-card">
        <h3>System Actions</h3>
        <button className="btn-warning">Clear System Cache</button>
        <button className="btn-danger">Reset to Defaults</button>
        <button className="btn-primary">Export Settings</button>
      </div>
    </div>
  </div>
);

// ======== INSERT THIS TEAM SECTION FUNCTION ========
const renderTeamSection = () => (
  <div className="team-section-enhanced">
    {/* Header with Stats */}
    <div className="incidents-header">
      <div className="header-content">
        <h1>Team Management</h1>
        <p>Manage your field technicians and team members</p>
      </div>
      <div className="header-stats">
        <div className="header-stat">
          <span className="stat-number">{teamMembers.length}</span>
          <span className="stat-label">Total Members</span>
        </div>
        <div className="header-stat">
          <span className="stat-number">{teamMembers.filter(m => m.status === 'Available').length}</span>
          <span className="stat-label">Available Now</span>
        </div>
        <div className="header-stat">
          <span className="stat-number">{teamMembers.filter(m => m.tasks > 0).length}</span>
          <span className="stat-label">Active Tasks</span>
        </div>
      </div>
    </div>

    {/* Action Bar */}
    <div className="action-bar">
      <div className="action-group">
        <button className="btn-primary">
          <span className="btn-icon">➕</span>
          Add Team Member
        </button>
        <button className="btn-secondary">
          <span className="btn-icon">📧</span>
          Send Broadcast
        </button>
      </div>
      <div className="filter-group">
        <select className="filter-select">
          <option>All Roles</option>
          <option>Field Technician</option>
          <option>Senior Technician</option>
          <option>Maintenance Engineer</option>
          <option>Emergency Response</option>
        </select>
        <select className="filter-select">
          <option>All Status</option>
          <option>Available</option>
          <option>On Site</option>
          <option>On Break</option>
        </select>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search team members..." className="search-input" />
        </div>
      </div>
    </div>

    {/* Team Grid */}
    <div className="team-grid-enhanced">
      {teamMembers.map(member => (
        <div key={member.id} className="team-member-card">
          <div className="team-member-header">
            <div className="member-identity">
              <div className="member-avatar-large">
                {member.avatar}
                <div className={`availability-dot-large ${member.status === 'Available' ? 'online' : member.status === 'On Site' ? 'busy' : 'away'}`}></div>
              </div>
              <div className="member-basic-info">
                <h3>{member.name}</h3>
                <p>{member.role}</p>
                <span className="specialization-badge">Field Operations</span>
              </div>
            </div>
            <div className="member-actions">
              <button className="icon-btn" title="Edit">✏️</button>
              <button className="icon-btn" title="Message">💬</button>
              <button className="icon-btn danger" title="Remove">🗑️</button>
            </div>
          </div>

          <div className="team-member-details">
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className={`status-tag status-${member.status.toLowerCase().replace(' ', '-')}`}>
                {member.status}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Current Tasks</span>
              <span className="task-count-badge">{member.tasks} active tasks</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Performance</span>
              <div className="performance-indicator">
                <div className="performance-bar">
                  <div 
                    className="performance-fill" 
                    style={{ width: `${member.tasks > 0 ? '85%' : '95%'}` }}
                  ></div>
                </div>
                <span className="performance-text">{member.tasks > 0 ? '85%' : '95%'}</span>
              </div>
            </div>
          </div>

          <div className="team-member-footer">
            <button className="btn-secondary small">
              View Schedule
            </button>
            <button className="btn-secondary small">
              Task History
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
// ======== END OF TEAM SECTION FUNCTION ========



  const renderSection = () => {
    switch(activeSection) {
      case "dashboard":
        return renderDashboard();
      case "incidents":
        return renderIncidentsSection();
      case "users":
        return renderUserManagementSection();
      case "analytics":
        return renderAnalyticsSection();
      case "settings":
        return renderSettingsSection();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-container-enhanced">
      <header className="admin-header-enhanced">
        <div className="admin-brand">
          <h1>🚰 SewerWatch Admin</h1>
        </div>
        
        <div className="admin-profile-enhanced">
          <div className="admin-info-enhanced">
            <div className="admin-avatar">
              {adminDetails.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="admin-details-enhanced">
              <div className="admin-name">{adminDetails.name}</div>
              <div className="admin-meta">
                <span className="staff-id">{adminDetails.staffNumber}</span>
                <span className="admin-role">{adminDetails.role}</span>
              </div>
            </div>
          </div>
          <div className="admin-actions-enhanced">
            <Link to="/" className="nav-link-home">
              🏠 Back to Home
            </Link>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="admin-content-enhanced">
        {/* Navigation Sidebar */}
        <aside className="admin-sidebar-enhanced">
          <nav className="admin-nav-enhanced">
            <button 
              className={`nav-item ${activeSection === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveSection("dashboard")}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Dashboard</span>
            </button>
            <button 
              className={`nav-item ${activeSection === "incidents" ? "active" : ""}`}
              onClick={() => setActiveSection("incidents")}
            >
              <span className="nav-icon">🚨</span>
              <span className="nav-label">Incidents</span>
              <span className="nav-badge">{dashboardData.incidents.filter(i => i.status === 'Active').length}</span>
            </button>
            <button
              className={`nav-item ${activeSection === "users" ? "active" : ""}`}
              onClick={() => setActiveSection("users")}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">Users</span>
            </button>
            <button
              className={`nav-item ${activeSection === "analytics" ? "active" : ""}`}
              onClick={() => setActiveSection("analytics")}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Analytics</span>
            </button>
            <button
              className={`nav-item ${activeSection === "settings" ? "active" : ""}`}
              onClick={() => setActiveSection("settings")}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Settings</span>
            </button>
          </nav>
          
          <div className="sidebar-footer">
            <div className="system-status">
              <div className="status-indicator online"></div>
              <span>All Systems Operational</span>
            </div>
          </div>
        </aside>

        <main className="admin-main-enhanced">
          <div className="admin-content-area-enhanced">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;