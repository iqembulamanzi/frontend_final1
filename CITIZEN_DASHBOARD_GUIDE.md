# Citizen Dashboard Implementation Guide

## Overview

This guide explains how to implement a role-based dashboard system for citizens in the SewerWatch application. Citizens should only have access to their own data and basic reporting functionality, without administrative privileges.

## Problem Statement

Citizens can log in successfully but cannot view the dashboard because the application attempts to fetch `/api/users` (all users list), which returns 403 Forbidden since citizens don't have `user:view_all` permission.

## Solution Architecture

### Key Components

1. **Role-Based Dashboard Component** - Conditionally loads different data based on user role
2. **CitizenDashboard Component** - Shows only citizen-accessible data
3. **API Service Updates** - Handles 403 errors gracefully and provides role-specific methods
4. **Protected Routes** - Ensures users only access pages they have permission for

### Citizen Permissions

**What Citizens CAN Access:**
- ✅ GET `/api/users/:id` (own profile only)
- ✅ GET `/api/citizen/incidents` (own incidents)
- ✅ POST `/api/citizen/incidents` (create incidents)
- ✅ PUT `/api/users/:id` (update own profile)

**What Citizens CANNOT Access:**
- ❌ GET `/api/users` (all users - returns 403)
- ❌ GET `/api/teams` (team management)
- ❌ Admin endpoints

## Implementation Steps

### 1. Update API Service (`src/api.js`)

Add citizen-specific endpoints and 403 error handling:

```javascript
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

export const getUserProfile = async (userId) => {
  return makeRequest(`/users/${userId}`);
};

export const updateUserProfile = async (userId, updates) => {
  return makeRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};
```

Add 403 error handling in `makeRequest` function:

```javascript
if (response.status === 403) {
  // Forbidden - user doesn't have permission
  // Return empty data instead of throwing for graceful handling
  console.warn(`Access forbidden for endpoint: ${url}`);
  return { data: [], message: 'Access denied', status: 403 };
}
```

### 2. Update UserDashboard Component (`src/components/UserDashboard.jsx`)

Replace mock data with real API calls:

```javascript
// Load citizen incidents
const incidents = await getCitizenIncidents();
setMyReports(incidents.data || incidents || []);

// Load user profile
const profile = await getUserProfile(userId);
if (profile && profile.name) {
  setUserDetails(prev => ({
    ...prev,
    name: profile.name,
    // ... other profile fields
  }));
}
```

Add statistics section and quick actions:

```javascript
const renderStatsSection = () => (
  <div className="stats-section">
    <div className="stats-grid">
      {/* Total Reports, Resolved, Pending, Avg Response Time */}
    </div>
    <div className="quick-actions">
      {/* Report New Incident, View My Reports, Update Profile */}
    </div>
  </div>
);
```

### 3. Update Routing Protection

Ensure only citizens can access the user dashboard:

```javascript
useEffect(() => {
  if (user !== "user") {
    navigate("/");
  }
}, [user, navigate]);
```

### 4. CSS Styling

Add styles for the statistics section in `UserDashboard.css`:

```css
.stats-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
```

## Testing Instructions

### 1. Login as Citizen
- Navigate to the application
- Login with citizen credentials
- Verify redirect to `/user` dashboard

### 2. Test Dashboard Features
- **Statistics Section**: Verify stats display correctly
- **Report Incident**: Test creating new incidents
- **View Reports**: Check own incident history
- **Profile**: Verify profile information loads

### 3. Test Permission Restrictions
- Attempt to access admin routes (should redirect)
- Verify 403 errors are handled gracefully
- Confirm no admin functionality is accessible

### 4. API Testing
- Monitor network requests during dashboard load
- Verify only citizen-allowed endpoints are called
- Check error handling for forbidden requests

## Security Considerations

1. **Client-Side Protection**: Always implement server-side validation
2. **Token Management**: Ensure tokens are validated on each request
3. **Error Handling**: Never expose sensitive information in error messages
4. **Route Protection**: Implement guards on all protected routes

## Future Enhancements

1. **Real-time Notifications**: WebSocket integration for incident updates
2. **Offline Support**: Service worker for offline incident reporting
3. **Advanced Statistics**: Charts and graphs for incident trends
4. **Mobile App**: Native mobile application for citizens

## Troubleshooting

### Common Issues

1. **403 Errors on Dashboard Load**
   - Check user role in localStorage
   - Verify API endpoints are citizen-specific
   - Ensure 403 handling is implemented

2. **Empty Dashboard**
   - Check network requests in browser dev tools
   - Verify API responses are properly parsed
   - Check for JavaScript errors in console

3. **Redirect Loops**
   - Verify role checking logic in useEffect
   - Check App.jsx routing configuration
   - Ensure user state is properly managed

### Debug Steps

1. Open browser developer tools
2. Check Network tab for API calls
3. Check Console tab for JavaScript errors
4. Check Application tab for localStorage values
5. Verify user role and token validity

## Conclusion

This implementation provides a secure, role-based dashboard system that respects RBAC permissions while offering citizens a functional interface for community reporting. The solution handles permission errors gracefully and ensures users only access appropriate data.