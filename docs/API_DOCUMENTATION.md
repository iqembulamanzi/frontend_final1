# Iqembu Lamanzi API Documentation

## Overview

The Iqembu Lamanzi API provides comprehensive endpoints for sewage incident management, including incident reporting, job card management, user authentication, and geospatial data visualization. The API is designed for integration with web dashboards and mobile applications.

## Base Configuration

**Base URL:** `http://100.88.173.46:2000` (Tailscale) / `http://localhost:2000` (Local)

**API Version:** v1

**Authentication:** JWT Bearer Token

**Database:** PostgreSQL with PostGIS

**Real-time:** WebSocket notifications supported

**Content Type:** `application/json`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **Citizen**: Public users who can report incidents
- **Guardian**: Field maintenance personnel
- **Manager**: Team supervisors
- **Admin**: System administrators

## API Endpoints

### 1. Authentication & User Management

#### POST /api/users/login
User authentication with JWT token generation

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "Guardian",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### POST /api/users/logout
Logout current session and invalidate token

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/users/logout-all
Logout from all sessions across devices

**Response:**
```json
{
  "success": true,
  "message": "Logged out from all sessions"
}
```

#### POST /api/users/refresh-token
Refresh JWT token before expiration

**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "token": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

#### GET /api/users/profile
Get current user profile (role-based access)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Guardian",
    "phone": "+1234567890"
  }
}
```

#### PUT /api/users/profile
Update current user profile (field-level permissions apply)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

#### POST /api/users/submit
Public citizen registration (restricted to citizen role)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "role": "Citizen"
  }
}
```

#### POST /api/users/change-password
Change user password (requires current password verification)

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### GET /api/users/permissions
Get current user permissions and role information

**Response:**
```json
{
  "success": true,
  "permissions": [
    "read_incidents",
    "update_profile",
    "report_incidents"
  ],
  "role": "Guardian"
}
```

#### GET /api/users/me
Get current user information (alias for /profile)

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Guardian"
  }
}
```

#### GET /api/users/sessions
Get current user's active sessions (for security monitoring)

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "session-1",
      "device": "Chrome on Windows",
      "ip": "192.168.1.1",
      "location": "Johannesburg, South Africa",
      "lastActivity": "2024-01-15T12:00:00Z",
      "current": true
    }
  ]
}
```

#### POST /api/users/forgot-password
Request password reset (public endpoint with rate limiting)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST /api/users/reset-password
Reset password with token

**Request Body:**
```json
{
  "token": "reset-token",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### POST /api/users/verify-reset-token
Verify password reset token validity

**Request Body:**
```json
{
  "token": "reset-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "email": "user@example.com"
}
```

#### GET /api/users/health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "users",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### 4. Job Card Management (Team/Manager Access)

#### POST /api/job-cards/allocate/auto
Automatically allocate job card to best available team (System/Manager)

**Request Body:**
```json
{
  "incidentId": 1
}
```

**Response:**
```json
{
  "success": true,
  "jobCard": {
    "id": 1,
    "incidentId": 1,
    "teamId": 2,
    "status": "assigned",
    "allocatedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### POST /api/job-cards/allocate/batch
Batch allocate multiple incidents to teams (Manager/Admin only)

**Request Body:**
```json
{
  "allocations": [
    {
      "incidentId": 1,
      "teamId": 2
    },
    {
      "incidentId": 3,
      "teamId": 4
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "allocated": 2,
  "failed": 0,
  "results": [...]
}
```

#### PUT /api/job-cards/:id/status
Update job card status (Team Leader/Manager only)

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Started repair work"
}
```

**Response:**
```json
{
  "success": true,
  "jobCard": {
    "id": 1,
    "status": "in_progress",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

#### GET /api/job-cards
Get all job cards with filtering (Manager/Admin) or team job cards (Team members)

**Query Parameters:**
- `status`: Filter by status
- `team`: Filter by team ID
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "jobCards": [
    {
      "id": 1,
      "incidentId": 1,
      "teamId": 2,
      "status": "assigned",
      "priority": "P1",
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

#### GET /api/job-cards/:id
Get detailed job card information

**Response:**
```json
{
  "success": true,
  "jobCard": {
    "id": 1,
    "incident": {...},
    "team": {...},
    "status": "in_progress",
    "notes": [...],
    "progress": 75
  }
}
```

#### GET /api/job-cards/team/:teamId
Get all job cards for a specific team

**Response:**
```json
{
  "success": true,
  "jobCards": [...]
}
```

#### GET /api/job-cards/workload-stats
Get team workload statistics for allocation decisions (Manager/Admin)

**Response:**
```json
{
  "success": true,
  "stats": [
    {
      "teamId": 2,
      "teamName": "Team Alpha",
      "activeJobs": 5,
      "capacity": 10,
      "utilization": 50
    }
  ]
}
```

#### POST /api/job-cards/reassign/:id
Reassign job card to different team (Manager/Admin only)

**Request Body:**
```json
{
  "newTeamId": 3,
  "reason": "Better team availability"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job card reassigned successfully"
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

### 2. Citizen Incident Reporting

#### POST /api/citizen/incidents
Submit new incident report with automatic workflow triggering

**Request Body:**
```json
{
  "description": "Sewage leak on Main Street",
  "category": "sewage",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "images": ["base64-image-data"]
}
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "id": 1,
    "incidentNumber": "INC-2024-001",
    "status": "reported",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/citizen/incidents/:incidentId/images
Upload additional images to existing incident

**Request Body:**
```json
{
  "images": ["base64-image-data"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Images uploaded successfully"
}
```

#### GET /api/citizen/incidents
Get citizen's own incidents with status tracking

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "id": 1,
      "incidentNumber": "INC-2024-001",
      "description": "Sewage leak",
      "status": "in_progress",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:30:00Z"
    }
  ]
}
```

#### GET /api/citizen/incidents/:incidentId/status
Get detailed incident status and progress tracking

**Response:**
```json
{
  "success": true,
  "incident": {
    "id": 1,
    "status": "in_progress",
    "progress": 75,
    "assignedTeam": "Team Alpha",
    "estimatedCompletion": "2024-01-16T17:00:00Z",
    "lastUpdate": "2024-01-15T14:30:00Z"
  }
}
```

#### GET /api/citizen/categories
Get available incident categories with priority mapping

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "sewage",
      "name": "Sewage Issue",
      "priority": "P1",
      "description": "Sewage leaks, blockages, overflows"
    }
  ]
}
```

#### GET /api/citizen/public-stats
Get public incident statistics and transparency metrics

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalIncidents": 1250,
    "resolvedToday": 12,
    "averageResolutionTime": "4.2 hours",
    "activeTeams": 8
  }
}
```

#### GET /api/citizen/health
Health check for citizen app connectivity

**Response:**
```json
{
  "status": "healthy",
  "service": "citizen",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### 3. Incident Management (Employee/Manager Access)

#### GET /api/incidents
Get all incidents with role-based filtering and advanced search

**Query Parameters:**
- `status`: Filter by status
- `priority`: Filter by priority
- `team`: Filter by assigned team
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "id": 1,
      "incidentNumber": "INC-2024-001",
      "description": "Sewage leak",
      "status": "reported",
      "priority": "P1",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150
  }
}
```

#### PUT /api/incidents/:id
Update incident status and details (Manager/Admin only)

**Request Body:**
```json
{
  "status": "verified",
  "priority": "P0",
  "notes": "Incident verified and prioritized"
}
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "id": 1,
    "status": "verified",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### GET /api/incidents/pending
Get pending incidents awaiting verification (Manager/Admin)

**Response:**
```json
{
  "success": true,
  "incidents": [...]
}
```

#### GET /api/incidents/verified
Get verified incidents ready for allocation (Manager/Admin)

