import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  ChartBarIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { name: 'Total Alerts', value: '1,234', change: '+12%', icon: ChartBarIcon, color: 'blue' },
    { name: 'Active Incidents', value: '23', change: '+3', icon: MapPinIcon, color: 'red' },
    { name: 'Response Time', value: '4.2 min', change: '-0.5 min', icon: ClockIcon, color: 'green' },
    { name: 'Active Units', value: '18', change: '+2', icon: UserGroupIcon, color: 'purple' },
  ];

  return (
    <div className="dashboard-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.firstName}. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600">{stat.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">911 Call - Medical Emergency</p>
                  <p className="text-sm text-gray-500">Downtown District • 5 min ago</p>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  HIGH
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100">
              Create New Alert
            </button>
            <button className="w-full text-left px-4 py-3 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100">
              View Live Map
            </button>
            <button className="w-full text-left px-4 py-3 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100">
              Critical Incidents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;