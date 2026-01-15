import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-xl font-bold text-gray-900">LE Alert System</div>
          <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            v1.0.0
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {user.department} • {user.badgeNumber}
                </div>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;