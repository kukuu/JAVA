import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
  MapIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Alerts', href: '/alerts', icon: BellAlertIcon },
    { name: 'Incidents', href: '/incidents', icon: ExclamationTriangleIcon },
    { name: 'Map', href: '/map', icon: MapIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="p-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="ml-3 text-lg font-semibold">LE Operations</span>
        </div>
      </div>
      
      <nav className="px-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <div className="text-xs text-gray-400">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            System Status: Operational
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;