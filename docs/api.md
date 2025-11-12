# iqembulamanzi API Documentation

## Overview

This document provides comprehensive API documentation for the iqembulamanzi sewage incident management system. The API is organized into logical modules for incident management, job-card allocation, user management, and clerk dashboard operations.

## Base URL
```
http://localhost:2000/api
```

## Authentication

All API endpoints (except WhatsApp webhook) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Incident Management API

### **GET /api/incidents/unallocated**
Get all incidents that are not allocated to maintenance teams.

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "_id": "68e8b0d2acef979d5769c54e",
      "reporterPhone": "+27123456789",
      "description": "Test sewage overflow",
      "category": "manhole_overflow",
      "priority": "P1",
      "status": "open",
      "incidentNumber": "INC00024",
      "location": {
        "type": "Point",
        "coordinates": [28.0473, -26.2041]
      },
      "mediaUrls": [],
      "createdAt": "2025-10-10T07:08:02.803Z"
    }
  ]
}
```

### **GET /api/incidents/allocated**
Get all incidents that are allocated to maintenance teams.

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "_id": "690a2e160374fc7b234cd536",
      "reporterPhone": "+27838631381",
      "description": "User sent an image of a sewage issue",
      "category": "sewage",
      "priority": "P2",
      "status": "reported",
      "incidentNumber": "INC-0052",
      "guardianAssigned": {
        "_id": "68c83b5ec9837e5d71e6aee8",
        "userId": "USER001",
        "first_name": "Zee",
        "last_name": "Zee"
      },
      "location": {
        "type": "Point",
        "coordinates": [29.2385957, -25.8778302]
      },
      "mediaUrls": ["https://api.twilio.com/..."],
      "createdAt": "2025-11-04T16:47:18.260Z"
    }
  ]
}
```

### **POST /api/incidents/:id/allocate**
Allocate an incident to a maintenance team.

**Request Body:**
```json
{
  "teamId": "68c83b5ec9837e5d71e6aee8"
}
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "_id": "690a317fc8227f2ec4a79f10",
    "guardianAssigned": "68c83b5ec9837e5d71e6aee8",
    "status": "verified",
    "updatedAt": "2025-11-04T17:01:51.125Z"
  }
}
```

### **GET /api/incidents/heatmap**
Get incident data formatted for heatmap visualization.

**Response:**
```json
{
  "success": true,
  "heatmapData": [
    {
      "id": "68e8b0d2acef979d5769c54e",
      "lat": -26.2041,
      "lng": 28.0473,
      "category": "manhole_overflow",
      "priority": "P1",
      "status": "open",
      "incidentNumber": "INC00024",
      "createdAt": "2025-10-10T07:08:02.803Z"
    }
  ]
}
```

### **GET /api/incidents**
Get all incidents (authenticated users only).

**Query Parameters:**
- `status`: Filter by status (reported, verified, in_progress, resolved)
- `category`: Filter by category (sewage, manhole_overflow, etc.)
- `priority`: Filter by priority (P0, P1, P2)

### **PUT /api/incidents/:id**
Update incident status and details.

**Request Body:**
```json
{
  "status": "verified",
  "priority": "P0",
  "notes": "Incident verified on-site"
}
```

---

## 2. Job-Card Management API

### **POST /api/job-cards/allocate**
Create and allocate a job-card for an incident to a maintenance team.

**Request Body:**
```json
{
  "incidentId": "68e8b0d2acef979d5769c54e",
  "teamId": "68c83b5ec9837e5d71e6aee8",
  "priority": "high",
  "estimatedDuration": 120,
  "specialInstructions": "Handle with care - residential area"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job card allocated successfully",
  "data": {
    "_id": "690a317fc8227f2ec4a79f10",
    "incidentId": "68e8b0d2acef979d5769c54e",
    "teamId": "68c83b5ec9837e5d71e6aee8",
    "status": "assigned",
    "priority": "high",
    "estimatedDuration": 120,
    "assignedBy": "user123",
    "assignedAt": "2025-11-04T17:01:51.125Z",
    "specialInstructions": "Handle with care - residential area"
  }
}
```

