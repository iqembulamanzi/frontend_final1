import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { connectionHandler } from "../utils/connectionHandler";
import './AssignJob.css';

const AssignJob = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [jobData, setJobData] = useState({
    incidentId: "",
    teamId: "",
    priority: "P2",
    description: "",
    estimatedDuration: 120
  });
  const [jobs, setJobs] = useState([]);
  const [unallocatedIncidents, setUnallocatedIncidents] = useState([]);
  const [allocatedIncidents, setAllocatedIncidents] = useState([]);
  const [allIncidents, setAllIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [pendingCompletions, setPendingCompletions] = useState([]);
  const [teamReports, setTeamReports] = useState([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
    specialization: 'general',
    leader: ''
  });

  // TODO: Fetch manager details dynamically from API instead of hardcoded data
  const [managerDetails] = useState({
    name: "Team Manager",
    staffNumber: "TM-2024-001",
    role: "Team Manager",
    department: "Operations Management",
    lastLogin: new Date().toLocaleDateString()
  });

  // Check if user is manager, redirect if not
  useEffect(() => {
    if (user !== "manager") {
      navigate("/");
    }
  }, [user, navigate]);


  // Fetch data on component mount and when user changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we have a valid token first
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to access dashboard data');
          setLoading(false);
          return;
        }

        // Fetch all data using the new API client with built-in retry logic
        const [unallocated, allocated, allIncidentsData, users, jobCards, teamsData] = await Promise.all([
          apiClient.get('/incidents/unallocated').catch(() => {
            return { incidents: [] };
          }),
          apiClient.get('/incidents/allocated').catch(() => {
            return { incidents: [] };
          }),
          apiClient.get('/incidents').catch(() => {
            return [];
          }),
          apiClient.get('/teams/available-users').catch(() => {
            // Manager doesn't have access to users list, return empty array
            return [];
          }),
          apiClient.get('/job-cards').catch(() => {
            return [];
          }),
          apiClient.get('/teams').catch(() => {
            return { teams: [] };
          })
        ]);

        setAvailableUsers(Array.isArray(users) ? users : []);
        setUnallocatedIncidents(unallocated.incidents || []);
        setAllocatedIncidents(allocated.incidents || []);
        setAllIncidents(allIncidentsData || []);
        setTeams(teamsData.teams || teamsData.data || []);
        setJobs(jobCards || []);

        // TODO: Implement API calls for pending completions and team reports
        // For now, initialize as empty arrays until APIs are available
        setPendingCompletions([]);
        setTeamReports([]);
      } catch (error) {

        // Provide more specific error messages based on error type
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          setError('Authentication failed. Please log in again.');
        } else if (error.message.includes('500') || error.message.includes('buffering timed out')) {
          setError('Server is experiencing high load. Please try again in a few moments.');
        } else if (error.message.includes('Failed to fetch')) {
          setError('Network connection issue. Please check your internet connection.');
        } else {
          setError('Failed to load dashboard data. Please try refreshing the page.');
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if user is manager
    if (user === "manager") {
      fetchData();
    }
  }, [user]);

  const handleAssignJob = async (e) => {
      e.preventDefault();

      if (!jobData.incidentId || !jobData.teamId || !jobData.description) {
        setError('Please fill in all required fields');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await apiClient.post('/job-cards/allocate', {
          incidentId: jobData.incidentId,
          teamId: jobData.teamId,
          priority: jobData.priority,
          description: jobData.description,
          estimatedDuration: jobData.estimatedDuration,
          specialInstructions: jobData.description
        });

        // Refetch all data to ensure consistency
        const [updatedIncidents, updatedJobs] = await Promise.all([
          apiClient.get('/incidents/unallocated').catch(() => ({ incidents: [] })),
          apiClient.get('/job-cards').catch(() => [])
        ]);

        setUnallocatedIncidents(updatedIncidents.incidents || []);
        setJobs(updatedJobs || []);

        // Reset form
        setJobData({
          incidentId: "",
          teamId: "",
          priority: "P2",
          description: "",
          estimatedDuration: 120
        });

        alert('Job successfully assigned to team!');

      } catch (error) {

        // Provide more specific error messages
        if (error.message.includes('Authentication failed')) {
          setError('Authentication expired. Please log in again.');
        } else if (error.message.includes('buffering timed out')) {
          setError('Server is busy. Please try again in a few moments.');
        } else {
          setError('Failed to assign job. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

  const handleInputChange = (field, value) => {
    setJobData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAssignIncident = (incident) => {
    setSelectedIncident(incident);
    setShowAssignmentModal(true);
  };

  const handleAssignToTechnician = async (technician) => {
    if (selectedIncident) {
      try {
        await apiClient.post(`/incidents/${selectedIncident._id}/allocate`, { teamId: technician._id });

        // Update local state
        setUnallocatedIncidents(prev => prev.filter(inc => inc._id !== selectedIncident._id));
        setAllocatedIncidents(prev => [...prev, { ...selectedIncident, guardianAssigned: technician }]);

        setShowAssignmentModal(false);
        setSelectedIncident(null);
      } catch {
        alert('Failed to assign technician. Please try again.');
      }
    }
  };

  const handleUpdateIncidentStatus = async (incidentId, newStatus) => {
    try {
      const apiStatus = newStatus === "Resolved" ? "resolved" :
                        newStatus === "In Progress" ? "in_progress" :
                        newStatus === "Assigned" ? "verified" : "reported";

      await apiClient.put(`/incidents/${incidentId}`, { status: apiStatus });

      // Update local state
      setAllIncidents(prev => prev.map(inc =>
        inc._id === incidentId ? { ...inc, status: apiStatus } : inc
      ));
    } catch {
      alert('Failed to update incident status. Please try again.');
    }
  };

  const handleApproveCompletion = async (completionId) => {
      try {
        // TODO: Implement API call to approve completion
        // For now, just update local state until API is available
        setPendingCompletions(prev => prev.filter(comp => comp.id !== completionId));
        alert('Job completion approved successfully!');
      } catch {
        alert('Failed to approve completion. Please try again.');
      }
    };

   const handleRejectCompletion = async (completionId) => {
     try {
       // TODO: Implement API call to reject completion
       // For now, just update local state until API is available
       setPendingCompletions(prev => prev.filter(comp => comp.id !== completionId));
       alert('Job completion rejected.');
     } catch {
       alert('Failed to reject completion. Please try again.');
     }
   };

  // Removed unused function - handleReassignTask

  const handleCreateTeam = async (e) => {
    e.preventDefault();

    if (!teamFormData.name || !teamFormData.description || !teamFormData.leader) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure leader is a string and not empty
      const cleanData = {
        ...teamFormData,
        leader: teamFormData.leader?.toString().trim() || ''
      };

      // Use the correct API format from documentation
      const apiData = {
        name: cleanData.name,
        description: cleanData.description,
        leaderId: cleanData.leader,
        memberIds: []
      };

      await apiClient.post('/teams', apiData);

      // Reset form and close modal
      setTeamFormData({
        name: '',
        description: '',
        specialization: 'general',
        leader: ''
      });
      setShowCreateTeamModal(false);

      // Refresh teams list
      const updatedTeams = await getTeams();
      setTeams(updatedTeams.data || []);

      alert('Team created successfully!');
    } catch (error) {

      // Provide more specific error messages
      if (error.message.includes('duplicate key error')) {
        setError('A team with this name already exists. Please choose a different name.');
      } else if (error.message.includes('Authentication failed')) {
        setError('Authentication expired. Please log in again.');
      } else if (error.message.includes('buffering timed out')) {
        setError('Server is busy. Please try again in a few moments.');
      } else {
        setError('Failed to create team. Please try again.');
      }

      alert(error.message); // Show the error message to user
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setTeamFormData({
      name: team.name,
      description: team.description,
      specialization: team.specialization,
      leader: team.leader || ''
    });
    setShowEditTeamModal(true);
  };

  const handleAddMembers = (team) => {
    setSelectedTeam(team);
    setSelectedMembers([]);
    setShowAddMembersModal(true);
  };

  const handleMemberSelection = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleRandomSelection = () => {
    const availableUsersFiltered = availableUsers.filter(user =>
      !selectedTeam.members?.some(member => member._id === user._id)
    );

    if (availableUsersFiltered.length === 0) {
      alert('No available users to select from.');
      return;
    }

    // Select up to 5 random users
    const numToSelect = Math.min(5, availableUsersFiltered.length);
    const shuffled = [...availableUsersFiltered].sort(() => 0.5 - Math.random());
    const randomSelection = shuffled.slice(0, numToSelect).map(user => user._id);

    setSelectedMembers(randomSelection);
  };

  const handleAddSelectedMembers = async () => {
    if (!selectedTeam || selectedMembers.length === 0) {
      setError('Please select at least one member to add');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Add members one by one (API might support bulk, but this is safer)
      let successCount = 0;
      for (const memberId of selectedMembers) {
        try {
          await apiClient.post(`/teams/${selectedTeam._id}/members`, { memberId });
          successCount++;
        } catch {
          // Continue with other members even if one fails
        }
      }

      if (successCount > 0) {
        // Refresh teams list only if at least one member was added successfully
        const updatedTeams = await getTeams();
        setTeams(updatedTeams.data || []);

        setShowAddMembersModal(false);
        setSelectedMembers([]);
        alert(`Successfully added ${successCount} out of ${selectedMembers.length} member(s) to the team!`);
      } else {
        throw new Error('Failed to add any members to the team');
      }

    } catch (error) {
      if (error.message.includes('duplicate')) {
        setError('Some members are already part of this team');
      } else if (error.message.includes('Authentication failed')) {
        setError('Authentication expired. Please log in again.');
      } else if (error.message.includes('buffering timed out')) {
        setError('Server is busy. Please try again in a few moments.');
      } else {
        setError('Failed to add team members. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    if (!selectedTeam || !teamFormData.name || !teamFormData.description || !teamFormData.leader) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.put(`/teams/${selectedTeam._id}`, teamFormData);

      // Reset form and close modal
      setTeamFormData({
        name: '',
        description: '',
        specialization: 'general',
        leader: ''
      });
      setShowEditTeamModal(false);
      setSelectedTeam(null);

      // Refresh teams list
      const updatedTeams = await getTeams();
      setTeams(updatedTeams.data || []);

      alert('Team updated successfully!');
    } catch (error) {
      console.error('Error updating team:', error);
      setError('Failed to update team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/teams/${teamId}`);

      // Refresh teams list
      const updatedTeams = await apiClient.get('/teams');
      setTeams(updatedTeams.data || []);

      alert('Team deleted successfully!');
    } catch {
      alert('Failed to delete team. Please try again.');
    }
  };

  // Removed unused functions: handleAddTeamMember, handleRemoveTeamMember, handleSetTeamLeader, handleRemoveTeamMemberOld

  const renderDashboard = () => (
    <div className="manager-dashboard-content">
      <div className="welcome-header">
        <div className="welcome-text">
          <h1>Welcome back, {managerDetails.name} 👋</h1>
          <p>Manage your team and oversee incident assignments</p>
        </div>
        <div className="current-time">
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{teams.length}</h3>
            <p>Active Teams</p>
            <span className="trend up">All systems operational</span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{allIncidents.length}</h3>
            <p>Total Incidents</p>
            <span className="trend up">This month</span>
          </div>
        </div>
      </div>

      <div className="main-grid">
        <div className="grid-card incidents-preview">
          <div className="card-header">
            <h3>Unassigned Incidents</h3>
            <button className="view-all-btn">View All →</button>
          </div>
          <div className="incidents-list">
            {unallocatedIncidents.slice(0, 4).map((incident, index) => (
              <div key={incident._id || `incident-${index}`} className="incident-preview-card">
                <div className="incident-priority">
                  <div className={`priority-dot priority-${incident.priority?.toLowerCase() || 'medium'}`}></div>
                </div>
                <div className="incident-details">
                  <h4>{incident.incidentNumber}</h4>
                  <p>{incident.description}</p>
                  <span className="incident-area">Priority: {incident.priority || 'Medium'}</span>
                </div>
                <div className="incident-status">
                  <span className={`status-tag status-${incident.status?.toLowerCase() || 'active'}`}>
                    {incident.status || 'Active'}
                  </span>
                  <span className="incident-time">{new Date(incident.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-card team-overview">
          <div className="card-header">
            <h3>Team Overview</h3>
            <span className="online-count">{teams.filter(team => team.members?.length > 0).length} teams with members</span>
          </div>
          <div className="team-grid-compact">
            {teams.slice(0, 4).map((team, index) => (
              <div key={team._id || `team-overview-${index}`} className="team-member-compact">
                <div className="member-avatar-status">
                  <div className="member-avatar">
                    {team.name ? team.name[0].toUpperCase() : 'T'}
                  </div>
                  <div className={`online-status online`}></div>
                </div>
                <div className="member-details-compact">
                  <h4>{team.name || 'Unnamed Team'}</h4>
                  <p>{team.members?.length || 0} team members</p>
                </div>
                <div className="member-tasks">
                  <span className="task-count">{team.members?.length || 0}</span>
                  <span className="task-label">members</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-card quick-actions-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="action-grid">
            <button className="action-card primary" onClick={() => setActiveSection("assign")}>
              <span className="action-icon">➕</span>
              <span className="action-text">Assign Job</span>
            </button>
            <button className="action-card secondary" onClick={() => setActiveSection("incidents")}>
              <span className="action-icon">📋</span>
              <span className="action-text">Manage Incidents</span>
            </button>
            <button className="action-card warning" onClick={() => setActiveSection("team")}>
              <span className="action-icon">👥</span>
              <span className="action-text">Team Management</span>
            </button>
            <button className="action-card danger" onClick={() => setActiveSection("approvals")}>
              <span className="action-icon">✅</span>
              <span className="action-text">Approve Completions</span>
              {pendingCompletions.length > 0 && <span className="notification-badge">{pendingCompletions.length}</span>}
            </button>
          </div>
        </div>

        <div className="grid-card activity-feed">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-timeline">
            <div className="activity-item-enhanced">
              <div className="activity-icon-enhanced assignment">
                ✅
              </div>
              <div className="activity-content">
                <p className="activity-message">System initialized</p>
                <div className="activity-meta">
                  <span className="activity-time">Just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssignJobSection = () => (
    <div className="assign-job-section">
      <h2>Assign Job to Team</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAssignJob} className="assign-job-form">
        <div className="form-group">
          <label htmlFor="incidentId">Select Incident</label>
          <select
            id="incidentId"
            value={jobData.incidentId}
            onChange={(e) => handleInputChange('incidentId', e.target.value)}
            required
          >
            <option value="">Select an incident</option>
            {unallocatedIncidents.map((incident, index) => (
              <option key={incident._id || `incident-option-${index}`} value={incident._id}>
                {incident.incidentNumber} - {incident.description}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="teamId">Assign to Team</label>
          <select
            id="teamId"
            value={jobData.teamId}
            onChange={(e) => handleInputChange('teamId', e.target.value)}
            required
          >
            <option value="">Select a team</option>
            {teams.map((team, index) => (
              <option key={team._id || `team-option-${index}`} value={team._id}>
                {team.name} - {team.description} ({team.members?.length || 0} members)
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={jobData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
          >
            <option value="P0">P0 - Critical</option>
            <option value="P1">P1 - High</option>
            <option value="P2">P2 - Medium</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Job Description</label>
          <textarea
            id="description"
            value={jobData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Provide detailed instructions for the maintenance team."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="estimatedDuration">Estimated Duration (minutes)</label>
          <input
            type="number"
            id="estimatedDuration"
            value={jobData.estimatedDuration}
            onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value))}
            min="30"
            max="480"
          />
        </div>

        <button type="submit" className="assign-job-button" disabled={loading}>
          {loading ? 'Assigning Job...' : 'Assign Job to Team'}
        </button>
      </form>

      <div className="current-jobs-section">
        <h3>Recently Assigned Jobs</h3>
        <ul className="job-list">
          {Array.isArray(jobs) && jobs.length > 0 ? (
            jobs.slice(0, 5).map((job) => (
              <li key={job.id || job._id} className="job-item">
                <div className="job-info">
                  <h4>{job.incident?.incidentNumber || job.description?.substring(0, 50) || 'Job Card'}</h4>
                  <p>{job.description}</p>
                  <small>Priority: {job.priority} | Status: {job.status}</small>
                </div>
                <span className="job-team">{job.team?.name || 'Assigned Team'}</span>
              </li>
            ))
          ) : (
            <li className="no-jobs-message">No jobs assigned yet</li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderIncidentsSection = () => (
    <div className="incidents-section">
      <div className="incidents-header">
        <div className="header-content">
          <h1>Incident Management</h1>
          <p>Monitor and manage all sewer system incidents</p>
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-number">{allIncidents.length}</span>
            <span className="stat-label">Total Incidents</span>
          </div>
          <div className="header-stat">
            <span className="stat-number">{unallocatedIncidents.length}</span>
            <span className="stat-label">Unassigned</span>
          </div>
          <div className="header-stat">
            <span className="stat-number">{allocatedIncidents.length}</span>
            <span className="stat-label">Assigned</span>
          </div>
        </div>
      </div>

      <div className="incidents-grid">
        {allIncidents.map((incident, index) => (
          <div key={incident._id || `incident-${index}`} className={`incident-card priority-${incident.priority?.toLowerCase() || 'medium'}`}>
            <div className="incident-card-header">
              <div className="incident-id-priority">
                <h3>{incident.incidentNumber}</h3>
                <div className={`priority-badge-enhanced priority-${incident.priority?.toLowerCase() || 'medium'}`}>
                  {incident.priority || 'Medium'} Priority
                </div>
              </div>
              <div className="incident-actions-compact">
                <button className="icon-btn" title="View Details">👁️</button>
                <button className="icon-btn" title="Edit">✏️</button>
              </div>
            </div>

            <div className="incident-card-body">
              <p className="incident-description">{incident.description}</p>

              <div className="incident-meta">
                <div className="meta-item">
                  <span className="meta-label">Reported</span>
                  <span className="meta-value">{new Date(incident.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Status</span>
                  <span className={`meta-value status-${incident.status?.toLowerCase() || 'active'}`}>
                    {incident.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="incident-card-footer">
              <div className="status-section">
                <select
                  value={incident.status || 'reported'}
                  onChange={(e) => handleUpdateIncidentStatus(incident._id, e.target.value)}
                  className={`status-select-enhanced status-${incident.status?.toLowerCase() || 'active'}`}
                >
                  <option value="Active">🟡 Active</option>
                  <option value="Assigned">🔵 Assigned</option>
                  <option value="In Progress">🟣 In Progress</option>
                  <option value="Resolved">🟢 Resolved</option>
                </select>
              </div>

              <div className="assignment-section">
                {incident.guardianAssigned ? (
                  <div className="assigned-info">
                    <div className="assigned-avatar">
                      {incident.guardianAssigned.first_name[0]}{incident.guardianAssigned.last_name[0]}
                    </div>
                    <div className="assigned-details">
                      <span className="assigned-to">{incident.guardianAssigned.first_name} {incident.guardianAssigned.last_name}</span>
                      <span className="assigned-time">Assigned</span>
                    </div>
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
                  <h3>{selectedIncident?.incidentNumber}</h3>
                  <div className={`priority-badge-modal priority-${selectedIncident?.priority?.toLowerCase() || 'medium'}`}>
                    {selectedIncident?.priority || 'Medium'} Priority
                  </div>
                </div>
                <div className="incident-preview-details">
                  <p><strong>Description:</strong> {selectedIncident?.description}</p>
                  <p><strong>Status:</strong> {selectedIncident?.status}</p>
                </div>
              </div>

              <div className="technicians-grid-modal">
                <h4>Available Team Members</h4>
                <div className="technicians-list-modal">
                  {teams.map((technician, index) => (
                    <div
                      key={technician._id || `technician-${index}`}
                      className="technician-card-modal"
                      onClick={() => handleAssignToTechnician(technician)}
                    >
                      <div className="technician-header-modal">
                        <div className="technician-avatar-modal">
                          {technician.first_name[0]}{technician.last_name[0]}
                          <div className={`availability-dot available`}></div>
                        </div>
                        <div className="technician-info-modal">
                          <h4>{technician.first_name} {technician.last_name}</h4>
                          <p>{technician.role}</p>
                        </div>
                        <div className="workload-indicator">
                          <div className={`workload-bar low`}>
                            <div className="workload-fill"></div>
                          </div>
                          <span className="workload-text">0 tasks</span>
                        </div>
                      </div>
                      <div className="technician-status-modal">
                        <span className={`status-tag-modal available`}>
                          Available
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

  const renderTeamSection = () => (
    <div className="team-section">
      <div className="incidents-header">
        <div className="header-content">
          <h1>Team Management</h1>
          <p>Manage your field technicians and team members</p>
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-number">{teams.length}</span>
            <span className="stat-label">Total Teams</span>
          </div>
          <div className="header-stat">
            <span className="stat-number">{teams.reduce((total, team) => total + (team.members?.length || 0), 0)}</span>
            <span className="stat-label">Total Members</span>
          </div>
          <div className="header-stat">
            <span className="stat-number">{teams.filter(team => team.members?.length > 0).length}</span>
            <span className="stat-label">Active Teams</span>
          </div>
        </div>
      </div>

      <div className="action-bar">
        <div className="action-group">
          <button className="btn-primary" onClick={() => setShowCreateTeamModal(true)}>
            <span className="btn-icon">➕</span>
            Create New Team
          </button>
        </div>
      </div>

      <div className="teams-section">
        <h2>Teams</h2>
        <div className="team-grid-enhanced">
          {teams.length === 0 ? (
            <div className="no-teams">
              <p>No teams found. Create your first team to get started.</p>
            </div>
          ) : (
            teams.map((team, index) => (
              <div key={team._id || `team-${index}`} className="team-member-card">
                <div className="team-member-header">
                  <div className="member-identity">
                    <div className="member-avatar-large">
                      {team.name ? team.name[0].toUpperCase() : 'T'}
                      <div className={`availability-dot-large online`}></div>
                    </div>
                    <div className="member-basic-info">
                      <h3>{team.name || 'Unnamed Team'}</h3>
                      <p>{team.description || 'No description'}</p>
                      <span className="specialization-badge">{team.specialization || 'General'}</span>
                    </div>
                  </div>
                  <div className="member-actions">
                    <button className="icon-btn" title="Edit" onClick={(e) => {
                      e.stopPropagation();
                      handleEditTeam(team);
                    }}>✏️</button>
                    <button className="icon-btn" title="Message">💬</button>
                    <button
                      className="icon-btn danger"
                      title="Remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(team._id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="team-member-details">
                  <div className="detail-row">
                    <span className="detail-label">Leader</span>
                    <span className={`status-tag status-available`}>
                      {team.leader ? `${team.leader.first_name} ${team.leader.last_name}` : 'No leader assigned'}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Members</span>
                    <span className="task-count-badge">{team.members?.length || 0} members</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className={`status-tag status-available`}>
                      Active
                    </span>
                  </div>
                </div>

                <div className="team-member-footer">
                  <button className="btn-secondary small" onClick={(e) => {
                    e.stopPropagation();
                    handleEditTeam(team);
                  }}>
                    Edit Team
                  </button>
                  <button className="btn-danger small" onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTeam(team._id);
                  }}>
                    Delete Team
                  </button>
                  <button className="btn-primary small" onClick={(e) => {
                    e.stopPropagation();
                    handleAddMembers(team);
                  }}>
                    Add Members
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="modal-overlay-enhanced">
          <div className="team-modal-enhanced">
            <div className="modal-header-enhanced">
              <h2>Create New Team</h2>
              <p>Create a new team with unique name and description</p>
              <button
                className="close-btn-enhanced"
                onClick={() => setShowCreateTeamModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="team-form">
              <div className="form-group">
                <label htmlFor="team-name">Team Name *</label>
                <input
                  type="text"
                  id="team-name"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter unique team name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="team-description">Description *</label>
                <textarea
                  id="team-description"
                  value={teamFormData.description}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the team's purpose and specialization"
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="team-leader">Team Leader *</label>
                <select
                  id="team-leader"
                  value={teamFormData.leader}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, leader: e.target.value }))}
                  required
                >
                  <option value="">Select a team leader</option>
                  {availableUsers.map((user, index) => (
                    <option key={user._id || `user-${index}`} value={user._id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="team-specialization">Specialization</label>
                <select
                  id="team-specialization"
                  value={teamFormData.specialization}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, specialization: e.target.value }))}
                >
                  <option value="general">General Maintenance</option>
                  <option value="emergency">Emergency Response</option>
                  <option value="inspection">Inspection & Assessment</option>
                  <option value="repair">Repair & Restoration</option>
                  <option value="preventive">Preventive Maintenance</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateTeamModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeamModal && (
        <div className="modal-overlay-enhanced">
          <div className="team-modal-enhanced">
            <div className="modal-header-enhanced">
              <h2>Edit Team</h2>
              <p>Update team information</p>
              <button
                className="close-btn-enhanced"
                onClick={() => setShowEditTeamModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTeam} className="team-form">
              <div className="form-group">
                <label htmlFor="edit-team-name">Team Name *</label>
                <input
                  type="text"
                  id="edit-team-name"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter unique team name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-team-description">Description *</label>
                <textarea
                  id="edit-team-description"
                  value={teamFormData.description}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the team's purpose and specialization"
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-team-leader">Team Leader *</label>
                <select
                  id="edit-team-leader"
                  value={teamFormData.leader}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, leader: e.target.value }))}
                  required
                >
                  <option value="">Select a team leader</option>
                  {availableUsers.map((user, index) => (
                    <option key={user._id || `edit-user-${index}`} value={user._id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-team-specialization">Specialization</label>
                <select
                  id="edit-team-specialization"
                  value={teamFormData.specialization}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, specialization: e.target.value }))}
                >
                  <option value="general">General Maintenance</option>
                  <option value="emergency">Emergency Response</option>
                  <option value="inspection">Inspection & Assessment</option>
                  <option value="repair">Repair & Restoration</option>
                  <option value="preventive">Preventive Maintenance</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditTeamModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && selectedTeam && (
        <div className="modal-overlay-enhanced">
          <div className="team-modal-enhanced">
            <div className="modal-header-enhanced">
              <h2>Add Members to {selectedTeam.name}</h2>
              <p>Select team members to add</p>
              <button
                className="close-btn-enhanced"
                onClick={() => {
                  setShowAddMembersModal(false);
                  setSelectedMembers([]);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-content-enhanced">
              <div className="members-selection">
                <div className="selection-header">
                  <h4>Available Users</h4>
                  <button
                    type="button"
                    className="btn-secondary small random-btn"
                    onClick={handleRandomSelection}
                    disabled={availableUsers.filter(user => !selectedTeam.members?.some(member => member._id === user._id)).length === 0}
                  >
                    🎲 Random (5)
                  </button>
                </div>
                <div className="members-list">
                  {availableUsers
                    .filter(user => !selectedTeam.members?.some(member => member._id === user._id))
                    .map((user, index) => (
                      <div key={user._id || `member-${index}`} className="member-selection-item">
                        <label className="member-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(user._id)}
                            onChange={() => handleMemberSelection(user._id)}
                          />
                          <div className="member-info">
                            <div className="member-avatar-small">
                              {user.first_name[0]}{user.last_name[0]}
                            </div>
                            <div className="member-details">
                              <span className="member-name">{user.first_name} {user.last_name}</span>
                              <span className="member-role">{user.role}</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                </div>

                {availableUsers.filter(user => !selectedTeam.members?.some(member => member._id === user._id)).length === 0 && (
                  <div className="no-members">
                    <p>All available users are already members of this team.</p>
                  </div>
                )}
              </div>

              <div className="selection-summary">
                <p>Selected: {selectedMembers.length} member(s)</p>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddMembersModal(false);
                  setSelectedMembers([]);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddSelectedMembers}
                disabled={loading || selectedMembers.length === 0}
              >
                {loading ? 'Adding Members...' : `Add ${selectedMembers.length} Member(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderApprovalsSection = () => (
    <div className="approvals-section">
      <div className="incidents-header">
        <div className="header-content">
          <h1>Job Completion Approvals</h1>
          <p>Review and approve technician job completions</p>
        </div>
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-number">{pendingCompletions.length}</span>
            <span className="stat-label">Pending Approvals</span>
          </div>
          <div className="header-stat">
            <span className="stat-number">0</span>
            <span className="stat-label">Approved Today</span>
          </div>
          <div className="header-stat">
            <span className="stat-number">0%</span>
            <span className="stat-label">Approval Rate</span>
          </div>
        </div>
      </div>

      <div className="approvals-grid">
        {pendingCompletions.length === 0 ? (
          <div className="no-approvals">
            <h3>No pending approvals</h3>
            <p>All job completions have been reviewed.</p>
          </div>
        ) : (
          pendingCompletions.map((completion, index) => (
            <div key={completion.id || `completion-${index}`} className="approval-card">
              <div className="approval-header">
                <h3>{completion.jobId}</h3>
                <div className="approval-status">
                  <span className="status-badge status-pending">Pending Approval</span>
                </div>
              </div>

              <div className="approval-details">
                <p><strong>Technician:</strong> {completion.technician}</p>
                <p><strong>Description:</strong> {completion.description}</p>
                <p><strong>Submitted:</strong> {new Date(completion.submittedAt).toLocaleString()}</p>
              </div>

              <div className="approval-actions">
                <button
                  className="btn-success"
                  onClick={() => handleApproveCompletion(completion.id)}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleRejectCompletion(completion.id)}
                >
                  ❌ Reject
                </button>
                <button className="btn-secondary">
                  📋 View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderReportsSection = () => (
    <div className="reports-section">
      <div className="incidents-header">
        <div className="header-content">
          <h1>Team Reports</h1>
          <p>Generate and view team performance reports</p>
        </div>
      </div>

      <div className="reports-actions">
        <button className="btn-primary">
          <span className="btn-icon">📊</span>
          Generate New Report
        </button>
        <button className="btn-secondary">
          <span className="btn-icon">📅</span>
          Schedule Report
        </button>
      </div>

      <div className="reports-grid">
        {teamReports.map((report, index) => (
          <div key={report.id || `report-${index}`} className="report-card">
            <div className="report-header">
              <h3>{report.title}</h3>
              <span className="report-period">{report.period}</span>
            </div>

            <div className="report-metrics">
              <div className="metric">
                <span className="metric-value">{report.metrics.totalJobs}</span>
                <span className="metric-label">Total Jobs</span>
              </div>
              <div className="metric">
                <span className="metric-value">{report.metrics.completedJobs}</span>
                <span className="metric-label">Completed</span>
              </div>
              <div className="metric">
                <span className="metric-value">{report.metrics.averageResponseTime}</span>
                <span className="metric-label">Avg Response</span>
              </div>
              <div className="metric">
                <span className="metric-value">{report.metrics.teamEfficiency}</span>
                <span className="metric-label">Efficiency</span>
              </div>
            </div>

            <div className="report-actions">
              <button className="btn-secondary small">📄 View Full Report</button>
              <button className="btn-secondary small">📥 Download PDF</button>
              <button className="btn-secondary small">📧 Email Report</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSection = () => {
    switch(activeSection) {
      case "dashboard":
        return renderDashboard();
      case "assign":
        return renderAssignJobSection();
      case "incidents":
        return renderIncidentsSection();
      case "team":
        return renderTeamSection();
      case "approvals":
        return renderApprovalsSection();
      case "reports":
        return renderReportsSection();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="manager-container">
      <header className="manager-header">
        <div className="manager-brand">
          <h1>🚰 Team Manager Dashboard</h1>
        </div>

        <div className="manager-profile">
          <div className="manager-info">
            <div className="manager-avatar">
              {managerDetails.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="manager-details">
              <div className="manager-name">{managerDetails.name}</div>
              <div className="manager-meta">
                <span className="staff-id">{managerDetails.staffNumber}</span>
                <span className="manager-role">{managerDetails.role}</span>
              </div>
            </div>
          </div>
          <div className="manager-actions">
            <Link to="/" className="nav-link-home">
              🏠 Back to Home
            </Link>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="manager-content">
        <aside className="manager-sidebar">
          <nav className="manager-nav">
            <button
              className={`nav-item ${activeSection === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveSection("dashboard")}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Dashboard</span>
            </button>
            <button
              className={`nav-item ${activeSection === "assign" ? "active" : ""}`}
              onClick={() => setActiveSection("assign")}
            >
              <span className="nav-icon">➕</span>
              <span className="nav-label">Assign Jobs</span>
            </button>
            <button
              className={`nav-item ${activeSection === "incidents" ? "active" : ""}`}
              onClick={() => setActiveSection("incidents")}
            >
              <span className="nav-icon">🚨</span>
              <span className="nav-label">Incidents</span>
              <span className="nav-badge">{unallocatedIncidents.length}</span>
            </button>
            <button
              className={`nav-item ${activeSection === "team" ? "active" : ""}`}
              onClick={() => setActiveSection("team")}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">Team</span>
            </button>
            <button
              className={`nav-item ${activeSection === "approvals" ? "active" : ""}`}
              onClick={() => setActiveSection("approvals")}
            >
              <span className="nav-icon">✅</span>
              <span className="nav-label">Approvals</span>
              {pendingCompletions.length > 0 && <span className="nav-badge">{pendingCompletions.length}</span>}
            </button>
            <button
              className={`nav-item ${activeSection === "reports" ? "active" : ""}`}
              onClick={() => setActiveSection("reports")}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Reports</span>
            </button>
          </nav>
        </aside>

        <main className="manager-main">
          <div className="manager-content-area">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssignJob;
