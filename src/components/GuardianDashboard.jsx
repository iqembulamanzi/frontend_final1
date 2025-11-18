import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getJobCards, getIncidents, updateJobCardStatus, getIncidentsForMap } from '../api';
import { Loader } from "@googlemaps/js-api-loader";
import './GuardianDashboard.css';

const GuardianDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('jobs');
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [teamMessages, setTeamMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [heatmapData, setHeatmapData] = useState([]);

  // Guardian details
  const guardianDetails = {
    name: "Field Technician",
    staffNumber: "FT-2024-001",
    role: "Field Technician (Guardian)",
    department: "Field Operations",
    lastLogin: new Date().toLocaleDateString()
  };

  // Check if user is guardian, redirect if not
  useEffect(() => {
    if (user !== "guardian") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch assigned jobs and other data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // For now, show mock data since backend has auth issues
        // In production, this would fetch real job cards
        const mockJobs = [
          {
            _id: '1',
            title: 'Sewer Line Inspection - Zone A',
            description: 'Inspect and maintain sewer lines in Zone A. Check for blockages and perform routine maintenance.',
            status: 'in_progress',
            priority: 'P2',
            estimatedDuration: 120,
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            title: 'Pump Station Maintenance - Station 3',
            description: 'Perform maintenance on pump station 3. Check pump functionality and clean filters.',
            status: 'pending',
            priority: 'P1',
            estimatedDuration: 180,
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          }
        ];

        setMyJobs(mockJobs);

        // Mock team messages
        const mockMessages = [
          {
            id: '1',
            sender: 'Manager',
            message: 'Please check the pump station maintenance task',
            time: new Date(Date.now() - 3600000).toISOString(),
            type: 'team'
          },
          {
            id: '2',
            sender: 'System',
            message: 'New incident reported in your area',
            time: new Date(Date.now() - 7200000).toISOString(),
            type: 'system'
          }
        ];
        setTeamMessages(mockMessages);

        // Fetch heatmap data for maps
        try {
          const mapData = await getIncidentsForMap();
          setHeatmapData(mapData.incidents || []);
        } catch (mapErr) {
          console.error('Error fetching map data:', mapErr);
        }

      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load assigned jobs');
      } finally {
        setLoading(false);
      }
    };

    if (user === "guardian") {
      fetchData();
    }
  }, [user]);

  const handleJobStatusUpdate = async (jobId, newStatus) => {
    try {
      await updateJobCardStatus(jobId, { status: newStatus });

      // Update local state
      setMyJobs(prevJobs =>
        prevJobs.map(job =>
          job._id === jobId
            ? { ...job, status: newStatus }
            : job
        )
      );
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status. Please try again.');
    }
  };

  const handleAvailabilityChange = (newStatus) => {
    setAvailabilityStatus(newStatus);
    // In a real app, this would update the backend
    alert(`Availability status updated to: ${newStatus}`);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      sender: 'You',
      message: newMessage,
      time: new Date().toISOString(),
      type: 'team'
    };

    setTeamMessages(prev => [message, ...prev]);
    setNewMessage('');
  };

  const renderJobsSection = () => (
    <div className="jobs-section">
      <div className="section-header">
        <h2>My Assigned Jobs</h2>
        <p>Manage your field maintenance tasks</p>
      </div>

      {/* Availability Status */}
      <div className="availability-section">
        <h3>Current Availability</h3>
        <div className="availability-controls">
          <button
            className={`availability-btn ${availabilityStatus === 'available' ? 'active' : ''}`}
            onClick={() => handleAvailabilityChange('available')}
          >
            🟢 Available
          </button>
          <button
            className={`availability-btn ${availabilityStatus === 'busy' ? 'active' : ''}`}
            onClick={() => handleAvailabilityChange('busy')}
          >
            🟡 Busy
          </button>
          <button
            className={`availability-btn ${availabilityStatus === 'offline' ? 'active' : ''}`}
            onClick={() => handleAvailabilityChange('offline')}
          >
            🔴 Offline
          </button>
        </div>
      </div>

      {loading && <div className="loading">Loading jobs...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="jobs-grid">
        {myJobs.length === 0 ? (
          <div className="no-jobs">
            <h3>No jobs assigned</h3>
            <p>You currently have no assigned maintenance tasks.</p>
          </div>
        ) : (
          myJobs.map(job => (
            <div key={job._id} className="job-card">
              <div className="job-header">
                <h3>Job #{job._id.slice(-6)}</h3>
                <div className={`status-badge status-${job.status?.toLowerCase() || 'pending'}`}>
                  {job.status || 'Pending'}
                </div>
              </div>

              <div className="job-details">
                <p><strong>Description:</strong> {job.description || 'No description'}</p>
                <p><strong>Priority:</strong> {job.priority || 'Not set'}</p>
                <p><strong>Created:</strong> {new Date(job.createdAt).toLocaleDateString()}</p>
                {job.estimatedDuration && (
                  <p><strong>Estimated Duration:</strong> {job.estimatedDuration} minutes</p>
                )}
              </div>

              <div className="job-actions">
                {job.status !== 'completed' && job.status !== 'resolved' && (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={() => handleJobStatusUpdate(job._id, 'in_progress')}
                      disabled={job.status === 'in_progress'}
                    >
                      Start Work
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => handleJobStatusUpdate(job._id, 'completed')}
                    >
                      Mark Complete
                    </button>
                  </>
                )}
                {job.status === 'completed' && (
                  <span className="completed-text">✓ Completed</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderProfileSection = () => (
    <div className="profile-section">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {guardianDetails.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="profile-info">
            <h2>{guardianDetails.name}</h2>
            <p>{guardianDetails.role}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-row">
            <span className="label">Staff Number:</span>
            <span className="value">{guardianDetails.staffNumber}</span>
          </div>
          <div className="detail-row">
            <span className="label">Department:</span>
            <span className="value">{guardianDetails.department}</span>
          </div>
          <div className="detail-row">
            <span className="label">Last Login:</span>
            <span className="value">{guardianDetails.lastLogin}</span>
          </div>
          <div className="detail-row">
            <span className="label">Current Status:</span>
            <span className={`value status-${availabilityStatus}`}>
              {availabilityStatus.charAt(0).toUpperCase() + availabilityStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Team Communication */}
      <div className="communication-section">
        <h3>Team Communication</h3>
        <div className="messages-container">
          <div className="messages-list">
            {teamMessages.map(message => (
              <div key={message.id} className={`message-item ${message.type}`}>
                <div className="message-header">
                  <span className="message-sender">{message.sender}</span>
                  <span className="message-time">{new Date(message.time).toLocaleString()}</span>
                </div>
                <p className="message-content">{message.message}</p>
              </div>
            ))}
          </div>
          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage} className="send-btn">Send</button>
          </div>
        </div>
      </div>

      {/* Incident Map */}
      <div className="map-section">
        <h3>Incident Locations Map</h3>
        <div className="map-container" style={{ marginTop: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <IncidentMap heatmapData={heatmapData} />
        </div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
          View incident locations and navigate to job sites
        </div>
      </div>
    </div>
  );

  // Google Maps component for incident visualization
  const IncidentMap = ({ heatmapData }) => {
    const mapRef = React.useRef(null);
    const [map, setMap] = React.useState(null);
    const [markers, setMarkers] = React.useState([]);
    const [googleMaps, setGoogleMaps] = React.useState(null);

    React.useEffect(() => {
      const initMap = async () => {
        try {
          const loader = new Loader({
            apiKey: "AIzaSyDUMMY_API_KEY", // Replace with actual Google Maps API key
            version: "weekly",
          });

          const [mapsLibrary] = await Promise.all([
            loader.importLibrary("maps"),
          ]);

          setGoogleMaps(mapsLibrary);

          // Default center coordinates (Johannesburg area)
          const center = { lat: -26.2041, lng: 28.0473 };

          const mapInstance = new mapsLibrary.Map(mapRef.current, {
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

    React.useEffect(() => {
      if (!map || !heatmapData || !googleMaps) return;

      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));

      const newMarkers = heatmapData.map((incident) => {
        const position = { lat: incident.lat, lng: incident.lng };

        // Determine marker color based on status
        let markerColor = '#FF0000'; // Default red for open
        if (incident.status === 'verified') markerColor = '#FFA500'; // Orange
        else if (incident.status === 'resolved') markerColor = '#00FF00'; // Green

        const marker = new googleMaps.Marker({
          position: position,
          map: map,
          title: `Incident ${incident.incidentNumber}`,
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            fillColor: markerColor,
            fillOpacity: 0.8,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 10,
          },
        });

        // Create info window
        const infoWindow = new googleMaps.InfoWindow({
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 250px;">
              <h4 style="margin: 0 0 8px 0; color: #1f2937;">${incident.incidentNumber}</h4>
              <p style="margin: 4px 0;"><strong>Status:</strong> ${incident.status}</p>
              <p style="margin: 4px 0;"><strong>Priority:</strong> ${incident.priority}</p>
              <p style="margin: 4px 0;"><strong>Description:</strong> ${incident.description || 'No description'}</p>
              <p style="margin: 4px 0;"><strong>Reported:</strong> ${new Date(incident.createdAt).toLocaleString()}</p>
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
        const bounds = new googleMaps.LatLngBounds();
        newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds);

        // Don't zoom in too much for single points
        const listener = googleMaps.event.addListener(map, "idle", () => {
          if (map.getZoom() > 15) map.setZoom(15);
          googleMaps.event.removeListener(listener);
        });
      }
    }, [map, heatmapData, markers, googleMaps]);

    return (
      <div style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
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

  return (
    <div className="guardian-dashboard">
      <header className="guardian-header">
        <div className="guardian-brand">
          <h1>🚰 SewerWatch Guardian</h1>
        </div>

        <div className="guardian-profile">
          <div className="guardian-info">
            <div className="guardian-avatar">
              {guardianDetails.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="guardian-details">
              <div className="guardian-name">{guardianDetails.name}</div>
              <div className="guardian-meta">
                <span className="staff-id">{guardianDetails.staffNumber}</span>
                <span className="guardian-role">{guardianDetails.role}</span>
              </div>
            </div>
          </div>
          <div className="guardian-actions">
            <Link to="/" className="nav-link-home">
              🏠 Back to Home
            </Link>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="guardian-content">
        <aside className="guardian-sidebar">
          <nav className="guardian-nav">
            <button
              className={`nav-item ${activeSection === "jobs" ? "active" : ""}`}
              onClick={() => setActiveSection("jobs")}
            >
              <span className="nav-icon">📋</span>
              <span className="nav-label">My Jobs</span>
              <span className="nav-badge">{myJobs.length}</span>
            </button>
            <button
              className={`nav-item ${activeSection === "profile" ? "active" : ""}`}
              onClick={() => setActiveSection("profile")}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-label">Profile</span>
            </button>
          </nav>
        </aside>

        <main className="guardian-main">
          <div className="guardian-content-area">
            {activeSection === "jobs" && renderJobsSection()}
            {activeSection === "profile" && renderProfileSection()}
          </div>
        </main>

      </div>
    </div>
  );
};

export default GuardianDashboard;