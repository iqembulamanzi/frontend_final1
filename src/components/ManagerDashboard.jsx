import React, { useState, useEffect } from 'react';
import {
  getManagerDashboardKPIs,
  getManagerDashboardTrends,
  getOperationsCenterData,
  getTeamsWithMetrics,
  getBudgetOverview,
  getPredictiveAnalytics,
  getPerformanceTrends,
  getUnassignedJobsForAssignment,
  assignJobToTeam
} from '../api';
import './ManagerDashboard.css';

const ManagerDashboard = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Role-based access control
  useEffect(() => {
    if (user !== 'manager') {
      // Redirect non-manager users
      window.location.href = '/';
      return;
    }
  }, [user]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load data with retry logic
  const loadDataWithRetry = async (apiCall, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt - 1);
        const data = await apiCall();
        setError(null);
        return data;
      } catch (err) {
        console.error(`API call failed (attempt ${attempt}/${maxRetries}):`, err);
        if (attempt === maxRetries) {
          setError(`Failed to load data after ${maxRetries} attempts. Please try again later.`);
          throw err;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview />;
      case 'operations':
        return <OperationsCenter />;
      case 'teams':
        return <TeamsManagement />;
      case 'reports':
        return <ReportsSection />;
      case 'budget':
        return <BudgetManagement />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <DashboardOverview />;
    }
  };

  // Don't render if user is not a manager
  if (user !== 'manager') {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to access the Manager Dashboard.</p>
        <button onClick={() => window.location.href = '/'}>Return to Home</button>
      </div>
    );
  }

  if (isMobile) {
    return <MobileManagerDashboard activeSection={activeSection} setActiveSection={setActiveSection} onLogout={onLogout} />;
  }

  return (
    <div className="manager-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <span className="notification-icon">🔔</span>
          <span className="header-title">Municipal Sewage Dept</span>
        </div>
        <div className="header-right">
          <span className="header-link">📊 Analytics</span>
          <span className="header-link">📅 Schedule</span>
          <span className="header-link">👤 Profile</span>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="main-navigation">
        <button
          className={activeSection === 'overview' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveSection('overview')}
        >
          📊 Overview
        </button>
        <button
          className={activeSection === 'operations' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveSection('operations')}
        >
          🚨 Operations
        </button>
        <button
          className={activeSection === 'teams' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveSection('teams')}
        >
          👥 Teams
        </button>
        <button
          className={activeSection === 'reports' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveSection('reports')}
        >
          📈 Reports
        </button>
        <button
          className={activeSection === 'budget' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveSection('budget')}
        >
          💰 Budget
        </button>
        <button
          className={activeSection === 'settings' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveSection('settings')}
        >
          ⚙ Settings
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Status Bar */}
      <footer className="status-bar">
        <span>System Status: Operational</span>
        <span>Last Updated: {new Date().toLocaleTimeString()}</span>
      </footer>
    </div>
  );
};