**Response:**
```json
{
  "success": true,
  "incidents": [...]
}
```

#### GET /api/incidents/map
Get incidents for Google Maps visualization with PostGIS data

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "id": 1,
      "latitude": 37.7749,
      "longitude": -122.4194,
      "status": "reported",
      "priority": "P1"
    }
  ]
}
```

#### GET /api/incidents/heatmap
Get incident data for heatmap visualization

**Response:**
```json
{
  "success": true,
  "heatmapData": [
    {
      "lat": 37.7749,
      "lng": -122.4194,
      "intensity": 5,
      "category": "sewage"
    }
  ]
}
```

#### GET /api/incidents/debug/all
Debug endpoint to view all incidents in database (Development only)

**Response:**
```json
{
  "success": true,
  "incidents": [...],
  "debug": {
    "totalCount": 150,
    "queryTime": "45ms"
  }
}
```

### 5. Webhook Endpoints (External Services)

#### POST /whatsapp
WhatsApp webhook for incoming incident reports

**Request Body:** (Handled by Twilio)
```
From=whatsapp:+1234567890
Body=Sewage leak on Main Street
MediaUrl0=https://api.twilio.com/...
Latitude=37.7749
Longitude=-122.4194
```

**Response:** TwiML XML (handled automatically)

#### POST /sms
SMS webhook for incoming incident reports

**Request Body:** (Handled by SMS provider)
```
From=+1234567890
Body=Sewage leak on Main Street
Latitude=37.7749
Longitude=-122.4194
```

**Response:** Success confirmation (handled automatically)

### 6. Reporting & Analytics (Protected)

#### GET /api/reports/operational
Get operational dashboard report

**Response:**
```json
{
  "success": true,
  "report": {
    "totalIncidents": 150,
    "resolvedToday": 12,
    "averageResolutionTime": "4.2 hours",
    "teamPerformance": [...]
  }
}
```

#### GET /api/reports/dashboard/stats
Get real-time dashboard statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "activeIncidents": 25,
    "pendingAllocation": 8,
    "completedToday": 12,
    "systemLoad": 65
  }
}
```

#### GET /api/reports/team-performance
Get team performance reports

**Response:**
```json
{
  "success": true,
  "teams": [
    {
      "teamId": 2,
      "teamName": "Team Alpha",
      "efficiency": 92.5,
      "averageResolutionTime": "3.2 hours",
      "jobsCompleted": 45
    }
  ]
}
```

### 7. Team Management (Manager/Admin Access)

#### GET /api/teams
Get all teams with filtering and pagination

**Query Parameters:**
- `specialization`: Filter by specialization
- `status`: Filter by status
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "teams": [
    {
      "id": 2,
      "name": "Team Alpha",
      "specialization": "sewage",
      "memberCount": 5,
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8
  }
}
```

#### POST /api/teams
Create new team (Manager/Admin only)

**Request Body:**
```json
{
  "name": "New Team",
  "description": "Team description",
  "specialization": "sewage"
}
```

**Response:**
```json
{
  "success": true,
  "team": {
    "id": 3,
    "name": "New Team",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### GET /api/teams/:id
Get detailed team information

**Response:**
```json
{
  "success": true,
  "team": {
    "id": 2,
    "name": "Team Alpha",
    "members": [...],
    "performance": {...}
  }
}
```

#### PUT /api/teams/:id
Update team information (Manager/Admin only)

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team updated successfully"
}
```

#### DELETE /api/teams/:id
Delete team (Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Team deleted successfully"
}
```

#### POST /api/teams/:id/members
Add member to team (Manager/Admin only)

**Request Body:**
```json
{
  "userId": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member added successfully"
}
```

#### DELETE /api/teams/:id/members/:memberId
Remove member from team (Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

#### PUT /api/teams/:id/leader
Set team leader (Manager/Admin only)

**Request Body:**
```json
{
  "leaderId": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team leader updated successfully"
}
```

#### GET /api/teams/dashboard-summary
Get dashboard summary for managers (Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalTeams": 8,
    "activeTeams": 7,
    "totalMembers": 45,
    "averageUtilization": 78
  }
}
```

#### GET /api/teams/available-users
Get users available for team assignment (Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 5,
      "firstName": "John",
      "lastName": "Doe",
      "role": "Guardian"
    }
  ]
}
```

#### GET /api/teams/statistics
Get comprehensive team statistics (Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalTeams": 8,
    "activeMembers": 45,
    "utilizationRate": 78,
    "performanceMetrics": [...]
  }
}
```

#### GET /api/teams/workload-analysis
Get team workload analysis (Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "analysis": [
    {
      "teamId": 2,
      "currentWorkload": 5,
      "capacity": 10,
      "utilization": 50
    }
  ]
}
```