### **GET /api/job-cards/team/:teamId**
Get all job-cards assigned to a specific maintenance team.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "690a317fc8227f2ec4a79f10",
      "incidentId": {
        "_id": "68e8b0d2acef979d5769c54e",
        "description": "Sewage overflow at main street",
        "location": {
          "type": "Point",
          "coordinates": [28.0473, -26.2041]
        },
        "incidentNumber": "INC00024"
      },
      "teamId": "68c83b5ec9837e5d71e6aee8",
      "status": "assigned",
      "priority": "high",
      "estimatedDuration": 120,
      "assignedAt": "2025-11-04T17:01:51.125Z",
      "startedAt": null,
      "completedAt": null
    }
  ]
}
```

### **PUT /api/job-cards/:id/status**
Update the status of a job-card (used by maintenance teams).

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Arrived at location, assessing damage",
  "location": {
    "lat": -26.2041,
    "lng": 28.0473
  }
}
```

**Valid Status Values:**
- `assigned`: Job-card assigned to team
- `in_progress`: Team started working
- `completed`: Job finished successfully
- `cancelled`: Job cancelled

**Response:**
```json
{
  "success": true,
  "message": "Job card status updated successfully",
  "data": {
    "_id": "690a317fc8227f2ec4a79f10",
    "status": "in_progress",
    "startedAt": "2025-11-04T17:15:30.000Z",
    "notes": "Arrived at location, assessing damage",
    "locationUpdates": [
      {
        "timestamp": "2025-11-04T17:15:30.000Z",
        "coordinates": [-26.2041, 28.0473],
        "status": "in_progress"
      }
    ]
  }
}
```

### **GET /api/job-cards/:id**
Get detailed information about a specific job-card.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "690a317fc8227f2ec4a79f10",
    "incidentId": {
      "_id": "68e8b0d2acef979d5769c54e",
      "description": "Sewage overflow",
      "location": {
        "type": "Point",
        "coordinates": [28.0473, -26.2041]
      }
    },
    "teamId": {
      "_id": "68c83b5ec9837e5d71e6aee8",
      "name": "Team Alpha",
      "leader": "John Doe"
    },
    "status": "in_progress",
    "priority": "high",
    "assignedAt": "2025-11-04T17:01:51.125Z",
    "startedAt": "2025-11-04T17:15:30.000Z",
    "locationUpdates": [
      {
        "timestamp": "2025-11-04T17:15:30.000Z",
        "coordinates": [-26.2041, 28.0473],
        "status": "in_progress"
      }
    ]
  }
}
```

### **GET /api/job-cards**
Get all job-cards with optional filtering.

**Query Parameters:**
- `status`: Filter by status (assigned, in_progress, completed, cancelled)
- `teamId`: Filter by team ID
- `priority`: Filter by priority (low, medium, high)
- `dateFrom`: Filter from date (ISO format)
- `dateTo`: Filter to date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "690a317fc8227f2ec4a79f10",
      "incidentId": "68e8b0d2acef979d5769c54e",
      "teamId": "68c83b5ec9837e5d71e6aee8",
      "status": "in_progress",
      "priority": "high",
      "assignedAt": "2025-11-04T17:01:51.125Z"
    }
  ]
}
```

---

## 3. User Management API

### **POST /users/submit**
Register a new user (legacy endpoint).

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@email.com",
  "phone": "+27123456789",
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

### **POST /users/login**
Authenticate user (basic authentication - no JWT).

**Request Body:**
```json
{
  "email": "john.doe@email.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "user": {
    "id": "68c83b5ec9837e5d71e6aee8",
    "email": "john.doe@email.com",
    "role": "Guardian"
  }
}
```

### **GET /users/users**
Get all users (no authentication required).

**Response:**
```json
[
  {
    "_id": "68c83b5ec9837e5d71e6aee8",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@email.com",
    "phone": "+27123456789",
    "role": "Guardian",
    "createdAt": "2025-09-15T16:14:22.691Z"
  }
]
```

---

## 4. WhatsApp Integration

### **POST /whatsapp**
Twilio WhatsApp webhook for incident reporting (no authentication required).

**Headers:**
```
X-Twilio-Signature: <signature>
Content-Type: application/x-www-form-urlencoded
```

**Supported Message Types:**

