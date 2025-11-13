import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createJobCard, getUnallocatedIncidents, getUsers, getIncidents, getAllocatedIncidents, getHeatmapData, allocateIncident, updateIncident, getJobCards, getTeams, createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, setTeamLeader } from "../api";
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

  // Manager details
  const managerDetails = {
    name: "Team Manager",
    staffNumber: "TM-2024-001",
    role: "Team Manager",
    department: "Operations Management",
    lastLogin: new Date().toLocaleDateString()
  };

  // Check if user is manager, redirect if not
  useEffect(() => {
    if (user !== "manager") {
      navigate("/");
    }
  }, [user, navigate]);

  // Debug: Log user role to verify it's being passed correctly
  useEffect(() => {
    console.log('AssignJob component - user prop:', user);
  }, [user]);

  // Fetch data on component mount
useEffect(() => {
const fetchData = async () => {
try {
  setLoading(true);
  setError(null);

  const [unallocated, allocated, allIncidentsData, heatmap, users, jobCards, teamsData] = await Promise.all([
    getUnallocatedIncidents().catch(err => ({ incidents: [] })),
    getAllocatedIncidents().catch(err => ({ incidents: [] })),
    getIncidents().catch(err => []),
    getHeatmapData().catch(err => ({ data: [] })),
    getUsers().catch(err => []),
    getJobCards().catch(err => []),
    getTeams().catch(err => ({ teams: [] }))
  ]);

  setAvailableUsers(users || []);

  setUnallocatedIncidents(unallocated.incidents || []);
  setAllocatedIncidents(allocated.incidents || []);
  setAllIncidents(allIncidentsData || []);
  // Use actual teams from database - API returns {success: true, data: [teams]}
  setTeams(teamsData.data || []);
  setJobs(jobCards || []);
  console.log('Job cards loaded:', jobCards);
  console.log('Teams loaded:', teamsData.teams);
  console.log('Available users loaded:', users);

  // Mock pending completions (jobs awaiting approval)
  const mockPending = [
    {
      id: '1',
      jobId: 'JOB-001',
      technician: 'Mike Johnson',
      description: 'Completed sewer line inspection in Zone A',
      submittedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'pending_approval'
    }
  ];
  setPendingCompletions(mockPending);

  // Mock team reports
  const mockReports = [
    {
      id: '1',
      title: 'Weekly Team Performance Report',
      period: 'Week 45, 2024',
      generatedAt: new Date().toISOString(),
      metrics: {
        totalJobs: 24,
        completedJobs: 22,
        averageResponseTime: '2.3h',
        teamEfficiency: '91%'
      }
    }
  ];
  setTeamReports(mockReports);
} catch (error) {
  console.error('Error fetching data:', error);
  setError('Failed to load dashboard data');
} finally {
  setLoading(false);
}
};

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
      const newJobCard = await createJobCard({
        incidentId: jobData.incidentId,
        teamId: jobData.teamId,
        priority: jobData.priority,
        description: jobData.description,
        estimatedDuration: jobData.estimatedDuration,
        specialInstructions: jobData.description
      });

      // Add to local jobs list
      setJobs(prev => [...prev, {
        id: newJobCard.data?._id || Date.now().toString(),
        title: `Job for ${unallocatedIncidents.find(i => i._id === jobData.incidentId)?.incidentNumber || 'Unknown'}`,
        description: jobData.description,
        team: teams.find(t => t._id === jobData.teamId)?.first_name + ' ' + teams.find(t => t._id === jobData.teamId)?.last_name || 'Unknown',
        status: 'assigned',
        createdAt: new Date().toISOString()
      }]);

      // Reset form
      setJobData({
        incidentId: "",
        teamId: "",
        priority: "P2",
        description: "",
        estimatedDuration: 120
      });

      // Refresh incidents list
      const updatedIncidents = await getUnallocatedIncidents();
      setUnallocatedIncidents(updatedIncidents.incidents || []);

    } catch (error) {
      console.error('Error creating job card:', error);
      setError('Failed to create job card. Please try again.');
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
        await allocateIncident(selectedIncident._id, technician._id);

        // Update local state
        setUnallocatedIncidents(prev => prev.filter(inc => inc._id !== selectedIncident._id));
        setAllocatedIncidents(prev => [...prev, { ...selectedIncident, guardianAssigned: technician }]);

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
      const apiStatus = newStatus === "Resolved" ? "resolved" :
                        newStatus === "In Progress" ? "in_progress" :
                        newStatus === "Assigned" ? "verified" : "reported";

      await updateIncident(incidentId, { status: apiStatus });

      // Update local state
      setAllIncidents(prev => prev.map(inc =>
        inc._id === incidentId ? { ...inc, status: apiStatus } : inc
      ));
    } catch (error) {
      console.error('Error updating incident status:', error);
      alert('Failed to update incident status. Please try again.');
    }
  };

  const handleApproveCompletion = async (completionId) => {
    try {
      // In a real app, this would call an API to approve the completion
      setPendingCompletions(prev => prev.filter(comp => comp.id !== completionId));
      alert('Job completion approved successfully!');
    } catch (error) {
      console.error('Error approving completion:', error);
      alert('Failed to approve completion. Please try again.');
    }
  };

  const handleRejectCompletion = async (completionId) => {
    try {
      // In a real app, this would call an API to reject the completion
      setPendingCompletions(prev => prev.filter(comp => comp.id !== completionId));
      alert('Job completion rejected.');
    } catch (error) {
      console.error('Error rejecting completion:', error);
      alert('Failed to reject completion. Please try again.');
    }
  };

  const handleReassignTask = async (jobId, newTechnicianId) => {
    try {
      // In a real app, this would call an API to reassign the task
      const newTechnician = teams.find(t => t._id === newTechnicianId);
      alert(`Task reassigned to ${newTechnician.first_name} ${newTechnician.last_name}`);
    } catch (error) {
      console.error('Error reassigning task:', error);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamFormData.name || !teamFormData.description || !teamFormData.leader) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating team with data:', teamFormData);
      console.log('Leader field value:', teamFormData.leader);
      console.log('Leader field type:', typeof teamFormData.leader);
      console.log('Leader field truthy check:', !!teamFormData.leader);
      console.log('Leader field length:', teamFormData.leader ? teamFormData.leader.length : 'undefined');

      // Ensure leader is a string and not empty
      const cleanData = {
        ...teamFormData,
        leader: teamFormData.leader?.toString().trim() || ''
      };

      console.log('Cleaned data:', cleanData);
      console.log('Cleaned leader field:', cleanData.leader);
      console.log('Cleaned leader truthy:', !!cleanData.leader);

      // Check if we have available users
      console.log('Available users:', availableUsers);
      console.log('Available users length:', availableUsers.length);

      // Use the correct API format from documentation
      const apiData = {
        name: cleanData.name,
        description: cleanData.description,
        leaderId: cleanData.leader,
        memberIds: []
      };

      console.log('API data format:', apiData);

      await createTeam(apiData);

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
      console.error('Error creating team:', error);
      if (error.message.includes('duplicate key error')) {
        setError('A team with this name already exists. Please choose a different name.');
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

  const handleAddSelectedMembers = async () => {
    if (!selectedTeam || selectedMembers.length === 0) {
      setError('Please select at least one member to add');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Adding members to team:', selectedTeam._id, selectedMembers);

      // Add members one by one (API might support bulk, but this is safer)
      for (const memberId of selectedMembers) {
        await addTeamMember(selectedTeam._id, { memberId });
      }

      // Refresh teams list
      const updatedTeams = await getTeams();
      setTeams(updatedTeams.data || []);

      setShowAddMembersModal(false);
      setSelectedMembers([]);
      alert(`Successfully added ${selectedMembers.length} member(s) to the team!`);

    } catch (error) {
      console.error('Error adding team members:', error);
      if (error.message.includes('duplicate')) {
        setError('Some members are already part of this team');
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
      await updateTeam(selectedTeam._id, teamFormData);

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
      await deleteTeam(teamId);

      // Refresh teams list
      const updatedTeams = await getTeams();
      setTeams(updatedTeams.data || []);

      alert('Team deleted successfully!');
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team. Please try again.');
    }
  };

  const handleAddTeamMember = async (teamId, memberData) => {
    try {
      await addTeamMember(teamId, memberData);

      // Refresh teams list
      const updatedTeams = await getTeams();
      setTeams(updatedTeams.data || []);

      alert('Team member added successfully!');
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Failed to add team member. Please try again.');
    }
  };

  const handleRemoveTeamMember = async (teamId, memberId) => {
    try {
      await removeTeamMember(teamId, memberId);

      // Refresh teams list
      const updatedTeams = await getTeams();
      setTeams(updatedTeams.data || []);

      alert('Team member removed successfully!');
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('Failed to remove team member. Please try again.');
    }
  };

  const handleSetTeamLeader = async (teamId, leaderData) => {
    try {
      await setTeamLeader(teamId, leaderData);

      // Refresh teams list
      const updatedTeams = await getTeams();
      setTeams(updatedTeams.data || []);

      alert('Team leader updated successfully!');
    } catch (error) {
      console.error('Error setting team leader:', error);
      alert('Failed to set team leader. Please try again.');
    }
  };

  const handleRemoveTeamMemberOld = (memberId) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      setTeams(prev => prev.filter(member => member._id !== memberId));
      alert('Team member removed successfully');
    }
  };

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
            {unallocatedIncidents.slice(0, 4).map(incident => (
              <div key={incident._id} className="incident-preview-card">
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
            {teams.slice(0, 4).map(team => (
              <div key={team._id} className="team-member-compact">
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
      <h2>Assign a New Job Card</h2>

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
            {unallocatedIncidents.map(incident => (
              <option key={incident._id} value={incident._id}>
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
            {teams.map(team => (
              <option key={team._id} value={team._id}>
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
          {loading ? 'Creating Job Card...' : 'Create Job Card'}
        </button>
      </form>

      <div className="current-jobs-section">
        <h3>Currently Assigned Jobs</h3>
        <ul className="job-list">
          {Array.isArray(jobs) && jobs.length > 0 ? (
            jobs.map((job) => (
              <li key={job.id || job._id} className="job-item">
                <div className="job-info">
                  <h4>{job.title}</h4>
                  <p>{job.description}</p>
                </div>
                <span className="job-team">{job.team}</span>
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
        {allIncidents.map(incident => (
          <div key={incident._id} className={`incident-card priority-${incident.priority?.toLowerCase() || 'medium'}`}>
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
                  {teams.map(technician => (
                    <div
                      key={technician._id}
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
            teams.map(team => (
              <div key={team._id} className="team-member-card" onClick={() => handleAddMembers(team)}>
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
                  {availableUsers.map(user => (
                    <option key={user._id} value={user._id}>
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
                  {availableUsers.map(user => (
                    <option key={user._id} value={user._id}>
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
                <h4>Available Users</h4>
                <div className="members-list">
                  {availableUsers
                    .filter(user => !selectedTeam.members?.some(member => member._id === user._id))
                    .map(user => (
                      <div key={user._id} className="member-selection-item">
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
            <span className="stat-number">12</span>
            <span className="stat-label">Approved Today</span>
          </div>
          <div className="header-stat">
            <span className="stat-number">98%</span>
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
          pendingCompletions.map(completion => (
            <div key={completion.id} className="approval-card">
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
        {teamReports.map(report => (
          <div key={report.id} className="report-card">
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
