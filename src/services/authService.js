import { apiClient } from '../api/client';
import { getDashboardRoute } from '../utils/roleMapping';

export class AuthService {
  async login(email, password) {
    try {
      const response = await apiClient.post('/users/login', {
        email,
        password
      });

      if (response.success) {
        // Store authentication data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('permissions', JSON.stringify(response.permissions));

        // Determine correct dashboard route
        const dashboardRoute = getDashboardRoute(response.user.role);

        return {
          success: true,
          user: response.user,
          permissions: response.permissions,
          dashboardRoute
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await apiClient.post('/users/logout', {});
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
    }
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  async refreshToken() {
    const response = await apiClient.post('/users/refresh-token', {});

    if (response.success) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    }

    throw new Error('Token refresh failed');
  }
}

export const authService = new AuthService();