#### **Image Messages (Primary Flow):**
**Form Data:**
```
From: whatsapp:+27838631381
Body: Sewage overflow in my street
NumMedia: 1
MediaUrl0: https://api.twilio.com/...
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you! Your sewage incident has been reported (Number: INC-0053). A maintenance team will attend to it. To help us locate the issue faster, please share your location.</Message>
</Response>
```

#### **Location Messages:**
**Form Data:**
```
From: whatsapp:+27838631381
Latitude: -26.2041
Longitude: 28.0473
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you! Incident reported (Number: INC-0053). A maintenance team will attend to it.</Message>
</Response>
```

#### **Text Messages:**
**Form Data:**
```
From: whatsapp:+27838631381
Body: Sewage overflow in my street
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Incident reported and saved (Number: INC-0053)! To add your location, tap the attachment icon and select "Location".</Message>
</Response>
```

#### **Invalid Images:**
**Response for non-sewage images:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>This picture does not appear to be related to sewage issues. Please send a photo that shows a sewage leak, spill, or plumbing problem.</Message>
</Response>
```

---

## 5. Clerk Dashboard API Reference

The clerk dashboard provides comprehensive incident management capabilities for municipal clerks to allocate and track sewage incidents.

### **Core Dashboard Endpoints:**

#### **1. View Unallocated Incidents**
```javascript
GET /api/incidents/unallocated
// Returns incidents not assigned to maintenance teams
// No authentication required for clerk dashboard
```

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "_id": "68e8b0d2acef979d5769c54e",
      "reporterPhone": "+27123456789",
      "description": "Test sewage overflow",
      "category": "manhole_overflow",
      "priority": "P1",
      "status": "open",
      "incidentNumber": "INC00024",
      "location": {
        "type": "Point",
        "coordinates": [28.0473, -26.2041]
      },
      "mediaUrls": [],
      "createdAt": "2025-10-10T07:08:02.803Z"
    }
  ]
}
```

