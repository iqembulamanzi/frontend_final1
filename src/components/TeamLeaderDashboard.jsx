import React, { useState, useEffect } from 'react';
import './TeamLeaderDashboard.css';

const TeamLeaderDashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [assistanceRequest, setAssistanceRequest] = useState('');

  useEffect(() => {
    fetchNotifications();
    fetchJobCards();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/team-leader', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchJobCards = async () => {
    try {
      const response = await fetch('/api/jobcards/team', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setJobCards(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching job cards:', error);
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobCardId, status, progress = '') => {
    try {
      const response = await fetch(`/api/jobcards/${jobCardId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, progress })
      });

      if (response.ok) {
        fetchJobCards(); // Refresh job cards
        setSelectedJobCard(null);
        setProgressUpdate('');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const requestAssistance = async (jobCardId, reason) => {
    try {
      const response = await fetch(`/api/jobcards/${jobCardId}/assistance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Assistance request sent to manager');
        setAssistanceRequest('');
      }
    } catch (error) {
      console.error('Error requesting assistance:', error);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="team-leader-dashboard">
      <h1>Team Leader Dashboard</h1>

      <div className="dashboard-grid">
        {/* Notifications Section */}
        <div className="notifications-section">
          <h2>Notifications</h2>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p>No new notifications</p>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className={`notification ${notification.read ? 'read' : 'unread'}`}>
                  <div className="notification-header">
                    <span className="notification-type">{notification.type}</span>
                    <span className="notification-time">{new Date(notification.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  {!notification.read && (
                    <button
                      onClick={() => markNotificationRead(notification.id)}
                      className="mark-read-btn"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Job Cards Section */}
        <div className="job-cards-section">
          <h2>Team Job Cards</h2>
          <div className="job-cards-list">
            {jobCards.length === 0 ? (
              <p>No job cards assigned to your team</p>
            ) : (
              jobCards.map(jobCard => (
                <div key={jobCard.id} className="job-card">
                  <div className="job-card-header">
                    <h3>{jobCard.title}</h3>
                    <span className={`status ${jobCard.status.toLowerCase()}`}>{jobCard.status}</span>
                  </div>
                  <p className="job-description">{jobCard.description}</p>
                  <div className="job-details">
                    <span>Priority: {jobCard.priority}</span>
                    <span>Due: {new Date(jobCard.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="job-actions">
                    <button
                      onClick={() => setSelectedJobCard(jobCard)}
                      className="update-btn"
                    >
                      Update Progress
                    </button>
                    <button
                      onClick={() => updateJobStatus(jobCard.id, 'In Progress')}
                      className="start-btn"
                      disabled={jobCard.status === 'In Progress'}
                    >
                      Start Work
                    </button>
                    <button
                      onClick={() => updateJobStatus(jobCard.id, 'Completed')}
                      className="complete-btn"
                      disabled={jobCard.status === 'Completed'}
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Progress Update Modal */}
      {selectedJobCard && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Update Progress for: {selectedJobCard.title}</h3>
            <textarea
              value={progressUpdate}
              onChange={(e) => setProgressUpdate(e.target.value)}
              placeholder="Describe the progress made..."
              rows="4"
            />
            <div className="modal-actions">
              <button
                onClick={() => updateJobStatus(selectedJobCard.id, 'In Progress', progressUpdate)}
                className="save-btn"
              >
                Save Progress
              </button>
              <button
                onClick={() => setSelectedJobCard(null)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assistance Request Section */}
      <div className="assistance-section">
        <h2>Request Manager Assistance</h2>
        <div className="assistance-form">
          <select onChange={(e) => setSelectedJobCard(jobCards.find(jc => jc.id === e.target.value))}>
            <option value="">Select Job Card</option>
            {jobCards.map(jobCard => (
              <option key={jobCard.id} value={jobCard.id}>{jobCard.title}</option>
            ))}
          </select>
          <textarea
            value={assistanceRequest}
            onChange={(e) => setAssistanceRequest(e.target.value)}
            placeholder="Describe why you need assistance..."
            rows="3"
          />
          <button
            onClick={() => selectedJobCard && requestAssistance(selectedJobCard.id, assistanceRequest)}
            className="request-btn"
            disabled={!selectedJobCard || !assistanceRequest.trim()}
          >
            Request Assistance
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamLeaderDashboard;