import React, { useState, useEffect } from "react";
import { createJobCard, getUnallocatedIncidents, getUsers } from "../api";
import './AssignJob.css';

const AssignJob = () => {
  const [jobData, setJobData] = useState({
    incidentId: "",
    teamId: "",
    priority: "P2",
    description: "",
    estimatedDuration: 120
  });
  const [jobs, setJobs] = useState([]);
  const [unallocatedIncidents, setUnallocatedIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidents, users] = await Promise.all([
          getUnallocatedIncidents(),
          getUsers()
        ]);

        setUnallocatedIncidents(incidents.incidents || []);
        // Filter users to get only Guardians (maintenance teams)
        setTeams(users.filter(user => user.role === 'Guardian') || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      }
    };

    fetchData();
  }, []);

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
        id: newJobCard.data._id,
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

  return (
    <div className="assign-job-container">
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
          <label htmlFor="teamId">Assign to Team Member</label>
          <select
            id="teamId"
            value={jobData.teamId}
            onChange={(e) => handleInputChange('teamId', e.target.value)}
            required
          >
            <option value="">Select a team member</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.first_name} {team.last_name} ({team.role})
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
          {jobs.map((job) => (
            <li key={job.id} className="job-item">
              <div className="job-info">
                <h4>{job.title}</h4>
                <p>{job.description}</p>
              </div>
              <span className="job-team">{job.team}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AssignJob;
