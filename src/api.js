const API_BASE_URL = 'http://10.5.35.133:2000/api';

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('token');

// Health check
export const healthCheck = async () => {
  console.log('Performing health check');
  const response = await fetch(`${API_BASE_URL}/../health`, {
    method: 'GET',
  });

  console.log(`Health check response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Health check failed:', errorText);
    throw new Error(`Health check failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Health check successful:', data);
  return data;
};

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

  console.log(`Making request to: ${API_BASE_URL}${url}`);
  console.log('Request options:', options);

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  console.log(`Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Response data:', data);
  return data;
};

// Authentication
export const login = async (email, password) => {
  console.log('Attempting login for:', email);
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  console.log(`Login response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Login failed:', errorText);
    throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Login successful:', data);
  return data;
};

export const register = async (userData) => {
  console.log('Attempting registration for:', userData.email);
  // Use the correct endpoint from api.md documentation
  const response = await fetch(`${API_BASE_URL}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  console.log(`Registration response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Registration failed:', errorText);
    throw new Error(`Registration failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Registration successful:', data);
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

export const getTeamJobCards = async (teamId) => {
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
  return makeRequest('users');
};

// Incidents for map
export const getIncidentsForMap = async () => {
  return makeRequest('incidents/map');
};

// WhatsApp (for reporting incidents)
export const reportIncident = async (formData) => {
  console.log('Reporting incident via WhatsApp');
  const response = await fetch(`${API_BASE_URL}/whatsapp`, {
    method: 'POST',
    body: formData,
  });

  console.log(`WhatsApp report response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Report submission failed:', errorText);
    throw new Error(`Report submission failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.text();
  console.log('WhatsApp report successful:', data);
  return data; // WhatsApp returns TwiML XML
};