#### **2. View Allocated Incidents**
```javascript
GET /api/incidents/allocated
// Returns incidents assigned to maintenance teams
// No authentication required for clerk dashboard
```

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "_id": "690a2e160374fc7b234cd536",
      "reporterPhone": "+27838631381",
      "description": "User sent an image of a sewage issue",
      "guardianAssigned": {
        "_id": "68c83b5ec9837e5d71e6aee8",
        "userId": "USER001",
        "first_name": "Zee",
        "last_name": "Zee"
      },
      "status": "reported",
      "incidentNumber": "INC-0052"
    }
  ]
}
```

#### **3. Allocate Incident to Team**
```javascript
POST /api/incidents/:id/allocate
// Allocate incident to a maintenance team
// No authentication required for clerk dashboard
```

**Request Body:**
```json
{
  "teamId": "68c83b5ec9837e5d71e6aee8"
}
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "_id": "690a317fc8227f2ec4a79f10",
    "guardianAssigned": "68c83b5ec9837e5d71e6aee8",
    "status": "verified",
    "updatedAt": "2025-11-04T17:01:51.125Z"
  }
}
```

#### **4. View Heatmap Data**
```javascript
GET /api/incidents/heatmap
// Returns geographic incident data for map visualization
// No authentication required for clerk dashboard
```

**Response:**
```json
{
  "success": true,
  "heatmapData": [
    {
      "id": "68e8b0d2acef979d5769c54e",
      "lat": -26.2041,
      "lng": 28.0473,
      "category": "manhole_overflow",
      "priority": "P1",
      "status": "open",
      "incidentNumber": "INC00024",
      "createdAt": "2025-10-10T07:08:02.803Z"
    }
  ]
}
```

### **Dashboard Workflow:**

#### **1. Load Dashboard Data:**
```javascript
// Fetch all required data for dashboard
const loadDashboard = async () => {
  const [unallocated, allocated, heatmap] = await Promise.all([
    fetch('/api/incidents/unallocated').then(r => r.json()),
    fetch('/api/incidents/allocated').then(r => r.json()),
    fetch('/api/incidents/heatmap').then(r => r.json())
  ]);

  displayUnallocatedIncidents(unallocated.incidents);
  displayAllocatedIncidents(allocated.incidents);
  renderHeatmap(heatmap.heatmapData);
};
```

#### **2. Allocate Incidents:**
```javascript
const allocateIncident = async (incidentId, teamId) => {
  const response = await fetch(`/api/incidents/${incidentId}/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId })
  });

  if (response.ok) {
    // Refresh dashboard data
    await loadDashboard();
    showSuccessMessage('Incident allocated successfully');
  }
};
```

#### **3. Monitor Progress:**
- View allocated incidents with team assignments
- Track status updates from teams
- Monitor GPS location updates from field teams
- View completion status and timestamps

---

## Error Responses

All API endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### **Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (invalid/missing JWT token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

### **WhatsApp Error Responses:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, there was an error processing your message. Please try again.</Message>
</Response>
```

---

## Data Models

### **Incident Model:**
```javascript
{
  _id: ObjectId,
  reporterPhone: String,
  description: String,
  category: String, // 'sewage', 'manhole_overflow', etc.
  priority: String, // 'P0', 'P1', 'P2'
  status: String,   // 'reported', 'verified', 'in_progress', 'resolved'
  incidentNumber: String,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  mediaUrls: [String],
  guardianAssigned: ObjectId, // Reference to User/Team
  createdAt: Date,
  updatedAt: Date
}
```

### **Job-Card Model:**
```javascript
{
  _id: ObjectId,
  incidentId: ObjectId,     // Reference to Incident
  teamId: ObjectId,         // Reference to Team
  status: String,           // 'assigned', 'in_progress', 'completed', 'cancelled'
  priority: String,         // 'low', 'medium', 'high'
  estimatedDuration: Number, // in minutes
  assignedBy: ObjectId,     // Reference to User
  assignedAt: Date,
  startedAt: Date,
  completedAt: Date,
  locationUpdates: [{
    timestamp: Date,
    coordinates: [lat, lng],
    status: String
  }],
  notes: String,
  specialInstructions: String
}
```

---

## Rate Limiting

- WhatsApp messages: Limited by Twilio's daily quota
- API requests: No explicit rate limiting implemented
- ML processing: Sequential processing (one image at a time)

---

## Security Considerations

- JWT tokens expire after authentication
- Twilio webhook signatures are validated
- Passwords are hashed with bcrypt
- Input validation on all endpoints
- CORS configured for frontend access

---

## Testing

### **Unit Tests:**
```bash
npm test
```

### **API Testing:**

#### **Clerk Dashboard Routes:**
```bash
# Get unallocated incidents
curl http://localhost:2000/api/incidents/unallocated

# Get allocated incidents
curl http://localhost:2000/api/incidents/allocated

# Get heatmap data
curl http://localhost:2000/api/incidents/heatmap

# Allocate incident to team
curl -X POST http://localhost:2000/api/incidents/INC00001/allocate \
  -H "Content-Type: application/json" \
  -d '{"teamId": "68c83b5ec9837e5d71e6aee8"}'
```

#### **Job-Card Management:**
```bash
# Allocate job-card
curl -X POST http://localhost:2000/api/job-cards/allocate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"incidentId": "68e8b0d2acef979d5769c54e", "teamId": "68c83b5ec9837e5d71e6aee8"}'

# Get team job-cards
curl -H "Authorization: Bearer <token>" \
  http://localhost:2000/api/job-cards/team/68c83b5ec9837e5d71e6aee8

# Update job-card status
curl -X PUT http://localhost:2000/api/job-cards/123/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "notes": "Arrived at location"}'
```

#### **User Management:**
```bash
# Register user
curl -X POST http://localhost:2000/users/submit \
  -H "Content-Type: application/json" \
  -d '{"first_name": "John", "last_name": "Doe", "email": "john@example.com", "password": "password123", "role": "Guardian"}'

# Login user
curl -X POST http://localhost:2000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'

# Get all users
curl http://localhost:2000/users/users
```

#### **WhatsApp Testing:**
Send messages to your Twilio WhatsApp number:
- **Image**: Send a sewage-related photo
- **Location**: Share GPS coordinates
- **Text**: Send text description

---

## Support

For API support or questions:
- Check this documentation first
- Review server logs for error details
- Ensure proper authentication headers
- Verify request body format matches examples

---

*Last updated: November 4, 2025*
*API Version: 1.0.0*
