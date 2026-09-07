import React, { useState, useMemo } from 'react';
import { RouteDetail, ReturnItem, RouteStop } from '../types';
import { MapPin, Truck, AlertTriangle, CheckCircle, Package } from 'lucide-react';

interface RouteMapCanvasProps {
  routes: RouteDetail[];
  returns: ReturnItem[];
  selectedRouteId?: string | null;
  onSelectRoute?: (routeId: string) => void;
}

export const RouteMapCanvas: React.FC<RouteMapCanvasProps> = ({
  routes,
  returns,
  selectedRouteId,
  onSelectRoute,
}) => {
  const [selectedStop, setSelectedStop] = useState<RouteStop | ReturnItem | null>(null);

  const DEPOT_LAT = 13.0827;
  const DEPOT_LNG = 80.2707;

  // Filter routes to display
  const displayRoutes = useMemo(() => {
    if (!selectedRouteId) return routes;
    return routes.filter((r) => r.route_id === selectedRouteId);
  }, [routes, selectedRouteId]);

  // Color palette for 10 routes
  const ROUTE_COLORS = [
    '#0284c7', '#16a34a', '#d97706', '#9333ea', '#dc2626',
    '#0891b2', '#65a30d', '#c026d3', '#ea580c', '#4f46e5'
  ];

  // Calculate bounding box for SVG normalization
  const { minLat, maxLat, minLng, maxLng } = useMemo(() => {
    let minLat = DEPOT_LAT - 0.15;
    let maxLat = DEPOT_LAT + 0.15;
    let minLng = DEPOT_LNG - 0.15;
    let maxLng = DEPOT_LNG + 0.15;

    routes.forEach(r => {
      r.stops.forEach(s => {
        if (s.latitude < minLat) minLat = s.latitude;
        if (s.latitude > maxLat) maxLat = s.latitude;
        if (s.longitude < minLng) minLng = s.longitude;
        if (s.longitude > maxLng) maxLng = s.longitude;
      });
    });

    returns.forEach(ret => {
      if (ret.latitude < minLat) minLat = ret.latitude;
      if (ret.latitude > maxLat) maxLat = ret.latitude;
      if (ret.longitude < minLng) minLng = ret.longitude;
      if (ret.longitude > maxLng) maxLng = ret.longitude;
    });

    return { minLat, maxLat, minLng, maxLng };
  }, [routes, returns]);

  // Project coordinates to 800x500 canvas coordinates
  const project = (lat: number, lng: number) => {
    const padding = 50;
    const width = 800 - 2 * padding;
    const height = 500 - 2 * padding;

    const x = padding + ((lng - minLng) / (maxLng - minLng || 1)) * width;
    // Y inverted for map lat
    const y = 500 - (padding + ((lat - minLat) / (maxLat - minLat || 1)) * height);

    return { x, y };
  };

  const depotPos = project(DEPOT_LAT, DEPOT_LNG);

  // Unassigned/Blocked returns
  const unassignedReturns = useMemo(() => {
    return returns.filter(r => r.status !== 'Assigned');
  }, [returns]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl text-white relative">
      {/* Visual Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Truck className="w-5 h-5 text-sky-400" />
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
            Interactive Route Map Visualizer
          </h3>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">Depot</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span className="text-slate-300">Delivery</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">Assigned Return</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">Blocked Return</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full h-[460px] bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <svg viewBox="0 0 800 500" className="w-full h-full">
          {/* Draw Route Polylines */}
          {displayRoutes.map((route, rIdx) => {
            const color = ROUTE_COLORS[rIdx % ROUTE_COLORS.length];
            const routeStops = route.stops;
            if (routeStops.length === 0) return null;

            const pathPoints = [depotPos];
            routeStops.forEach(s => pathPoints.push(project(s.latitude, s.longitude)));
            pathPoints.push(depotPos);

            const pointsStr = pathPoints.map(p => `${p.x},${p.y}`).join(' ');

            return (
              <g key={route.route_id}>
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={color}
                  strokeWidth={selectedRouteId === route.route_id ? "3.5" : "2"}
                  strokeOpacity={selectedRouteId && selectedRouteId !== route.route_id ? "0.2" : "0.75"}
                  strokeDasharray={selectedRouteId === route.route_id ? "none" : "4,2"}
                  className="transition-all duration-300 hover:stroke-width-4 cursor-pointer"
                  onClick={() => onSelectRoute && onSelectRoute(route.route_id)}
                />
              </g>
            );
          })}

          {/* Draw Stops for Display Routes */}
          {displayRoutes.map((route, rIdx) => {
            const color = ROUTE_COLORS[rIdx % ROUTE_COLORS.length];
            return route.stops.map((stop) => {
              const pos = project(stop.latitude, stop.longitude);
              const isReturn = stop.stop_type === 'RETURN';

              return (
                <g
                  key={`${route.route_id}-${stop.stop_id}`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedStop(stop)}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isReturn ? "7" : "5"}
                    fill={isReturn ? "#10b981" : "#0284c7"}
                    stroke={selectedStop && ('stop_id' in selectedStop) && selectedStop.stop_id === stop.stop_id ? "#ffffff" : color}
                    strokeWidth="2"
                    className="transition-transform duration-200 group-hover:scale-150"
                  />
                  {isReturn && (
                    <circle cx={pos.x} cy={pos.y} r="3" fill="#ffffff" />
                  )}
                </g>
              );
            });
          })}

          {/* Draw Blocked/Unassigned Returns */}
          {unassignedReturns.map((ret) => {
            const pos = project(ret.latitude, ret.longitude);
            return (
              <g
                key={ret.return_id}
                className="cursor-pointer group"
                onClick={() => setSelectedStop(ret)}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="7"
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="animate-pulse"
                />
                <circle cx={pos.x} cy={pos.y} r="3" fill="#ffffff" />
              </g>
            );
          })}

          {/* Draw Depot (Central Hub) */}
          <g className="cursor-pointer">
            <circle cx={depotPos.x} cy={depotPos.y} r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="3" />
            <circle cx={depotPos.x} cy={depotPos.y} r="4" fill="#0f172a" />
          </g>
        </svg>

        {/* Selected Stop Tooltip Overlay */}
        {selectedStop && (
          <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl max-w-sm text-xs z-20 backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center space-x-1.5 font-bold text-slate-100">
                {'stop_type' in selectedStop ? (
                  selectedStop.stop_type === 'RETURN' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Return Pick: {selectedStop.stop_id}
                    </span>
                  ) : (
                    <span className="text-sky-400 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> Delivery: {selectedStop.stop_id}
                    </span>
                  )
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Blocked Return: {selectedStop.return_id}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedStop(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-slate-300">
              {'customer_id' in selectedStop && (
                <div><span className="text-slate-500">Customer:</span> {selectedStop.customer_id}</div>
              )}
              {'item_type' in selectedStop && (
                <div><span className="text-slate-500">Item:</span> {selectedStop.item_type} ({selectedStop.item_size}, {selectedStop.item_weight_kg}kg)</div>
              )}
              {'estimated_arrival' in selectedStop && selectedStop.estimated_arrival && (
                <div><span className="text-slate-500">Est. Arrival:</span> <span className="text-amber-400 font-semibold">{selectedStop.estimated_arrival}</span></div>
              )}
              {'pickup_time_start' in selectedStop && (
                <div><span className="text-slate-500">Window:</span> {selectedStop.pickup_time_start} - {selectedStop.pickup_time_end}</div>
              )}
              {'blocked_reason' in selectedStop && selectedStop.blocked_reason && (
                <div className="text-rose-400 font-semibold mt-1 bg-rose-950/50 p-1.5 rounded border border-rose-800/50">
                  Reason: {selectedStop.blocked_reason}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
