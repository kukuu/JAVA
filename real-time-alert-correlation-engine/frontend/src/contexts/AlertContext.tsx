// frontend/src/contexts/AlertContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface Alert {
  id: string;
  source: string;
  priority: string;
  location: { lat: number; lng: number };
  timestamp: string;
}

interface AlertContextType {
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  updateAlert: (id: string, alert: Partial<Alert>) => void;
  removeAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev]);
  };

  const updateAlert = (id: string, updates: Partial<Alert>) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, ...updates } : alert
    ));
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const value = {
    alerts,
    addAlert,
    updateAlert,
    removeAlert
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};