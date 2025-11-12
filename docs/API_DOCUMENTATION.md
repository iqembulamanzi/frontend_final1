# Iqembu Lamanzi API Documentation

## Overview

The Iqembu Lamanzi API provides comprehensive endpoints for sewage incident management, including incident reporting, job card management, user authentication, and geospatial data visualization. The API is designed for integration with web dashboards and mobile applications.

**Base URL:** `http://your-server:2000/api`

**Content Type:** `application/json`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **Guardian**: Field maintenance personnel
- **Manager**: Team supervisors
- **Admin**: System administrators

## API Endpoints

### 1. Incidents

#### GET /api/incidents
Get all open incidents (requires authentication)

**Response:**
```json
[
  {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "incidentNumber": "INC-2024-001",
    "reporterPhone": "+1234567890",
    "description": "Sewage leak on Main Street",
    "category": "sewage",
    "priority": "P1",
    "status": "reported",
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749]
    },
    "mediaUrls": ["https://api.twilio.com/..."],
    "guardianAssigned": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### PUT /api/incidents/:id
Update incident details (requires authentication)

**Request Body:**
```json
{
  "status": "verified",
  "priority": "P0",
  "category": "pipe_burst",
  "guardianAssigned": "64f1a2b3c4d5e6f7g8h9i0j2"
}
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "status": "verified",
    "priority": "P0",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### GET /api/incidents/unallocated
Get incidents not assigned to maintenance teams

**Response:**
```json
{
  "success": true,
  "incidents": [...]
}
```

#### GET /api/incidents/allocated
Get incidents assigned to maintenance teams

**Response:**
```json
{
  "success": true,
  "incidents": [...]
}
```

#### POST /api/incidents/:id/allocate
Allocate incident to a maintenance team

**Request Body:**
```json
{
  "teamId": "64f1a2b3c4d5e6f7g8h9i0j3"
}
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "guardianAssigned": "64f1a2b3c4d5e6f7g8h9i0j3",
    "status": "verified"
  }
}
```

#### GET /api/incidents/heatmap
Get incident data formatted for heatmap visualization

**Response:**
```json
{
  "success": true,
  "heatmapData": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "lat": 37.7749,
      "lng": -122.4194,
      "category": "sewage",
      "priority": "P1",
      "status": "reported",
      "incidentNumber": "INC-2024-001",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 2. Job Cards

#### POST /api/job-cards/allocate
Create and allocate a job card to a team (requires authentication)

**Request Body:**
```json
{
  "incidentId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "teamId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "description": "Repair sewage pipe burst",
  "priority": "P1",
  "estimatedCompletion": "2024-01-16T17:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job card allocated successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "incident": "64f1a2b3c4d5e6f7g8h9i0j1",
    "team": "64f1a2b3c4d5e6f7g8h9i0j3",
    "status": "assigned",
    "priority": "P1",
    "description": "Repair sewage pipe burst",
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749]
    },
    "estimatedCompletion": "2024-01-16T17:00:00Z",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

#### GET /api/job-cards/team/:teamId
Get all job cards for a specific team (requires authentication)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "incident": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "description": "Sewage leak on Main Street",
        "incidentNumber": "INC-2024-001"
      },
      "team": "64f1a2b3c4d5e6f7g8h9i0j3",
      "status": "assigned",
      "priority": "P1",
      "description": "Repair sewage pipe burst",
      "location": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      },
      "estimatedCompletion": "2024-01-16T17:00:00Z",
      "notes": [],
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### PUT /api/job-cards/:id/status
Update job card status (requires authentication)

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Started repair work on the burst pipe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job card status updated successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "status": "in_progress",
    "notes": [
      {
        "text": "Started repair work on the burst pipe",
        "addedBy": "64f1a2b3c4d5e6f7g8h9i0j5",
        "timestamp": "2024-01-15T12:00:00Z"
      }
    ],
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

#### GET /api/job-cards/:id
Get specific job card details (requires authentication)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "incident": {...},
    "team": {...},
    "status": "in_progress",
    "notes": [...]
  }
}
```

#### GET /api/job-cards
Get all job cards with optional filters (requires authentication)

**Query Parameters:**
- `status`: Filter by status (assigned, in_progress, completed, cancelled)
- `team`: Filter by team ID
- `priority`: Filter by priority (P1, P2, P3)

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

### 3. Users

#### POST /submit
Register a new user

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@municipality.gov",
  "phone": "+1234567890",
  "password": "securepassword123",
  "role": "Guardian"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome, John! Your account has been created with role: Guardian."
}
```

