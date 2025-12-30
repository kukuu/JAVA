// frontend/src/types/index.ts
export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  badgeNumber?: string;
  department: string;
  jurisdiction: string;
}

export interface Alert {
  id: string;
  source: string;
  sourceId: string;
  timestamp: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: {
    lat: number;
    lng: number;
  };
  metadata?: Record<string, any>;
  status: string;
}

export interface Incident {
  id: string;
  type: string;
  severity: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  confidenceScore: number;
  alertIds: string[];
}