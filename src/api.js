const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('token');

// Helper function to make authenticated requests
const makeRequest = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }


  // Set timeout for requests to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();

      // Handle specific error cases
      if (response.status === 401) {
        // Token expired or invalid - clear it
        localStorage.removeItem('token');
        throw new Error('Authentication failed. Please log in again.');
      }

      if (response.status === 403) {
        // Forbidden - user doesn't have permission
        // Return empty data instead of throwing for graceful handling
        console.warn(`Access forbidden for endpoint: ${url}`);
        return { data: [], message: 'Access denied', status: 403 };
      }

      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Server may be experiencing high load.');
    }

    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/../health`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Health check failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data;
};

// Authentication
export const login = async (email, password) => {
  const requestBody = { email, password };

  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data;
};

export const register = async (userData) => {
  // Use the correct endpoint from api.md documentation
  const response = await fetch(`${API_BASE_URL}/users/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Registration failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data;
};

// Incidents
export const getIncidents = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/incidents${queryString ? `?${queryString}` : ''}`);
};

export const getUnallocatedIncidents = async () => {
  return makeRequest('/incidents/unallocated');
};

export const getAllocatedIncidents = async () => {
  return makeRequest('/incidents/allocated');
};

export const getHeatmapData = async () => {
  return makeRequest('/incidents/heatmap');
};

export const updateIncident = async (id, updates) => {
  return makeRequest(`/incidents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const allocateIncident = async (id, teamId) => {
  return makeRequest(`/incidents/${id}/allocate`, {
    method: 'POST',
    body: JSON.stringify({ teamId }),
  });
};

// Job Cards
export const createJobCard = async (jobData) => {
  return makeRequest('/job-cards/allocate', {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
};

export const getJobCards = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/job-cards${queryString ? `?${queryString}` : ''}`);
};

export const getTeamJobCardsNew = async (teamId) => {
  return makeRequest(`/job-cards/team/${teamId}`);
};

export const updateJobCardStatus = async (id, statusData) => {
  return makeRequest(`/job-cards/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(statusData),
  });
};

export const getJobCard = async (id) => {
  return makeRequest(`/job-cards/${id}`);
};

// Users
export const getUsers = async () => {
  return makeRequest('/users');
};

export const getUserProfile = async (userId) => {
  return makeRequest(`/users/${userId}`);
};

export const updateUserProfile = async (userId, updates) => {
  return makeRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// Citizen-specific endpoints
export const getCitizenIncidents = async () => {
  return makeRequest('/citizen/incidents');
};

export const createCitizenIncident = async (incidentData) => {
  return makeRequest('/citizen/incidents', {
    method: 'POST',
    body: JSON.stringify(incidentData),
  });
};

// Incidents for map
export const getIncidentsForMap = async () => {
  return makeRequest('incidents/map');
};

// WhatsApp (for reporting incidents)
export const reportIncident = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/whatsapp`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Report submission failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.text();
  return data; // WhatsApp returns TwiML XML
};

// Team Management Routes
export const createTeam = async (teamData) => {
  return makeRequest('/teams', {
    method: 'POST',
    body: JSON.stringify(teamData),
  });
};

export const getTeams = async () => {
  return makeRequest('/teams');
};

export const getTeam = async (id) => {
  return makeRequest(`/teams/${id}`);
};

export const updateTeam = async (id, updates) => {
  return makeRequest(`/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteTeam = async (id) => {
  return makeRequest(`/teams/${id}`, {
    method: 'DELETE',
  });
};

export const addTeamMember = async (teamId, memberData) => {
  return makeRequest(`/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify(memberData),
  });
};

export const removeTeamMember = async (teamId, memberId) => {
  return makeRequest(`/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
  });
};

export const setTeamLeader = async (teamId, leaderData) => {
  return makeRequest(`/teams/${teamId}/leader`, {
    method: 'PUT',
    body: JSON.stringify(leaderData),
  });
};

export const getTeamMembers = async (teamId) => {
  return makeRequest(`/teams/${teamId}/members`);
};

// Job Allocation (Team-Based)
export const allocateJobToTeam = async (allocationData) => {
  return makeRequest('/job-cards/allocate', {
    method: 'POST',
    body: JSON.stringify(allocationData),
  });
};

export const getTeamJobCards = async (teamId) => {
  return makeRequest(`/job-cards/team/${teamId}`);
};

export const updateJobCard = async (id, updates) => {
  return makeRequest(`/job-cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteJobCard = async (id) => {
  return makeRequest(`/job-cards/${id}`, {
    method: 'DELETE',
  });
};

// Field Technician Features
export const updateTechnicianAvailability = async (technicianId, availabilityData) => {
  return makeRequest(`/technicians/${technicianId}/availability`, {
    method: 'PUT',
    body: JSON.stringify(availabilityData),
  });
};

export const getTechnicianAvailability = async (technicianId) => {
  return makeRequest(`/technicians/${technicianId}/availability`);
};

export const sendTeamMessage = async (teamId, messageData) => {
  return makeRequest(`/teams/${teamId}/communication`, {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
};

export const getTeamCommunication = async (teamId) => {
  return makeRequest(`/teams/${teamId}/communication`);
};

// User Account Features
export const getUserNotifications = async (userId) => {
  return makeRequest(`/users/${userId}/notifications`);
};

export const markNotificationAsRead = async (userId, notificationId) => {
  return makeRequest(`/users/${userId}/notifications/${notificationId}/read`, {
    method: 'POST',
  });
};

export const editReport = async (reportId, updates) => {
  return makeRequest(`/reports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteReport = async (reportId) => {
  return makeRequest(`/reports/${reportId}`, {
    method: 'DELETE',
  });
};

export const getUserReports = async (userId) => {
  return makeRequest(`/users/${userId}/reports`);
};

// Additional Admin Routes
export const getAdminTeams = async () => {
  return makeRequest('/admin/teams');
};

export const getAdminJobCards = async () => {
  return makeRequest('/admin/job-cards');
};

export const archiveTeam = async (teamId) => {
  return makeRequest(`/admin/teams/${teamId}/archive`, {
    method: 'POST',
  });
};

export const bulkAllocateJobCards = async (allocationData) => {
  return makeRequest('/admin/job-cards/bulk-allocate', {
    method: 'POST',
    body: JSON.stringify(allocationData),
  });
};

// Team Leader Dashboard APIs
export const getTeamLeaderNotifications = async () => {
  return makeRequest('/notifications/team-leader');
};

export const markTeamLeaderNotificationAsRead = async (notificationId) => {
  return makeRequest(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
};

export const getTeamLeaderJobCards = async () => {
  return makeRequest('/jobcards/team');
};

export const updateTeamLeaderJobCardStatus = async (jobCardId, statusData) => {
  return makeRequest(`/jobcards/${jobCardId}/status`, {
    method: 'PUT',
    body: JSON.stringify(statusData),
  });
};

export const requestManagerAssistance = async (jobCardId, assistanceData) => {
  return makeRequest(`/jobcards/${jobCardId}/assistance`, {
    method: 'POST',
    body: JSON.stringify(assistanceData),
  });
};

// Automated Job Card Allocation APIs
export const allocateJobCardAuto = async (incidentData) => {
  return makeRequest('/jobcards/allocate/auto', {
    method: 'POST',
    body: JSON.stringify(incidentData),
  });
};

export const reassignJobCard = async (jobCardId, reassignmentData) => {
  return makeRequest(`/jobcards/reassign/${jobCardId}`, {
    method: 'PUT',
    body: JSON.stringify(reassignmentData),
  });
};

export const getTeamWorkloadAnalysis = async () => {
  return makeRequest('/teams/workload-analysis');
};

export const getAllocationRecommendations = async () => {
  return makeRequest('/teams/recommendations');
};

export const allocateJobCardsBatch = async (batchData) => {
  return makeRequest('/jobcards/allocate/batch', {
    method: 'POST',
    body: JSON.stringify(batchData),
  });
};

// Manager-Specific API Endpoints

// Enhanced Team Management for Managers
export const getTeamsWithMetrics = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/teams/metrics${queryString ? `?${queryString}` : ''}`);
};

export const getTeamPerformanceComparison = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/teams/performance/comparison${queryString ? `?${queryString}` : ''}`);
};

export const assignMultipleTeamsToIncident = async (incidentId, assignmentData) => {
  return makeRequest(`/incidents/${incidentId}/assign-multiple`, {
    method: 'PUT',
    body: JSON.stringify(assignmentData),
  });
};

// Budget & Resource Management for Managers
export const getBudgetOverview = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/budget/overview${queryString ? `?${queryString}` : ''}`);
};

export const updateBudgetAllocations = async (allocationData) => {
  return makeRequest('/budget/allocate', {
    method: 'PUT',
    body: JSON.stringify(allocationData),
  });
};

export const getResourceUtilizationAnalytics = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/resources/utilization${queryString ? `?${queryString}` : ''}`);
};

// Advanced Analytics for Managers
export const getPredictiveAnalytics = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/analytics/predictions${queryString ? `?${queryString}` : ''}`);
};

export const getPerformanceTrends = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/analytics/performance-trends${queryString ? `?${queryString}` : ''}`);
};

export const getDistrictComparison = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/analytics/districts${queryString ? `?${queryString}` : ''}`);
};

// Manager Operations
export const getCriticalIncidentsForManager = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/incidents/critical/manager${queryString ? `?${queryString}` : ''}`);
};

export const broadcastSystemWideMessage = async (messageData) => {
  return makeRequest('/notifications/broadcast-manager', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
};

export const getOperationalReadinessStatus = async () => {
  return makeRequest('/operations/readiness');
};

// AssignJob API for Team Managers
export const getUnassignedJobsForAssignment = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/jobs/unassigned${queryString ? `?${queryString}` : ''}`);
};

export const assignJobToTeam = async (jobId, assignmentData) => {
  return makeRequest(`/jobs/${jobId}/assign`, {
    method: 'POST',
    body: JSON.stringify(assignmentData),
  });
};

export const getAssignmentHistory = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/jobs/assignments/history${queryString ? `?${queryString}` : ''}`);
};

// Manager Dashboard KPIs
export const getManagerDashboardKPIs = async () => {
  return makeRequest('/manager/dashboard/kpis');
};

export const getManagerDashboardTrends = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/manager/dashboard/trends${queryString ? `?${queryString}` : ''}`);
};

// Operations Center Data
export const getOperationsCenterData = async () => {
  return makeRequest('/manager/operations/center');
};

export const getGeographicIncidentData = async () => {
  return makeRequest('/manager/operations/geographic');
};

// Budget Analytics
export const getBudgetAnalytics = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return makeRequest(`/manager/budget/analytics${queryString ? `?${queryString}` : ''}`);
};