#### GET /api/teams/recommendations
Get team management recommendations (Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "type": "workload_balance",
      "message": "Consider reassigning jobs from Team Alpha",
      "priority": "medium"
    }
  ]
}
```

#### GET /api/teams/by-specialization/:specialization
Get teams by specialization (Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "teams": [...]
}
```

#### GET /api/teams/:id/performance
Get team performance metrics (Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "performance": {
    "efficiency": 92.5,
    "averageResolutionTime": "3.2 hours",
    "jobsCompleted": 45,
    "qualityScore": 4.8
  }
}
```

#### GET /api/teams/:id/performance-metrics
Get detailed performance metrics (Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "metrics": {
    "monthly": [...],
    "weekly": [...],
    "daily": [...]
  }
}
```

#### POST /api/teams/:id/bulk-add-members
Bulk add members to team (Manager/Admin only)

**Request Body:**
```json
{
  "userIds": [5, 6, 7]
}
```

**Response:**
```json
{
  "success": true,
  "added": 3,
  "message": "Members added successfully"
}
```

#### DELETE /api/teams/:id/bulk-remove-members
Bulk remove members from team (Manager/Admin only)

**Request Body:**
```json
{
  "userIds": [5, 6]
}
```

**Response:**
```json
{
  "success": true,
  "removed": 2,
  "message": "Members removed successfully"
}
```

