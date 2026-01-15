
import axios, { AxiosInstance, AxiosResponse, CancelTokenSource } from 'axios';
import { encryptData } from '../../utils/encryption';
import { API_CONFIG } from '../../utils/constants';

export interface Alert {
  id: string;
  source: 'CALL_911' | 'SOCIAL_MEDIA' | 'SENSOR' | 'BOLO' | 'PATROL';
  sourceId: string;
  timestamp: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  metadata?: Record<string, any>;
  confidenceScore?: number;
  correlationIds?: string[];
  incidentId?: string;
  status: 'RECEIVED' | 'PROCESSING' | 'CORRELATED' | 'RESOLVED' | 'ARCHIVED';
  auditTrail?: Array<{
    timestamp: string;
    userId: string;
    action: string;
    details: string;
  }>;
}

export interface AlertFilter {
  startTime?: string;
  endTime?: string;
  priority?: string[];
  source?: string[];
  category?: string[];
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  status?: string[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AlertResponse {
  alerts: Alert[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AlertMetrics {
  totalAlerts: number;
  alertsLastHour: number;
  alertsByPriority: Record<string, number>;
  alertsBySource: Record<string, number>;
  averageResponseTime: number;
  unresolvedCritical: number;
}

class AlertService {
  private api: AxiosInstance;
  private cancelTokenSources: Map<string, CancelTokenSource> = new Map();

  constructor() {
    this.api = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}/api/v1`,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request tracing
        const requestId = crypto.randomUUID();
        config.headers['X-Request-ID'] = requestId;
        config.headers['X-Client-Version'] = process.env.REACT_APP_VERSION || '1.0.0';
        
        // Add cancel token for abortable requests
        const source = axios.CancelToken.source();
        this.cancelTokenSources.set(requestId, source);
        config.cancelToken = source.token;
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        const requestId = response.config.headers?.['X-Request-ID'];
        if (requestId) {
          this.cancelTokenSources.delete(requestId);
        }
        return response;
      },
      async (error) => {
        const requestId = error.config?.headers?.['X-Request-ID'];
        if (requestId) {
          this.cancelTokenSources.delete(requestId);
        }
        
        // Handle 401 errors
        if (error.response?.status === 401) {
          // Token might be expired, try to refresh
          const originalRequest = error.config;
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
              const newToken = await this.refreshToken();
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout user
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user_data');
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Cancel ongoing request
  cancelRequest(requestId: string): void {
    const source = this.cancelTokenSources.get(requestId);
    if (source) {
      source.cancel('Request cancelled by user');
      this.cancelTokenSources.delete(requestId);
    }
  }

  // Get alerts with filtering
  async getAlerts(filter: AlertFilter = {}): Promise<AlertResponse> {
    const params = this.buildQueryParams(filter);
    
    const response: AxiosResponse<AlertResponse> = await this.api.get('/alerts', { params });
    
    // Decrypt PII data if present
    if (response.data.alerts) {
      response.data.alerts = response.data.alerts.map(alert => 
        this.decryptAlertData(alert)
      );
    }
    
    return response.data;
  }

  // Get single alert by ID
  async getAlertById(id: string): Promise<Alert> {
    const response: AxiosResponse<Alert> = await this.api.get(`/alerts/${id}`);
    return this.decryptAlertData(response.data);
  }

  // Get real-time alerts via WebSocket
  subscribeToAlerts(
    filter: AlertFilter,
    onUpdate: (alert: Alert) => void,
    onError?: (error: Error) => void
  ): () => void {
    // This would connect to WebSocket
    // Implementation depends on your WebSocket setup
    const subscriptionId = crypto.randomUUID();
    
    // Mock WebSocket subscription
    const ws = new WebSocket(`${API_CONFIG.WS_URL}/ws/alerts`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE',
        subscriptionId,
        filter
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ALERT_UPDATE') {
          const decryptedAlert = this.decryptAlertData(data.alert);
          onUpdate(decryptedAlert);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      if (onError) {
        onError(new Error('WebSocket connection error'));
      }
    };
    
    // Return unsubscribe function
    return () => {
      ws.send(JSON.stringify({
        type: 'UNSUBSCRIBE',
        subscriptionId
      }));
      ws.close();
    };
  }

  // Acknowledge alert
  async acknowledgeAlert(id: string, userId: string): Promise<void> {
    await this.api.patch(`/alerts/${id}/acknowledge`, { userId });
  }

  // Create new alert (for manual entry)
  async createAlert(alertData: Partial<Alert>): Promise<Alert> {
    // Encrypt PII data before sending
    const encryptedData = this.encryptAlertData(alertData);
    
    const response: AxiosResponse<Alert> = await this.api.post('/alerts', encryptedData);
    return this.decryptAlertData(response.data);
  }

  // Get alert metrics
  async getMetrics(): Promise<AlertMetrics> {
    const response: AxiosResponse<AlertMetrics> = await this.api.get('/alerts/metrics');
    return response.data;
  }

  // Search alerts by text
  async searchAlerts(query: string, filter?: AlertFilter): Promise<AlertResponse> {
    const params = {
      q: query,
      ...this.buildQueryParams(filter || {})
    };
    
    const response: AxiosResponse<AlertResponse> = await this.api.get('/alerts/search', { params });
    
    if (response.data.alerts) {
      response.data.alerts = response.data.alerts.map(alert => 
        this.decryptAlertData(alert)
      );
    }
    
    return response.data;
  }

  // Export alerts
  async exportAlerts(filter: AlertFilter, format: 'csv' | 'json' = 'json'): Promise<Blob> {
    const params = this.buildQueryParams(filter);
    
    const response: AxiosResponse<Blob> = await this.api.get('/alerts/export', {
      params: { ...params, format },
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Batch operations
  async batchAcknowledge(alertIds: string[], userId: string): Promise<void> {
    await this.api.post('/alerts/batch/acknowledge', { alertIds, userId });
  }

  // Geospatial queries
  async getAlertsInRadius(
    center: { lat: number; lng: number },
    radius: number, // in meters
    filter?: Omit<AlertFilter, 'location'>
  ): Promise<Alert[]> {
    const params = {
      lat: center.lat,
      lng: center.lng,
      radius,
      ...this.buildQueryParams(filter || {})
    };
    
    const response: AxiosResponse<Alert[]> = await this.api.get('/alerts/geospatial/radius', { params });
    
    return response.data.map(alert => this.decryptAlertData(alert));
  }

  private buildQueryParams(filter: AlertFilter): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (filter.startTime) params.startTime = filter.startTime;
    if (filter.endTime) params.endTime = filter.endTime;
    if (filter.priority?.length) params.priority = filter.priority.join(',');
    if (filter.source?.length) params.source = filter.source.join(',');
    if (filter.category?.length) params.category = filter.category.join(',');
    if (filter.status?.length) params.status = filter.status.join(',');
    if (filter.limit) params.limit = filter.limit;
    if (filter.offset) params.offset = filter.offset;
    if (filter.sortBy) params.sortBy = filter.sortBy;
    if (filter.sortOrder) params.sortOrder = filter.sortOrder;
    
    if (filter.location) {
      params.lat = filter.location.lat;
      params.lng = filter.location.lng;
      params.radius = filter.location.radius;
    }
    
    return params;
  }

  private encryptAlertData(alert: Partial<Alert>): Partial<Alert> {
    // Encrypt sensitive fields
    const encrypted = { ...alert };
    
    if (alert.metadata?.pii) {
      encrypted.metadata = {
        ...alert.metadata,
        pii: encryptData(JSON.stringify(alert.metadata.pii))
      };
    }
    
    return encrypted;
  }

  private decryptAlertData(alert: Alert): Alert {
    // Decrypt sensitive fields
    const decrypted = { ...alert };
    
    if (alert.metadata?.pii && typeof alert.metadata.pii === 'string') {
      try {
        decrypted.metadata = {
          ...alert.metadata,
          pii: JSON.parse(decryptData(alert.metadata.pii))
        };
      } catch (error) {
        console.error('Failed to decrypt alert PII:', error);
      }
    }
    
    return decrypted;
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Call your token refresh endpoint
    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken
    });
    
    const newToken = response.data.access_token;
    localStorage.setItem('access_token', newToken);
    
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    return newToken;
  }
}

export const alertService = new AlertService();