#### GET /users
Get all users (requires authentication)

**Response:**
```json
[
  {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j5",
    "userId": "GDN-001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@municipality.gov",
    "phone": "+1234567890",
    "role": "Guardian",
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749]
    },
    "createdAt": "2024-01-10T09:00:00Z"
  }
]
```

#### POST /login
Authenticate user and get JWT token

**Request Body:**
```json
{
  "email": "john.doe@municipality.gov",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j5",
    "email": "john.doe@municipality.gov",
    "role": "Guardian"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. WhatsApp Integration

#### POST /whatsapp
Twilio webhook for WhatsApp messages (no authentication required - handled by Twilio)

**Request Body:** (Handled by Twilio)
```
From=whatsapp:+1234567890
Body=Sewage leak on Main Street
MediaUrl0=https://api.twilio.com/...
Latitude=37.7749
Longitude=-122.4194
```

**Response:** TwiML XML (handled automatically)

## Data Models

### Incident
```javascript
{
  reporterPhone: String, // Required
  description: String,   // Required
  category: String,      // Enum: sewage, manhole_overflow, toilet_backup, pipe_burst, other
  priority: String,      // Enum: P0, P1, P2
  location: {
    type: String,        // Always "Point"
    coordinates: [Number, Number] // [longitude, latitude]
  },
  mediaUrls: [String],   // Array of media URLs
  status: String,        // Enum: reported, verified, in_progress, resolved
  guardianAssigned: ObjectId, // Reference to User
  sewageLossEstimate: Number,
  incidentNumber: String, // Auto-generated unique identifier
  createdAt: Date,
  updatedAt: Date
}
```

### Job Card
```javascript
{
  incident: ObjectId,    // Reference to Incident (required)
  team: ObjectId,        // Reference to Team (required)
  assignedBy: ObjectId,  // Reference to User (required)
  status: String,        // Enum: assigned, in_progress, completed, cancelled
  priority: String,      // Enum: P1, P2, P3
  description: String,   // Required
  location: {
    type: String,        // Always "Point"
    coordinates: [Number, Number] // [longitude, latitude] (required)
  },
  estimatedCompletion: Date,
  actualCompletion: Date,
  notes: [{
    text: String,
    addedBy: ObjectId,   // Reference to User
    timestamp: Date
  }],
  mediaUrls: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### User
```javascript
{
  userId: String,        // Required, unique
  first_name: String,    // Required
  last_name: String,     // Required
  email: String,         // Required, unique
  phone: String,
  role: String,          // Enum: Guardian, Manager, Admin
  password: String,      // Required (hashed)
  location: {
    type: String,        // Always "Point"
    coordinates: [Number, Number] // [longitude, latitude]
  },
  createdAt: Date
}
```

## Error Handling

All API responses follow this error format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing authentication)
- `404`: Not Found
- `500`: Internal Server Error

## Frontend Integration Examples

### JavaScript (Fetch API)

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
  }
  return data;
};

// Get incidents with authentication
const getIncidents = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/incidents', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};

// Update incident status
const updateIncident = async (incidentId, updates) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/incidents/${incidentId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  return await response.json();
};
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const useIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/incidents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setIncidents(data);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  return { incidents, loading, refetch: fetchIncidents };
};
```

### Mobile App Integration (React Native)

```javascript
// Incident reporting with location
import Geolocation from '@react-native-community/geolocation';

const reportIncident = async (description, imageUri) => {
  try {
    // Get current location
    const position = await new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(resolve, reject);
    });

    const formData = new FormData();
    formData.append('description', description);
    formData.append('latitude', position.coords.latitude.toString());
    formData.append('longitude', position.coords.longitude.toString());

    if (imageUri) {
      const image = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'incident.jpg'
      };
      formData.append('image', image);
    }

    const response = await fetch('/api/incidents/report', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    return await response.json();
  } catch (error) {
    console.error('Error reporting incident:', error);
    throw error;
  }
};
```

## Rate Limiting

- API requests are limited to 1000 per hour per IP
- WhatsApp webhooks have no rate limiting (handled by Twilio)

## WebSocket Support

Real-time updates are available via WebSocket connection:

```javascript
const ws = new WebSocket('ws://your-server:2000');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Handle real-time incident updates
  console.log('New incident:', update);
};
```

## Versioning

API versioning is handled via URL path: `/api/v1/...`

Current version: v1

## Support

For API support or questions:
- Email: api-support@iqembu-lamanzi.com
- Documentation: https://docs.iqembu-lamanzi.com
- Issues: https://github.com/iqembu-lamanzi/backend/issues