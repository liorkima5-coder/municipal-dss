"use client";
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent({ data, colors }: { data: any, colors: string[] }) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import('leaflet').then(m => setL(m));
  }, []);

  if (!L) return null;

  return (
    <MapContainer center={[31.77, 35.21]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      {data?.data?.map((route: any, rIdx: number) => (
        <React.Fragment key={rIdx}>
          {route.route_steps?.length > 0 && (
            <Polyline 
              positions={[[31.76, 35.21], ...route.route_steps.map((s: any) => [s.lat, s.lon])]} 
              pathOptions={{ color: colors[rIdx % colors.length], weight: 8, opacity: 0.5 }} 
            />
          )}
          {route.route_steps?.map((step: any) => (
            <Marker key={step.id} position={[step.lat, step.lon]} icon={new L.Icon({ 
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${['blue', 'red', 'green', 'gold', 'violet', 'orange', 'yellow', 'black', 'grey', 'rose'][rIdx % 10]}.png`, 
                iconSize: [25, 41], iconAnchor: [12, 41] 
            })}>
              <Popup><div className="text-right font-bold tabular-nums">#{step.id} | {step.category}</div></Popup>
            </Marker>
          ))}
        </React.Fragment>
      ))}
    </MapContainer>
  );
}