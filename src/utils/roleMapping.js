export const ROLE_MAPPING = {
  // Backend returns these role values
  'citizen': {
    dashboard: '/citizen/dashboard',
    userType: 'citizen',
    displayName: 'Citizen',
    permissions: ['view_own_incidents', 'create_incidents', 'update_own_profile']
  },
  'manager': {
    dashboard: '/manager/dashboard',
    userType: 'employee',
    displayName: 'Manager',
    permissions: ['manage_teams', 'allocate_jobs', 'view_all_incidents', 'manage_users']
  },
  'team leader': {
    dashboard: '/team-leader/dashboard',
    userType: 'employee',
    displayName: 'Team Leader',
    permissions: ['manage_team', 'update_job_progress', 'view_team_incidents']
  },
  'technician': {
    dashboard: '/technician/dashboard',
    userType: 'employee',
    displayName: 'Technician',
    permissions: ['update_job_progress', 'view_assigned_jobs']
  },
  'operator': {
    dashboard: '/operator/dashboard',
    userType: 'employee',
    displayName: 'Operator',
    permissions: ['view_assigned_jobs', 'update_job_status']
  },
  'admin': {
    dashboard: '/admin/dashboard',
    userType: 'admin',
    displayName: 'Administrator',
    permissions: ['*'] // Full access
  }
};

export function getRoleConfig(role) {
  return ROLE_MAPPING[role] || {
    dashboard: '/user/dashboard',
    userType: 'unknown',
    displayName: role,
    permissions: []
  };
}

export function getDashboardRoute(role) {
  return getRoleConfig(role).dashboard;
}