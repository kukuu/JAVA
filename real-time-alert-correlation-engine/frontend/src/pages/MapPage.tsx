// frontend/src/pages/MapPage.tsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapPage: React.FC = () => {
  const [center] = useState<[number, number]>([40.7128, -74.0060]);
  const [zoom] = useState(12);

  const alerts = [
    { id: 1, lat: 40.7128, lng: -74.0060, title: '911 Call', priority: 'HIGH' },
    { id: 2, lat: 40.7589, lng: -73.9851, title: 'Sensor Alert', priority: 'MEDIUM' },
    { id: 3, lat: 40.7489, lng: -73.9680, title: 'Social Media', priority: 'LOW' },
  ];

  const getMarkerColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#dc2626';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="map-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Situation Map</h1>
        <p className="text-gray-600">Real-time geospatial visualization of alerts and incidents</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px]">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {alerts.map((alert) => (
            <Marker
              key={alert.id}
              position={[alert.lat, alert.lng]}
              icon={L.divIcon({
                html: `<div style="background-color: ${getMarkerColor(alert.priority)}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                className: 'custom-marker',
                iconSize: [12, 12],
              })}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{alert.title}</h3>
                  <p className="text-sm">Priority: {alert.priority}</p>
                  <p className="text-sm">Location: {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">Map Controls</h3>
          <div className="mt-2 space-y-2">
            <button className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm">
              Show Heatmap
            </button>
            <button className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm">
              Cluster Alerts
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900">Legend</h3>
          <div className="mt-2 space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm">High Priority</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-sm">Medium Priority</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm">Low Priority</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900">Quick Actions</h3>
          <div className="mt-2 space-y-2">
            <button className="w-full px-3 py-2 bg-green-100 text-green-700 rounded text-sm">
              Export View
            </button>
            <button className="w-full px-3 py-2 bg-green-100 text-green-700 rounded text-sm">
              Share Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;