// Dashboard Overview Section
const DashboardOverview = () => {
  const [kpis, setKpis] = useState({
    activeIncidents: 142,
    highPriority: 23,
    resolutionRate: 89,
    avgResponseTime: 2.3,
    spentToday: 127000,
    uptime: 98.5
  });

  const [trendData, setTrendData] = useState([
    { day: 'M', incidents: 120 },
    { day: 'T', incidents: 95 },
    { day: 'W', incidents: 110 },
    { day: 'T', incidents: 105 },
    { day: 'F', incidents: 98 },
    { day: 'S', incidents: 85 },
    { day: 'S', incidents: 92 }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadKPIs = async () => {
      try {
        setLoading(true);
        const kpiData = await loadDataWithRetry(getManagerDashboardKPIs);
        setKpis(kpiData);
      } catch (err) {
        console.error('Failed to load KPIs:', err);
        // Keep default data on error
      } finally {
        setLoading(false);
      }
    };

    const loadTrends = async () => {
      try {
        const trendData = await loadDataWithRetry(() => getManagerDashboardTrends({ period: '7d' }));
        setTrendData(trendData);
      } catch (err) {
        console.error('Failed to load trends:', err);
        // Keep default data on error
      }
    };

    loadKPIs();
    loadTrends();
  }, []);

  return (
    <div className="dashboard-overview">
      <h2>🏛 Municipal Sewage Department - Dashboard</h2>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {loading && <div className="loading-indicator">Loading dashboard data...</div>}

      {/* Today's Summary */}
      <div className="summary-section">
        <h3>📊 Today Summary</h3>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-value">{kpis.activeIncidents}</div>
            <div className="kpi-label">Incidents Active</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{kpis.highPriority}</div>
            <div className="kpi-label">High Priority</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{kpis.resolutionRate}%</div>
            <div className="kpi-label">Resolution Rate</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{kpis.avgResponseTime}h</div>
            <div className="kpi-label">Avg Response</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">R{kpis.spentToday.toLocaleString()}</div>
            <div className="kpi-label">Spent Today</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{kpis.uptime}%</div>
            <div className="kpi-label">Uptime System</div>
          </div>
        </div>
      </div>

      {/* 7-Day Trend Analysis */}
      <div className="trend-section">
        <h3>📈 7-Day Trend Analysis</h3>
        <div className="trend-chart">
          <h4>Incidents Resolved</h4>
          <div className="chart-container">
            <div className="chart-bars">
              {trendData.map((data, index) => (
                <div key={index} className="chart-bar">
                  <div
                    className="bar-fill"
                    style={{ height: `${(data.incidents / 120) * 100}%` }}
                  ></div>
                  <div className="bar-label">{data.day}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">M  T  W  T  F  S  S</div>
        </div>
      </div>
    </div>
  );
};

const OperationsCenter = () => {
  const [incidents, setIncidents] = useState([
    { priority: 'Critical', reported: 3, inProgress: 2, completed: 5, total: 10, avgTime: '1.2h' },
    { priority: 'High', reported: 8, inProgress: 5, completed: 12, total: 25, avgTime: '2.8h' },
    { priority: 'Medium', reported: 15, inProgress: 12, completed: 28, total: 55, avgTime: '4.5h' },
    { priority: 'Low', reported: 22, inProgress: 18, completed: 34, total: 74, avgTime: '8.2h' }
  ]);

  const totalIncidents = incidents.reduce((acc, curr) => acc + curr.total, 0);
  const totalReported = incidents.reduce((acc, curr) => acc + curr.reported, 0);
  const totalInProgress = incidents.reduce((acc, curr) => acc + curr.inProgress, 0);
  const totalCompleted = incidents.reduce((acc, curr) => acc + curr.completed, 0);
  const avgTime = '4.7h'; // Calculated average

  return (
    <div className="operations-center">
      <h2>🚨 Operations Center - Real-Time Monitoring</h2>

      {/* Geographic View Placeholder */}
      <div className="geographic-view">
        <h3>🗺 Geographic View</h3>
        <div className="map-placeholder">
          <div className="map-content">
            <div className="incident-marker critical">🔴 Critical Incidents (5)</div>
            <div className="incident-marker in-progress">🟡 In Progress (12)</div>
            <div className="incident-marker completed">🟢 Completed Today (67)</div>
            <div className="incident-marker scheduled">🔵 Scheduled (3)</div>
          </div>
          <p className="map-note">(Interactive map with all incidents, teams, and facilities would be displayed here)</p>
        </div>
      </div>

      {/* Incident Status Matrix */}
      <div className="incident-matrix">
        <h3>📋 Incident Status Matrix</h3>
        <div className="matrix-table">
          <div className="table-header">
            <div>Priority</div>
            <div>Reported</div>
            <div>In Progress</div>
            <div>Completed</div>
            <div>Total</div>
            <div>Avg Time</div>
          </div>
          {incidents.map((incident, index) => (
            <div key={index} className="table-row">
              <div className={`priority ${incident.priority.toLowerCase()}`}>{incident.priority}</div>
              <div>{incident.reported}</div>
              <div>{incident.inProgress}</div>
              <div>{incident.completed}</div>
              <div>{incident.total}</div>
              <div>{incident.avgTime}</div>
            </div>
          ))}
          <div className="table-row total-row">
            <div>TOTAL</div>
            <div>{totalReported}</div>
            <div>{totalInProgress}</div>
            <div>{totalCompleted}</div>
            <div>{totalIncidents}</div>
            <div>{avgTime}</div>
          </div>
        </div>
      </div>

      {/* AssignJob for Team Managers */}
      <div className="assign-job-section">
        <h3>📋 AssignJob - Team Manager Interface</h3>

        {/* Search & Filter Jobs */}
        <div className="search-filter-section">
          <div className="search-bar">
            <input type="text" placeholder="Search Incident ID, Location, Priority..." />
            <button className="search-btn">🔍</button>
          </div>
          <div className="filters">
            <select>
              <option>All Priorities</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select>
              <option>All Status</option>
              <option>Unassigned</option>
              <option>Assigned</option>
              <option>In Progress</option>
            </select>
          </div>
        </div>

        {/* Job Assignment Panel */}
        <div className="job-assignment-panel">
          <h4>Available Jobs for Assignment</h4>
          <div className="jobs-list">
            {availableJobs.map((job, index) => (
              <div key={index} className="job-card">
                <div className="job-header">
                  <span className={`priority-badge ${job.priority.toLowerCase()}`}>
                    {job.priority}
                  </span>
                  <span className="job-id">{job.id}</span>
                </div>
                <div className="job-details">
                  <p><strong>Location:</strong> {job.location}</p>
                  <p><strong>Description:</strong> {job.description}</p>
                  <p><strong>Reported:</strong> {job.reportedTime}</p>
                </div>
                <div className="job-actions">
                  <button
                    className="assign-btn"
                    onClick={() => handleAssignJob(job)}
                  >
                    Assign Team
                  </button>
                  <button className="details-btn">Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment History */}
        <div className="assignment-history">
          <h4>📊 Assignment History & Tracking</h4>
          <div className="history-list">
            <div className="history-item">
              <span>INC-2023-0455: Assigned to Alpha Team (Completed)</span>
            </div>
            <div className="history-item">
              <span>INC-2023-0454: Assigned to Beta Team (In Progress)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Job Modal */}
      {showAssignJobModal && selectedJob && (
        <div className="modal-overlay">
          <div className="assign-modal">
            <div className="modal-header">
              <h3>Assign Job to Team</h3>
              <button
                className="close-btn"
                onClick={() => setShowAssignJobModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="job-details-modal">
                <h4>{selectedJob.id}</h4>
                <p><strong>Location:</strong> {selectedJob.location}</p>
                <p><strong>Description:</strong> {selectedJob.description}</p>
                <p><strong>Priority:</strong> {selectedJob.priority}</p>
              </div>
              <div className="available-teams">
                <h4>Available Teams</h4>
                <div className="teams-selection">
                  <div className="team-option">
                    <input type="radio" id="alpha" name="team" />
                    <label htmlFor="alpha">
                      <span className="team-name">Alpha Team</span>
                      <span className="team-status">(Available, 94% Efficiency)</span>
                    </label>
                  </div>
                  <div className="team-option">
                    <input type="radio" id="beta" name="team" />
                    <label htmlFor="beta">
                      <span className="team-name">Beta Team</span>
                      <span className="team-status">(Busy, 87% Efficiency)</span>
                    </label>
                  </div>
                  <div className="team-option">
                    <input type="radio" id="gamma" name="team" />
                    <label htmlFor="gamma">
                      <span className="team-name">Gamma Team</span>
                      <span className="team-status">(Available, 92% Efficiency)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="assign-selected-btn"
                  onClick={() => handleAssignToTeam('selected')}
                >
                  Assign Selected Teams
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setShowAssignJobModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TeamsManagement = () => {
  const [districts, setDistricts] = useState([
    {
      name: 'North District',
      teams: 15,
      operatingCapacity: 78,
      operationalEfficiency: 87
    },
    {
      name: 'Central District',
      teams: 18,
      operatingCapacity: 85,
      operationalEfficiency: 92
    },
    {
      name: 'South District',
      teams: 12,
      operatingCapacity: 72,
      operationalEfficiency: 83
    },
    {
      name: 'East District',
      teams: 16,
      operatingCapacity: 80,
      operationalEfficiency: 89
    },
    {
      name: 'West District',
      teams: 14,
      operatingCapacity: 75,
      operationalEfficiency: 84
    }
  ]);

  const [teamLeaderboard, setTeamLeaderboard] = useState([
    { name: 'Alpha Team', incidents: 156, avgResponse: '1.8h', efficiency: 97, rating: 'A+' },
    { name: 'Beta Team', incidents: 142, avgResponse: '2.1h', efficiency: 94, rating: 'A' },
    { name: 'Gamma Team', incidents: 138, avgResponse: '2.3h', efficiency: 92, rating: 'A' },
    { name: 'Delta Team', incidents: 129, avgResponse: '2.6h', efficiency: 89, rating: 'B+' },
    { name: 'Echo Team', incidents: 124, avgResponse: '2.8h', efficiency: 87, rating: 'B' }
  ]);

  // AssignJob integration for Team Managers
  const [showAssignJobModal, setShowAssignJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([
    {
      id: 'INC-2023-0456',
      location: 'Main St Bridge',
      priority: 'Critical',
      description: 'Sewage overflow',
      reportedTime: '2 hours ago'
    },
    {
      id: 'INC-2023-0457',
      location: 'Industrial Park',
      priority: 'High',
      description: 'Pipe burst',
      reportedTime: '45 minutes ago'
    }
  ]);

  const handleAssignJob = (job) => {
    setSelectedJob(job);
    setShowAssignJobModal(true);
  };

  const handleAssignToTeam = (teamId) => {
    // TODO: Implement API call to assign job to team
    console.log('Assigning job', selectedJob.id, 'to team', teamId);
    setShowAssignJobModal(false);
    setSelectedJob(null);
  };

  return (
    <div className="teams-management">
      <h2>👥 Teams & Resource Management</h2>

      {/* Organizational Overview */}
      <div className="organizational-overview">
        <h3>🏢 Organizational Overview</h3>
        <div className="districts-grid">
          {districts.map((district, index) => (
            <div key={index} className="district-card">
              <h4>{district.name}</h4>
              <div className="district-stats">
                <div className="stat-item">
                  <span className="stat-number">{district.teams}</span>
                  <span className="stat-label">Teams</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{district.operatingCapacity}%</span>
                  <span className="stat-label">OC</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{district.operationalEfficiency}%</span>
                  <span className="stat-label">Oper</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="legend">
          <span>OC = Operating Capacity</span>
          <span>Oper = Operational Efficiency</span>
        </div>
      </div>

      {/* Team Performance Analytics */}
      <div className="performance-analytics">
        <h3>📈 Team Performance Dashboard</h3>

        {/* Performance Metrics */}
        <div className="performance-metrics">
          <div className="metric-card">
            <h4>Response Time</h4>
            <div className="metric-bar">
              <div className="bar-fill response-time"></div>
            </div>
            <div className="metric-info">
              <span className="current">2.3h avg</span>
              <span className="target">Goal: 2.0h</span>
              <span className="variance warning">⚠ +0.3h</span>
            </div>
          </div>

          <div className="metric-card">
            <h4>Completion Rate</h4>
            <div className="metric-bar">
              <div className="bar-fill completion-rate"></div>
            </div>
            <div className="metric-info">
              <span className="current">94%</span>
              <span className="target">Goal: 90%</span>
              <span className="variance success">✅ +4%</span>
            </div>
          </div>

          <div className="metric-card">
            <h4>Cost Efficiency</h4>
            <div className="metric-bar">
              <div className="bar-fill cost-efficiency"></div>
            </div>
            <div className="metric-info">
              <span className="current">R2.50/m</span>
              <span className="target">Goal: R2.00/m</span>
              <span className="variance warning">⚠ +R0.50/m</span>
            </div>
          </div>
        </div>

        {/* Team Leaderboard */}
        <div className="team-leaderboard">
          <h4>🏆 Team Leaderboard (Current Month)</h4>
          <div className="leaderboard-table">
            <div className="table-header">
              <div>Rank</div>
              <div>Team Name</div>
              <div>Incidents</div>
              <div>Avg Response</div>
              <div>Efficiency</div>
              <div>Rating</div>
            </div>
            {teamLeaderboard.map((team, index) => (
              <div key={index} className="table-row">
                <div className="rank">{index + 1}</div>
                <div className="team-name">{team.name}</div>
                <div>{team.incidents}</div>
                <div>{team.avgResponse}</div>
                <div>{team.efficiency}%</div>
                <div className="rating">{team.rating}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportsSection = () => {
  const [analyticsData, setAnalyticsData] = useState({
    demandForecast: {
      expectedIncidents: '78-94 per day',
      highRiskAreas: 'Downtown (35%), Industrial (28%)',
      weatherImpact: 'Rain expected - incidents +15-25%'
    },
    recommendations: [
      'Deploy 2 additional teams Downtown (peak hours 2PM-6PM)',
      'Pre-position equipment in Industrial Park',
      'Schedule preventive maintenance for aging infrastructure'
    ]
  });

  const [performanceTrends, setPerformanceTrends] = useState([
    { month: 'Jan', responseTime: 2.1, completionRate: 89 },
    { month: 'Feb', responseTime: 2.3, completionRate: 92 },
    { month: 'Mar', responseTime: 2.0, completionRate: 94 },
    { month: 'Apr', responseTime: 2.4, completionRate: 91 },
    { month: 'May', responseTime: 2.3, completionRate: 94 }
  ]);

  const currentMonth = performanceTrends[performanceTrends.length - 1];
  const previousMonth = performanceTrends[performanceTrends.length - 2];

  return (
    <div className="advanced-analytics">
      <h2>📈 Advanced Analytics & Forecasting</h2>

      {/* Predictive Insights */}
      <div className="predictive-insights">
        <h3>🔮 Predictive Insights</h3>
        <div className="insights-card">
          <div className="forecast-section">
            <h4>📊 Demand Forecast (Next 7 Days)</h4>
            <div className="forecast-details">
              <p><strong>Expected Incidents:</strong> {analyticsData.demandForecast.expectedIncidents}</p>
              <p><strong>High Risk Areas:</strong> {analyticsData.demandForecast.highRiskAreas}</p>
              <p><strong>Weather Impact:</strong> {analyticsData.demandForecast.weatherImpact}</p>
            </div>
          </div>

          <div className="recommendations-section">
            <h4>⏰ Resource Planning Recommendations</h4>
            <ul className="recommendations-list">
              {analyticsData.recommendations.map((rec, index) => (
                <li key={index}>• {rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Performance Trends Analysis */}
      <div className="performance-trends">
        <h3>📊 Performance Trends Analysis</h3>
        <div className="trends-card">
          <h4>Monthly Efficiency Trends</h4>
          <div className="trends-table">
            <div className="table-header">
              <div></div>
              <div>Jan</div>
              <div>Feb</div>
              <div>Mar</div>
              <div>Apr</div>
              <div>May</div>
              <div>Trend</div>
            </div>
            <div className="table-row">
              <div className="metric-label">Response Time</div>
              <div>2.1h</div>
              <div>2.3h</div>
              <div>2.0h</div>
              <div>2.4h</div>
              <div className={currentMonth.responseTime > previousMonth.responseTime ? 'negative' : 'positive'}>
                {currentMonth.responseTime}h
              </div>
              <div className={currentMonth.responseTime > previousMonth.responseTime ? 'trend-negative' : 'trend-positive'}>
                {currentMonth.responseTime > previousMonth.responseTime ? '↗ +0.2h' : '↘ -0.1h'}
              </div>
            </div>
            <div className="table-row">
              <div className="metric-label">Completion Rate</div>
              <div>89%</div>
              <div>92%</div>
              <div>94%</div>
              <div>91%</div>
              <div className={currentMonth.completionRate >= previousMonth.completionRate ? 'positive' : 'negative'}>
                {currentMonth.completionRate}%
              </div>
              <div className={currentMonth.completionRate >= previousMonth.completionRate ? 'trend-positive' : 'trend-negative'}>
                ↗ +5%
              </div>
            </div>
            <div className="table-row target-row">
              <div className="metric-label">Target</div>
              <div>2.0h</div>
              <div>2.0h</div>
              <div>2.0h</div>
              <div>2.0h</div>
              <div>2.0h</div>
              <div>→</div>
            </div>
            <div className="table-row target-row">
              <div className="metric-label">Target</div>
              <div>90%</div>
              <div>90%</div>
              <div>90%</div>
              <div>90%</div>
              <div>90%</div>
              <div>→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BudgetManagement = () => {
  const [budgetData, setBudgetData] = useState({
    totalBudget: 2400000,
    spentToDate: 1847320,
    remaining: 552680,
    spentPercentage: 77
  });

  const [expenseBreakdown, setExpenseBreakdown] = useState([
    { category: 'Staff Salaries', allocated: 800000, spent: 620000, remaining: 180000, usage: 78 },
    { category: 'Equipment', allocated: 400000, spent: 315000, remaining: 85000, usage: 79 },
    { category: 'Fuel & Transport', allocated: 300000, spent: 235000, remaining: 65000, usage: 78 },
    { category: 'Maintenance', allocated: 200000, spent: 145000, remaining: 55000, usage: 73 },
    { category: 'Technology', allocated: 150000, spent: 112000, remaining: 38000, usage: 75 },
    { category: 'Admin & Other', allocated: 550000, spent: 420000, remaining: 130000, usage: 76 }
  ]);

  return (
    <div className="budget-management">
      <h2>💰 Budget & Financial Management</h2>

      {/* Monthly Budget Status */}
      <div className="budget-overview">
        <h3>📊 Monthly Budget Status</h3>
        <div className="budget-summary">
          <div className="budget-stats">
            <div className="stat-item">
              <span className="stat-label">Total Budget:</span>
              <span className="stat-value">R {budgetData.totalBudget.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Spent to Date:</span>
              <span className="stat-value spent">R {budgetData.spentToDate.toLocaleString()} ({budgetData.spentPercentage}%)</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Remaining:</span>
              <span className="stat-value remaining">R {budgetData.remaining.toLocaleString()} ({100 - budgetData.spentPercentage}%)</span>
            </div>
          </div>
          <div className="budget-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${budgetData.spentPercentage}%` }}
              ></div>
            </div>
            <div className="progress-labels">
              <span>Spent {budgetData.spentPercentage}%</span>
              <span>Remaining {100 - budgetData.spentPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown by Category */}
      <div className="expense-breakdown">
        <h3>💵 Expense Breakdown by Category</h3>
        <div className="expense-table">
          <div className="table-header">
            <div>Category</div>
            <div>Allocated</div>
            <div>Spent</div>
            <div>Remaining</div>
            <div>Usage %</div>
          </div>
          {expenseBreakdown.map((expense, index) => (
            <div key={index} className="table-row">
              <div className="category-cell">
                <span className="category-icon">
                  {expense.category === 'Staff Salaries' && '👷'}
                  {expense.category === 'Equipment' && '🚛'}
                  {expense.category === 'Fuel & Transport' && '⛽'}
                  {expense.category === 'Maintenance' && '🔧'}
                  {expense.category === 'Technology' && '📱'}
                  {expense.category === 'Admin & Other' && '📋'}
                </span>
                <span className="category-name">{expense.category}</span>
              </div>
              <div>R {expense.allocated.toLocaleString()}</div>
              <div>R {expense.spent.toLocaleString()}</div>
              <div>R {expense.remaining.toLocaleString()}</div>
              <div className="usage-cell">
                <div className="usage-bar">
                  <div
                    className="usage-fill"
                    style={{ width: `${expense.usage}%` }}
                  ></div>
                </div>
                <span className="usage-text">{expense.usage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsSection = () => (
  <div className="section-content">
    <h2>⚙ Settings</h2>
    <p>System configuration and user management will be displayed here.</p>
  </div>
);

// Mobile version with full features
const MobileManagerDashboard = ({ activeSection, setActiveSection, onLogout }) => {
  return (
    <div className="mobile-manager-dashboard">
      <header className="mobile-header">
        <span>🔔 Manager</span>
        <div className="mobile-header-icons">📊 📅 👤 ⚙</div>
      </header>
      <nav className="mobile-tabs">
        <button className={activeSection === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveSection('overview')}>🏛 Overview</button>
        <button className={activeSection === 'operations' ? 'tab active' : 'tab'} onClick={() => setActiveSection('operations')}>🚨 Ops</button>
        <button className={activeSection === 'teams' ? 'tab active' : 'tab'} onClick={() => setActiveSection('teams')}>👥 Teams</button>
      </nav>
      <main className="mobile-content">
        {activeSection === 'overview' && <MobileDashboardOverview />}
        {activeSection === 'operations' && <MobileOperationsCenter />}
        {activeSection === 'teams' && <MobileTeamsManagement />}
      </main>
      <footer className="mobile-actions">
        <span>📊</span>
        <span>🚨</span>
        <span>👥</span>
        <span>💰</span>
        <span>⚠</span>
        <span>Quick Actions</span>
      </footer>
    </div>
  );
};

// Mobile Dashboard Overview
const MobileDashboardOverview = () => {
  const [kpis, setKpis] = useState({
    activeIncidents: 23,
    highPriority: 7,
    resolutionRate: 85,
    spentToday: 12000
  });

  return (
    <div className="mobile-dashboard-overview">
      <div className="mobile-welcome">
        <h1>🏛 Manager Dashboard</h1>
        <p>Good morning, Director Smith! 👋</p>
        <div className="mobile-status">
          <span>📍 All Districts • 🌤 Light Rain</span>
        </div>
      </div>

      <div className="mobile-kpis">
        <h2>📊 Today's Critical Metrics</h2>
        <div className="mobile-kpi-grid">
          <div className="mobile-kpi-card">
            <div className="mobile-kpi-value">{kpis.activeIncidents}</div>
            <div className="mobile-kpi-label">Active Incidents</div>
          </div>
          <div className="mobile-kpi-card">
            <div className="mobile-kpi-value">{kpis.highPriority}</div>
            <div className="mobile-kpi-label">High Priority</div>
          </div>
          <div className="mobile-kpi-card">
            <div className="mobile-kpi-value">{kpis.resolutionRate}%</div>
            <div className="mobile-kpi-label">Rate Complete</div>
          </div>
          <div className="mobile-kpi-card">
            <div className="mobile-kpi-value">R{kpis.spentToday.toLocaleString()}</div>
            <div className="mobile-kpi-label">Spent Today</div>
          </div>
        </div>
      </div>

      <div className="mobile-alerts">
        <h2>🚨 Critical Alerts (2)</h2>
        <div className="mobile-alert-card">
          <div className="alert-header">
            <span className="alert-priority">🔴 P1</span>
            <span className="alert-title">Sewage overflow</span>
          </div>
          <div className="alert-details">
            <p>📍 Main St Bridge (2h ago)</p>
            <p>👥 Team Alpha • Status: Active</p>
          </div>
          <div className="alert-actions">
            <button className="alert-btn">📞 Respond</button>
            <button className="alert-btn">🗺 View</button>
            <button className="alert-btn">📋 Assign</button>
          </div>
        </div>

        <div className="mobile-alert-card">
          <div className="alert-header">
            <span className="alert-priority">🔴 P1</span>
            <span className="alert-title">Pipe burst</span>
          </div>
          <div className="alert-details">
            <p>📍 Industrial Park (45m ago)</p>
            <p>👥 Team Beta • Status: Enroute</p>
          </div>
          <div className="alert-actions">
            <button className="alert-btn">📞 Respond</button>
            <button className="alert-btn">🗺 View</button>
            <button className="alert-btn">📋 Assign</button>
          </div>
        </div>
      </div>

      <div className="mobile-performance">
        <h2>📈 Performance Snapshot</h2>
        <div className="mobile-performance-card">
          <p>Avg Response: 2.3h (↑ +0.3h)</p>
          <p>Completion Rate: 94% (↑ +4%)</p>
          <p>Budget Usage: 77% (On Track)</p>
        </div>
      </div>
    </div>
  );
};

// Mobile Operations Center
const MobileOperationsCenter = () => {
  return (
    <div className="mobile-operations">
      <div className="mobile-map-placeholder">
        <h2>🗺 Geographic View</h2>
        <div className="mobile-map-content">
          <p>🔴 Critical Incidents (5)</p>
          <p>🟡 In Progress (12)</p>
          <p>🟢 Completed Today (67)</p>
          <p>🔵 Scheduled (3)</p>
        </div>
      </div>

      <div className="mobile-incident-matrix">
        <h2>📋 Incident Status Matrix</h2>
        <div className="mobile-matrix-item">
          <span className="matrix-priority critical">Critical</span>
          <span className="matrix-count">3 reported, 2 in progress, 5 completed</span>
        </div>
        <div className="mobile-matrix-item">
          <span className="matrix-priority high">High</span>
          <span className="matrix-count">8 reported, 5 in progress, 12 completed</span>
        </div>
        <div className="mobile-matrix-item">
          <span className="matrix-priority medium">Medium</span>
          <span className="matrix-count">15 reported, 12 in progress, 28 completed</span>
        </div>
        <div className="mobile-matrix-item">
          <span className="matrix-priority low">Low</span>
          <span className="matrix-count">22 reported, 18 in progress, 34 completed</span>
        </div>
      </div>
    </div>
  );
};

// Mobile Teams Management
const MobileTeamsManagement = () => {
  const [teams, setTeams] = useState([
    {
      name: 'Alpha Team',
      location: 'Downtown',
      members: 5,
      activeIncidents: 2,
      efficiency: 94,
      status: 'active'
    },
    {
      name: 'Beta Team',
      location: 'Industrial',
      members: 4,
      activeIncidents: 3,
      efficiency: 87,
      status: 'busy'
    }
  ]);

  return (
    <div className="mobile-teams">
      <div className="mobile-teams-header">
        <h2>👥 Teams Overview (12 Teams)</h2>
        <div className="mobile-filters">
          <span>🔽Filter: All • District • Status</span>
        </div>
      </div>

      <div className="mobile-teams-list">
        {teams.map((team, index) => (
          <div key={index} className={`mobile-team-card ${team.status}`}>
            <div className="mobile-team-header">
              <div className={`mobile-team-status ${team.status}`}>
                {team.status === 'active' ? '🟢' : '🟡'} {team.name} ({team.status === 'active' ? 'Active' : 'Busy'})
              </div>
            </div>
            <div className="mobile-team-details">
              <p>📍 {team.location} • {team.members} Members</p>
              <p>🚨 {team.activeIncidents} Active • 📊 {team.efficiency}% Efficiency</p>
              <p>💰 R 15K/month • ⏱ 2.1h avg</p>
            </div>
            <div className="mobile-team-actions">
              <button className="mobile-action-btn">📞 Call</button>
              <button className="mobile-action-btn">👥 View</button>
              <button className="mobile-action-btn">📊 Stats</button>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile AssignJob */}
      <div className="mobile-assign-job">
        <h2>📋 AssignJob - Quick Assign</h2>
        <div className="mobile-search-bar">
          <input type="text" placeholder="🔍 Search Jobs" />
        </div>

        <div className="mobile-job-card">
          <div className="mobile-job-header">
            <span className="mobile-job-priority critical">🔴 INC-2023-0456</span>
            <span className="mobile-job-title">Sewage overflow</span>
          </div>
          <div className="mobile-job-details">
            <p>📍 Main St Bridge</p>
            <p>⏱ 2h ago</p>
          </div>
          <div className="mobile-job-teams">
            <p>Available Teams:</p>
            <div className="mobile-team-options">
              <span>🟢 Alpha (94%)</span>
              <span>🟡 Beta (87%)</span>
            </div>
          </div>
          <div className="mobile-job-actions">
            <button className="mobile-assign-btn">Assign</button>
            <button className="mobile-details-btn">Details</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;