#### GET /api/teams/:id/incidents/available
Get available incidents for team assignment (Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "id": 1,
      "description": "Sewage leak",
      "priority": "P1",
      "distance": 2.5,
      "suitability": 0.9
    }
  ]
}
```

#### POST /api/teams/:id/incidents/assign
Manually assign incident to team (Manager/Admin only)

**Request Body:**
```json
{
  "incidentId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Incident assigned successfully"
}
```

### 8. Progress Tracking (Team/Manager Access)

#### PUT /api/progress/:id/progress
Update progress for a specific job card

**Request Body:**
```json
{
  "progress": 75,
  "notes": "Work in progress",
  "status": "in_progress"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progress updated successfully"
}
```

#### GET /api/progress/:id/progress/history
Get progress history for a job card

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "progress": 25,
      "status": "assigned",
      "notes": "Job started",
      "timestamp": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### GET /api/progress/:id/progress/summary
Get progress summary for a job card

**Response:**
```json
{
  "success": true,
  "summary": {
    "currentProgress": 75,
    "status": "in_progress",
    "estimatedCompletion": "2024-01-16T17:00:00Z",
    "timeSpent": "3.5 hours"
  }
}
```

#### GET /api/progress/:id/progress/timeline
Get progress timeline for chronological view

**Response:**
```json
{
  "success": true,
  "timeline": [
    {
      "date": "2024-01-15",
      "progress": 75,
      "events": [...]
    }
  ]
}
```

#### GET /api/progress/teams/:id/progress
Get progress for all job cards of a team

**Response:**
```json
{
  "success": true,
  "teamProgress": [
    {
      "jobCardId": 1,
      "progress": 75,
      "status": "in_progress"
    }
  ]
}
```

#### POST /api/progress/batch
Batch update progress for multiple job cards

**Request Body:**
```json
{
  "updates": [
    {
      "jobCardId": 1,
      "progress": 100,
      "status": "completed"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated": 1,
  "message": "Batch progress update completed"
}
```

#### GET /api/progress/analytics
Get progress analytics for managers

**Response:**
```json
{
  "success": true,
  "analytics": {
    "averageCompletionTime": "4.2 hours",
    "efficiency": 92.5,
    "bottlenecks": [...]
  }
}
```

#### GET /api/progress/dashboard
Get real-time progress dashboard data

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "activeJobs": 25,
    "completedToday": 12,
    "averageProgress": 68,
    "teamPerformance": [...]
  }
}
```

### 9. Notifications (All Authenticated Users)

#### GET /api/notification-test/test-get-notifications/:userId
Get user notifications (Test endpoint)

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "incident_assigned",
      "message": "New incident assigned to your team",
      "read": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/notification-test/test-send-notification
Send test notification (Test endpoint)

**Request Body:**
```json
{
  "userId": 1,
  "type": "test",
  "message": "Test notification"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test notification sent"
}
```

### 10. Admin & Fraud Prevention (Admin Only)

#### GET /api/admin/fraud-prevention/config
Get fraud prevention configuration

**Response:**
```json
{
  "success": true,
  "config": {
    "proximityThreshold": 100,
    "imageVerificationEnabled": true,
    "phoneBlockingEnabled": true,
    "autoBlockThreshold": 3
  }
}
```

#### PUT /api/admin/fraud-prevention/config
Update fraud prevention configuration

**Request Body:**
```json
{
  "proximityThreshold": 150,
  "imageVerificationEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated successfully"
}
```

#### GET /api/admin/fraud-prevention/statistics
Get fraud prevention statistics

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalIncidents": 1000,
    "fraudulentIncidents": 45,
    "blockedPhones": 12,
    "proximityAlerts": 23
  }
}
```

#### GET /api/admin/fraud-prevention/logs
Get fraud prevention event logs

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date
- `type`: Filter by event type

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "type": "proximity",
      "incidentId": 1,
      "phoneNumber": "+1234567890",
      "confidence": 0.95,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/admin/fraud-prevention/test-proximity
Test proximity detection

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "isFraudulent": false,
  "confidence": 0.1
}
```

#### POST /api/admin/fraud-prevention/test-image-verification
Test image verification

**Request Body:**
```json
{
  "image": "base64-image-data"
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "confidence": 0.87
}
```

#### GET /api/admin/fraud-prevention/blocked-phones
Get blocked phone numbers

**Response:**
```json
{
  "success": true,
  "blockedPhones": [
    {
      "phoneNumber": "+1234567890",
      "blockedAt": "2024-01-15T10:00:00Z",
      "reason": "Fraudulent activity"
    }
  ]
}
```

#### POST /api/admin/fraud-prevention/block-phone
Block a phone number

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "reason": "Fraudulent reports"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number blocked successfully"
}
```

#### DELETE /api/admin/fraud-prevention/block-phone/:phoneNumber
Unblock a phone number

**Response:**
```json
{
  "success": true,
  "message": "Phone number unblocked successfully"
}
```

## Important Notes

### Security
• Always store JWT tokens securely (not in localStorage for production)
• Use HTTPS in production environments
• Implement proper token refresh logic
• Validate all inputs on frontend and backend

### Rate Limiting
• Registration: 5 attempts per 15 minutes
• Login: 10 attempts per 15 minutes
• Password reset: 3 attempts per hour
• General API: 100 requests per 15 minutes per IP

### File Upload Limits
• Maximum 5 images per incident
• 10MB file size limit per image
• Only image files allowed (jpeg, png, gif, webp)

### Pagination
All list endpoints support pagination:
• `page`: Page number (default: 1)
• `limit`: Items per page (default: 10, max: 100)

Last Updated: 2025-11-17
API Version: v1
Backend URL: http://10.5.34.224:2000

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