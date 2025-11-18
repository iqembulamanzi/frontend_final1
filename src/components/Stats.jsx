import React, { useState, useEffect, useRef } from 'react';
import { getIncidents, getUsers, getIncidentsForMap } from '../api';
import { Loader } from "@googlemaps/js-api-loader";

const Stats = () => {
  const [statsData, setStatsData] = useState({
    barChartData: [],
    donutChartData: [],
    totalReports: 0,
    activeTeams: 0,
    avgQualityScore: 0,
    fieldWorkers: 0,
    heatmapData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real data from API
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [incidents, users, mapIncidents] = await Promise.all([
          getIncidents(),
          getUsers(),
          getIncidentsForMap()
        ]);

        // Process incidents by month for bar chart
        const incidentsByMonth = {};
        incidents.forEach(incident => {
          const date = new Date(incident.createdAt);
          const monthKey = date.toLocaleString('default', { month: 'short' });
          incidentsByMonth[monthKey] = (incidentsByMonth[monthKey] || 0) + 1;
        });

        const barChartData = Object.entries(incidentsByMonth).map(([month, count]) => ({
          name: month,
          value: count
        }));

        // Process incidents by category for donut chart
        const categoryStats = {};
        incidents.forEach(incident => {
          const category = incident.category || 'other';
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        });

        const colors = ['#0284c7', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
        const donutChartData = Object.entries(categoryStats).map(([label, value], index) => ({
          label: label.charAt(0).toUpperCase() + label.slice(1).replace('_', ' '),
          value,
          color: colors[index % colors.length]
        }));

        // Calculate metrics
        const guardians = users.filter(user => user.role === 'Guardian');
        const activeIncidents = incidents.filter(incident =>
          ['reported', 'verified', 'in_progress'].includes(incident.status)
        );

        setStatsData({
          barChartData,
          donutChartData,
          totalReports: incidents.length,
          activeTeams: guardians.length,
          avgQualityScore: 7.8, // This would need to be calculated from actual quality metrics
          fieldWorkers: guardians.length,
          activeIncidentsCount: activeIncidents.length, // Use the calculated value
          heatmapData: mapIncidents.incidents || []
        });

      } catch (err) {
        console.error('Error fetching stats data:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, []);

  const { barChartData, donutChartData, totalReports, activeTeams, avgQualityScore, fieldWorkers, heatmapData } = statsData;

  // Function to create a simple bar chart using SVG
  const BarChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value));
    const barWidth = 40;
    const barSpacing = 20;
    const chartHeight = 200;
    const chartWidth = data.length * (barWidth + barSpacing);

    return (
      <svg width="100%" height={chartHeight + 30} viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} preserveAspectRatio="xMidYMid meet">
        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map(val => (
          <text key={val} x="-5" y={chartHeight - (val / 100) * chartHeight} textAnchor="end" fontSize="12" fill="#6b7280">
            {val}
          </text>
        ))}
        {/* Bars */}
        {data.map((d, i) => (
          <React.Fragment key={d.name}>
            <rect
              x={i * (barWidth + barSpacing)}
              y={chartHeight - (d.value / maxVal) * chartHeight}
              width={barWidth}
              height={(d.value / maxVal) * chartHeight}
              fill="#3b82f6"
              rx="5"
              ry="5"
            />
            <text
              x={i * (barWidth + barSpacing) + barWidth / 2}
              y={chartHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
            >
              {d.name}
            </text>
          </React.Fragment>
        ))}
      </svg>
    );
  };

  // Function to create a simple donut chart using SVG
  const DonutChart = ({ data, size = 200, strokeWidth = 30 }) => {
    const sum = data.reduce((acc, curr) => acc + curr.value, 0);
    let cumulative = 0;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={(size - strokeWidth) / 2} fill="transparent" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        {data.map((d, i) => {
          const circumference = (size - strokeWidth) * Math.PI;
          const offset = circumference * (1 - d.value / sum);
          const dasharray = `${circumference - offset} ${offset}`;
          const rotate = (cumulative / sum) * 360;
          cumulative += d.value;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={(size - strokeWidth) / 2}
              fill="transparent"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              strokeDashoffset={circumference}
              transform={`rotate(${rotate} ${size / 2} ${size / 2})`}
            />
          );
        })}
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="24" fill="#333" fontWeight="bold">
          {Math.round(donutChartData[0]?.value / sum * 100) || 0}%
        </text>
        <text x="50%" y="70%" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#6b7280">
          {donutChartData[0]?.label || 'No Data'}
        </text>
      </svg>
    );
  };

  // Google Maps component for incident visualization
  const IncidentMap = ({ heatmapData }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [googleMaps, setGoogleMaps] = useState(null);

    useEffect(() => {
      const initMap = async () => {
        try {
          const loader = new Loader({
            apiKey: "AIzaSyDUMMY_API_KEY", // Replace with actual Google Maps API key
            version: "weekly",
          });

          const [mapsLibrary] = await Promise.all([
            loader.importLibrary("maps"),
          ]);

          setGoogleMaps(mapsLibrary);

          // Default center coordinates (Johannesburg area)
          const center = { lat: -26.2041, lng: 28.0473 };

          const mapInstance = new mapsLibrary.Map(mapRef.current, {
            center: center,
            zoom: 10,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });

          setMap(mapInstance);
        } catch (error) {
          console.error("Error loading Google Maps:", error);
        }
      };

      initMap();
    }, []);

    useEffect(() => {
      if (!map || !heatmapData || !googleMaps) return;

      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));

      const newMarkers = heatmapData.map((incident) => {
        const position = { lat: incident.lat, lng: incident.lng };

        // Determine marker color based on status
        let markerColor = '#FF0000'; // Default red for open
        if (incident.status === 'verified') markerColor = '#FFA500'; // Orange
        else if (incident.status === 'resolved') markerColor = '#00FF00'; // Green

        const marker = new googleMaps.Marker({
          position: position,
          map: map,
          title: `Incident ${incident.incidentNumber}`,
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            fillColor: markerColor,
            fillOpacity: 0.8,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 12,
          },
        });

        // Create info window
        const infoWindow = new googleMaps.InfoWindow({
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 250px;">
              <h4 style="margin: 0 0 8px 0; color: #1f2937;">${incident.incidentNumber}</h4>
              <p style="margin: 4px 0;"><strong>Status:</strong> ${incident.status}</p>
              <p style="margin: 4px 0;"><strong>Priority:</strong> ${incident.priority}</p>
              <p style="margin: 4px 0;"><strong>Category:</strong> ${incident.category || 'Unknown'}</p>
              <p style="margin: 4px 0;"><strong>Description:</strong> ${incident.description || 'No description'}</p>
              <p style="margin: 4px 0;"><strong>Reported:</strong> ${new Date(incident.createdAt).toLocaleString()}</p>
              ${incident.reporterPhone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${incident.reporterPhone}</p>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        return marker;
      });

      setMarkers(newMarkers);

      // Fit map to show all markers
      if (newMarkers.length > 0) {
        const bounds = new googleMaps.LatLngBounds();
        newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds);

        // Don't zoom in too much for single points
        const listener = googleMaps.event.addListener(map, "idle", () => {
          if (map.getZoom() > 15) map.setZoom(15);
          googleMaps.event.removeListener(listener);
        });
      }
    }, [map, heatmapData, markers, googleMaps]);

    return (
      <div style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {!map && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            backgroundColor: '#f3f4f6',
            color: '#6b7280'
          }}>
            Loading Google Maps...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 min-h-screen">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center tracking-tight sm:text-5xl">
          Project Statistics
        </h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {loading && <div className="text-center">Loading statistics...</div>}

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="bg-white p-6 rounded-xl shadow-lg transform transition duration-500 hover:scale-105">
            <h3 className="text-xl font-semibold text-gray-600">Total Reports</h3>
            <p className="text-5xl font-bold text-blue-600 mt-2">{totalReports}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg transform transition duration-500 hover:scale-105">
            <h3 className="text-xl font-semibold text-gray-600">Active Teams</h3>
            <p className="text-5xl font-bold text-green-600 mt-2">{activeTeams}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg transform transition duration-500 hover:scale-105">
            <h3 className="text-xl font-semibold text-gray-600">Avg. Quality Score</h3>
            <p className="text-5xl font-bold text-yellow-500 mt-2">{avgQualityScore}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg transform transition duration-500 hover:scale-105">
            <h3 className="text-xl font-semibold text-gray-600">Field Workers</h3>
            <p className="text-5xl font-bold text-purple-600 mt-2">{fieldWorkers}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Reports Over Time</h3>
            <div className="flex justify-center items-center">
              <BarChart data={barChartData} />
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Top Pollutants</h3>
            <div className="flex justify-center items-center">
              <DonutChart data={donutChartData} />
            </div>
            {/* Legend for the donut chart */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {donutChartData.map((d, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-sm text-gray-700">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Incident Locations Map</h3>
          <div className="flex justify-center items-center">
            <IncidentMap heatmapData={heatmapData} />
          </div>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
            Interactive Google Maps showing real-time incident locations. Click markers for details.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
