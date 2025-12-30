// frontend/src/components/map/IncidentMap.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  LayerGroup,
  Polyline,
  Tooltip,
  ScaleControl,
  ZoomControl,
  useMapEvents,
  useMap
} from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { alertService, Alert } from '../../services/api/alertService';
import { incidentService, Incident } from '../../services/api/incidentService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import MapControls from './MapControls';
import ClusterVisualization from './ClusterVisualization';
import { formatDateTime, formatDistance } from '../../utils/formatters';
import { MAP_CONFIG } from '../../utils/constants';

interface IncidentMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  timeRange?: '1h' | '24h' | '7d';
  filters?: {
    priority?: string[];
    source?: string[];
    showHeatmap?: boolean;
    showClusters?: boolean;
    showAlerts?: boolean;
    showIncidents?: boolean;
  };
  onAlertSelect?: (alert: Alert) => void;
  onIncidentSelect?: (incident: Incident) => void;
  interactive?: boolean;
}

const IncidentMap: React.FC<IncidentMapProps> = ({
  initialCenter = MAP_CONFIG.DEFAULT_CENTER,
  initialZoom = MAP_CONFIG.DEFAULT_ZOOM,
  timeRange = '24h',
  filters = {
    showHeatmap: true,
    showClusters: true,
    showAlerts: true,
    showIncidents: true
  },
  onAlertSelect,
  onIncidentSelect,
  interactive = true
}) => {
  const { user } = useAuth();
  const mapRef = useRef<L.Map>(null);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [clusterRadius, setClusterRadius] = useState<number>(MAP_CONFIG.CLUSTER_RADIUS_METERS);
  const [realTimeUpdates, setRealTimeUpdates] = useState<boolean>(true);

  // Fetch alerts for current view
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['map-alerts', bounds, timeRange, filters],
    queryFn: () => {
      if (!bounds) return Promise.resolve([]);
      
      const center = bounds.getCenter();
      const radius = Math.max(
        bounds.getNorthEast().distanceTo(bounds.getSouthWest()) / 2,
        1000
      );
      
      return alertService.getAlertsInRadius(
        { lat: center.lat, lng: center.lng },
        radius,
        {
          priority: filters.priority,
          source: filters.source,
          limit: MAP_CONFIG.MAX_ALERTS_DISPLAY
        }
      );
    },
    enabled: !!bounds && filters.showAlerts,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch incidents
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['map-incidents', timeRange],
    queryFn: () => incidentService.getIncidents({ timeRange }),
    enabled: filters.showIncidents,
  });

  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket('/topic/alerts.new', {
    enabled: realTimeUpdates,
    onMessage: (data) => {
      // Handle new alert in real-time
      if (filters.showAlerts && bounds) {
        const newAlert = JSON.parse(data);
        const alertLocation = L.latLng(
          newAlert.location.coordinates[1],
          newAlert.location.coordinates[0]
        );
        
        // Only add if within current view bounds
        if (bounds.contains(alertLocation)) {
          // Update alerts list
          // Note: In a real app, you would update the query cache
          refetchAlerts();
        }
      }
    }
  });

  // Handle map movement
  const MapEvents = () => {
    const map = useMap();
    
    useMapEvents({
      moveend: () => {
        setBounds(map.getBounds());
      },
      zoomend: () => {
        setBounds(map.getBounds());
      },
      load: () => {
        setBounds(map.getBounds());
      }
    });
    
    return null;
  };

  // Custom icons
  const alertIcons = useMemo(() => ({
    LOW: L.divIcon({
      html: '<div style="background-color: #4CAF50; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>',
      className: 'alert-icon',
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    }),
    MEDIUM: L.divIcon({
      html: '<div style="background-color: #FFC107; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>',
      className: 'alert-icon',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    }),
    HIGH: L.divIcon({
      html: '<div style="background-color: #FF9800; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>',
      className: 'alert-icon',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    }),
    CRITICAL: L.divIcon({
      html: '<div style="background-color: #F44336; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
      className: 'alert-icon',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    })
  }), []);

  const incidentIcons = useMemo(() => ({
    LOW: L.divIcon({
      html: '<div style="background-color: #2196F3; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">!</div>',
      className: 'incident-icon',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    }),
    MEDIUM: L.divIcon({
      html: '<div style="background-color: #FF9800; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">!</div>',
      className: 'incident-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    }),
    HIGH: L.divIcon({
      html: '<div style="background-color: #F44336; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">!</div>',
      className: 'incident-icon',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    }),
    CRITICAL: L.divIcon({
      html: '<div style="background-color: #D32F2F; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">!</div>',
      className: 'incident-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  }), []);

  const handleAlertClick = useCallback((alert: Alert) => {
    setSelectedAlert(alert);
    if (onAlertSelect) {
      onAlertSelect(alert);
    }
    
    // Center map on alert
    if (mapRef.current) {
      const [lng, lat] = alert.location.coordinates;
      mapRef.current.setView([lat, lng], 16);
    }
  }, [onAlertSelect]);

  const handleIncidentClick = useCallback((incident: Incident) => {
    setSelectedIncident(incident);
    if (onIncidentSelect) {
      onIncidentSelect(incident);
    }
    
    // Center map on incident
    if (mapRef.current) {
      const [lng, lat] = incident.location.coordinates;
      mapRef.current.setView([lat, lng], 15);
    }
  }, [onIncidentSelect]);

  const handleClusterClick = useCallback((cluster: any) => {
    // Handle cluster selection
    console.log('Cluster clicked:', cluster);
  }, []);

  const renderHeatmap = useCallback(() => {
    if (!filters.showHeatmap || !alerts || alerts.length === 0) {
      return null;
    }

    return (
      <LayerGroup>
        {alerts.map((alert, index) => (
          <Circle
            key={`heat-${alert.id}-${index}`}
            center={[
              alert.location.coordinates[1],
              alert.location.coordinates[0]
            ]}
            radius={clusterRadius}
            pathOptions={{
              fillColor: alert.priority === 'CRITICAL' ? '#F44336' : 
                         alert.priority === 'HIGH' ? '#FF9800' : 
                         alert.priority === 'MEDIUM' ? '#FFC107' : '#4CAF50',
              color: 'transparent',
              fillOpacity: 0.05,
              weight: 0
            }}
          />
        ))}
      </LayerGroup>
    );
  }, [alerts, filters.showHeatmap, clusterRadius]);

  const renderClusters = useCallback(() => {
    if (!filters.showClusters || !alerts || alerts.length < 3) {
      return null;
    }

    return (
      <ClusterVisualization
        alerts={alerts}
        clusterRadius={clusterRadius}
        onClusterClick={handleClusterClick}
      />
    );
  }, [alerts, filters.showClusters, clusterRadius, handleClusterClick]);

  const isLoading = alertsLoading || incidentsLoading;

  return (
    <div className="incident-map-container relative h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <LoadingSpinner size="large" />
          <span className="ml-3 text-gray-700">Loading map data...</span>
        </div>
      )}
      
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        scrollWheelZoom={interactive}
        zoomControl={false}
        className="rounded-lg shadow-lg"
      >
        <MapEvents />
        <ZoomControl position="topright" />
        <ScaleControl position="bottomleft" />
        
        {/* Base Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {/* Heatmap Layer */}
        {renderHeatmap()}
        
        {/* Cluster Visualization */}
        {renderClusters()}
        
        {/* Alert Markers */}
        {filters.showAlerts && alerts && alerts.map((alert) => (
          <Marker
            key={`alert-${alert.id}`}
            position={[
              alert.location.coordinates[1],
              alert.location.coordinates[0]
            ]}
            icon={alertIcons[alert.priority]}
            eventHandlers={{
              click: () => handleAlertClick(alert)
            }}
          >
            <Popup>
              <div className="alert-popup p-2">
                <h4 className="font-bold text-gray-900">{alert.category}</h4>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-600">Priority:</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      alert.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      alert.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      alert.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {alert.priority}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Source: {alert.source.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-600">
                    Time: {formatDateTime(alert.timestamp)}
                  </div>
                  {alert.confidenceScore && (
                    <div className="text-xs text-gray-600">
                      Confidence: {Math.round(alert.confidenceScore * 100)}%
                    </div>
                  )}
                  <button
                    onClick={() => handleAlertClick(alert)}
                    className="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
            {alert.priority === 'CRITICAL' && (
              <Tooltip permanent direction="top" opacity={0.9}>
                <span className="font-bold text-red-600">CRITICAL</span>
              </Tooltip>
            )}
          </Marker>
        ))}
        
        {/* Incident Markers */}
        {filters.showIncidents && incidents && incidents.map((incident) => (
          <React.Fragment key={`incident-${incident.id}`}>
            <Marker
              position={[
                incident.location.coordinates[1],
                incident.location.coordinates[0]
              ]}
              icon={incidentIcons[incident.severity]}
              eventHandlers={{
                click: () => handleIncidentClick(incident)
              }}
            >
              <Popup>
                <div className="incident-popup p-3 max-w-xs">
                  <h4 className="font-bold text-lg text-gray-900">
                    {incident.patternType}
                  </h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700">Severity:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        incident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {incident.severity}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      Confidence: {Math.round(incident.confidenceScore * 100)}%
                    </div>
                    <div className="text-sm text-gray-700">
                      Alerts: {incident.alertIds?.length || 0}
                    </div>
                    <div className="text-sm text-gray-700">
                      Detected: {formatDateTime(incident.timestamp)}
                    </div>
                    {incident.recommendedActions && (
                      <div className="mt-2">
                        <h5 className="font-medium text-sm text-gray-900">Recommended:</h5>
                        <ul className="mt-1 text-xs text-gray-700">
                          {incident.recommendedActions.slice(0, 3).map((action, idx) => (
                            <li key={idx} className="ml-4 list-disc">{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      onClick={() => handleIncidentClick(incident)}
                      className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View Incident Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* Correlation Radius */}
            <Circle
              center={[
                incident.location.coordinates[1],
                incident.location.coordinates[0]
              ]}
              radius={clusterRadius}
              pathOptions={{
                fillColor: incident.severity === 'CRITICAL' ? '#F44336' : 
                           incident.severity === 'HIGH' ? '#FF9800' : 
                           incident.severity === 'MEDIUM' ? '#FFC107' : '#2196F3',
                color: incident.severity === 'CRITICAL' ? '#D32F2F' : 
                       incident.severity === 'HIGH' ? '#F57C00' : 
                       incident.severity === 'MEDIUM' ? '#FFB300' : '#1976D2',
                fillOpacity: 0.05,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>
      
      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000]">
        <MapControls
          onRadiusChange={setClusterRadius}
          currentRadius={clusterRadius}
          onHeatmapToggle={(enabled) => {
            // Update filters
          }}
          onRealTimeToggle={setRealTimeUpdates}
          realTimeEnabled={realTimeUpdates}
          onExport={() => {
            // Export map view
          }}
          onFilterChange={(newFilters) => {
            // Update filters
          }}
        />
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[1000] max-w-xs">
        <h4 className="font-semibold text-sm mb-3">Map Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>Low Priority Alert</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span>Critical Alert</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white mr-2"></div>
            <span>Incident</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full border-2 border-orange-500 mr-2"></div>
            <span>Correlation Radius ({clusterRadius}m)</span>
          </div>
          <div className="pt-2 border-t border-gray-200 mt-2">
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${realTimeUpdates ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Real-time Updates: {realTimeUpdates ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected Item Info Panel */}
      {(selectedAlert || selectedIncident) && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[1000] max-w-md">
          <h4 className="font-bold text-gray-900 mb-2">
            {selectedAlert ? 'Selected Alert' : 'Selected Incident'}
          </h4>
          {selectedAlert && (
            <div className="space-y-2">
              <p><strong>Category:</strong> {selectedAlert.category}</p>
              <p><strong>Priority:</strong> {selectedAlert.priority}</p>
              <p><strong>Time:</strong> {formatDateTime(selectedAlert.timestamp)}</p>
              <button
                onClick={() => window.open(`/alerts/${selectedAlert.id}`, '_blank')}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Open in Detail View
              </button>
            </div>
          )}
          {selectedIncident && (
            <div className="space-y-2">
              <p><strong>Type:</strong> {selectedIncident.patternType}</p>
              <p><strong>Severity:</strong> {selectedIncident.severity}</p>
              <p><strong>Confidence:</strong> {Math.round(selectedIncident.confidenceScore * 100)}%</p>
              <p><strong>Alerts:</strong> {selectedIncident.alertIds?.length || 0} correlated</p>
              <button
                onClick={() => window.open(`/incidents/${selectedIncident.id}`, '_blank')}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Open Incident Details
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setSelectedAlert(null);
              setSelectedIncident(null);
            }}
            className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            Clear Selection
          </button>
        </div>
      )}
      
      {/* Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs z-[1000]">
        <div className="flex justify-between items-center">
          <div>
            {alerts && (
              <span>Alerts: {alerts.length} | </span>
            )}
            {incidents && (
              <span>Incidents: {incidents.length} | </span>
            )}
            <span>View: {bounds ? formatDistance(bounds.getNorthEast().distanceTo(bounds.getSouthWest())) : 'Loading...'}</span>
          </div>
          <div>
            <span>Real-time: {realTimeUpdates ? 'ON' : 'OFF'} | </span>
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentMap;