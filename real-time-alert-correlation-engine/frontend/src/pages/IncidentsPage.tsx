// frontend/src/pages/IncidentsPage.tsx
import React from 'react';

const IncidentsPage: React.FC = () => {
  const incidents = [
    { id: 1, type: 'Multiple 911 Calls', severity: 'HIGH', location: 'Financial District', time: '10:30 AM' },
    { id: 2, type: 'Social Media Trend', severity: 'MEDIUM', location: 'Central Park', time: '9:45 AM' },
    { id: 3, type: 'Sensor Correlation', severity: 'LOW', location: 'Industrial Zone', time: '8:15 AM' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="incidents-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Correlated Incidents</h1>
        <p className="text-gray-600">Automatically detected patterns and correlations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {incidents.map((incident) => (
          <div key={incident.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{incident.type}</h3>
                <p className="text-sm text-gray-500">{incident.location}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                {incident.severity}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Detected</span>
                <span className="font-medium">{incident.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Confidence</span>
                <span className="font-medium text-green-600">85%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Alerts</span>
                <span className="font-medium">3 correlated</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Investigate Incident
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentsPage;