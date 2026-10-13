import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CampusVertex, CampusEdge, RouteResponse } from '../types/campus';

interface CampusMapProps {
  vertices: CampusVertex[];
  edges: CampusEdge[];
  origin: CampusVertex | null;
  destination: CampusVertex | null;
  route: RouteResponse | null;
  alternativeRoute?: RouteResponse | null;
  userLocation: { lat: number; lng: number; heading?: number } | null;
  isNavigating: boolean;
  activeClosures: Record<string, string>;
  onSelectVertex: (vertex: CampusVertex, role: 'origin' | 'destination' | 'inspect') => void;
  selectedVertex: CampusVertex | null;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  ENTRANCE: { bg: '#3b82f6', border: '#1d4ed8', text: '#ffffff' },
  ACADEMIC: { bg: '#8b5cf6', border: '#6d28d9', text: '#ffffff' },
  LABORATORY: { bg: '#06b6d4', border: '#0e7490', text: '#ffffff' },
  LIBRARY: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },
  HOSTEL: { bg: '#ec4899', border: '#be185d', text: '#ffffff' },
  DINING: { bg: '#10b981', border: '#047857', text: '#ffffff' },
  SPORTS: { bg: '#14b8a6', border: '#0f766e', text: '#ffffff' },
  HEALTH: { bg: '#ef4444', border: '#b91c1c', text: '#ffffff' },
  AMENITY: { bg: '#f97316', border: '#c2410c', text: '#ffffff' },
  RESIDENCE: { bg: '#a855f7', border: '#7e22ce', text: '#ffffff' },
  TRANSIT: { bg: '#64748b', border: '#334155', text: '#ffffff' },
  LANDMARK: { bg: '#eab308', border: '#a16207', text: '#ffffff' },
  WALKWAY_JUNCTION: { bg: '#475569', border: '#334155', text: '#ffffff' },
  SERVICES: { bg: '#6b7280', border: '#4b5563', text: '#ffffff' },
};

export const CampusMap: React.FC<CampusMapProps> = ({
  vertices,
  edges,
  origin,
  destination,
  route,
  alternativeRoute,
  userLocation,
  isNavigating,
  activeClosures,
  onSelectVertex,
  selectedVertex,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const edgesLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Amrita Chennai Campus (Vengal, Thiruvallur)
    const map = L.map(mapContainerRef.current, {
      center: [13.2245, 80.0260],
      zoom: 17,
      minZoom: 15,
      maxZoom: 19,
      zoomControl: false,
    });

    // Clean OpenStreetMap tiles with dark/slate tone styling via Leaflet
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Amrita Chennai Campus Map',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    edgesLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Pedestrian Network Edges
  useEffect(() => {
    if (!mapInstanceRef.current || !edgesLayerRef.current) return;
    edgesLayerRef.current.clearLayers();

    const vertexMap = new Map<string, CampusVertex>();
    vertices.forEach((v) => vertexMap.set(v.id, v));

    edges.forEach((edge) => {
      const v1 = vertexMap.get(edge.source);
      const v2 = vertexMap.get(edge.destination);
      if (!v1 || !v2) return;

      const isClosed = activeClosures[edge.id] || edge.walkability !== 'OPEN';
      const latlngs: [number, number][] = [
        [v1.latitude, v1.longitude],
        [v2.latitude, v2.longitude],
      ];

      if (isClosed) {
        // Red dashed line for closed or restricted pathway
        const line = L.polyline(latlngs, {
          color: '#ef4444',
          weight: 4,
          dashArray: '6, 6',
          opacity: 0.85,
        });
        line.bindTooltip(
          `<b>CLOSED PATHWAY:</b> ${edge.id}<br/>${v1.name} ↔ ${v2.name}<br/>Status: ${activeClosures[edge.id] || edge.walkability}`,
          { direction: 'top', className: 'campus-map-tooltip' }
        );
        edgesLayerRef.current?.addLayer(line);
      } else {
        // Subtle grey pathway indicating walkable network
        const line = L.polyline(latlngs, {
          color: '#94a3b8',
          weight: 2.5,
          opacity: 0.45,
          dashArray: edge.pathType === 'STAIRS' ? '3, 4' : undefined,
        });
        edgesLayerRef.current?.addLayer(line);
      }
    });
  }, [edges, vertices, activeClosures]);

  // Render Vertex Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    vertices.forEach((vertex) => {
      const isOrigin = origin?.id === vertex.id;
      const isDest = destination?.id === vertex.id;
      const isSelected = selectedVertex?.id === vertex.id;
      const colorScheme = TYPE_COLORS[vertex.type] || TYPE_COLORS.LANDMARK;

      let markerIcon: L.DivIcon;

      if (isOrigin) {
        markerIcon = L.divIcon({
          className: 'custom-pin-marker',
          html: `<div style="background-color: #10b981; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">A</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
      } else if (isDest) {
        markerIcon = L.divIcon({
          className: 'custom-pin-marker',
          html: `<div style="background-color: #ef4444; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">B</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
      } else if (isSelected) {
        markerIcon = L.divIcon({
          className: 'custom-pin-marker',
          html: `<div style="background-color: #3b82f6; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(59,130,246,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">★</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
      } else {
        const isJunction = vertex.type === 'WALKWAY_JUNCTION';
        const size = isJunction ? 10 : 20;
        markerIcon = L.divIcon({
          className: 'custom-campus-node',
          html: `<div style="background-color: ${colorScheme.bg}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      }

      const marker = L.marker([vertex.latitude, vertex.longitude], {
        icon: markerIcon,
        zIndexOffset: isOrigin || isDest ? 1000 : 100,
      });

      // Popup
      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 200px; color: #0f172a;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">${vertex.type}</div>
          <div style="font-size: 14px; font-weight: 700; margin-top: 2px; color: #0f172a;">${vertex.name}</div>
          <div style="font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.4;">${vertex.description || ''}</div>
          <div style="margin-top: 8px; font-size: 11px; color: #64748b;">
            <span>Elev: ${vertex.elevationMeters}m</span> · 
            <span>${vertex.accessible ? '♿ Accessible' : 'Stairs/Restricted'}</span>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 10px;">
            <button id="btn-set-origin-${vertex.id}" style="background-color: #10b981; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">Set as Start</button>
            <button id="btn-set-dest-${vertex.id}" style="background-color: #ef4444; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">Set Destination</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btnOrigin = document.getElementById(`btn-set-origin-${vertex.id}`);
        const btnDest = document.getElementById(`btn-set-dest-${vertex.id}`);
        if (btnOrigin) {
          btnOrigin.onclick = () => {
            onSelectVertex(vertex, 'origin');
            marker.closePopup();
          };
        }
        if (btnDest) {
          btnDest.onclick = () => {
            onSelectVertex(vertex, 'destination');
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectVertex(vertex, 'inspect');
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [vertices, origin, destination, selectedVertex, onSelectVertex]);

  // Render Routes (Primary & Alternative)
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();

    if (alternativeRoute && alternativeRoute.geometryCoordinates.length > 0) {
      const altPoly = L.polyline(alternativeRoute.geometryCoordinates, {
        color: '#64748b',
        weight: 5,
        opacity: 0.6,
        dashArray: '8, 6',
      });
      altPoly.bindTooltip(
        `Alternative Route (${alternativeRoute.metric}): ${Math.round(alternativeRoute.totalDistanceMeters)}m, ~${Math.round(alternativeRoute.totalDurationSeconds / 60)} min`,
        { sticky: true }
      );
      routeLayerRef.current.addLayer(altPoly);
    }

    if (route && route.success && route.geometryCoordinates.length > 0) {
      // Glow background line
      const glowLine = L.polyline(route.geometryCoordinates, {
        color: '#38bdf8',
        weight: 9,
        opacity: 0.4,
      });
      routeLayerRef.current.addLayer(glowLine);

      // Primary walking route line
      const mainLine = L.polyline(route.geometryCoordinates, {
        color: '#0284c7',
        weight: 5,
        opacity: 0.95,
      });
      routeLayerRef.current.addLayer(mainLine);

      // Fit bounds to route
      if (!isNavigating) {
        mapInstanceRef.current.fitBounds(mainLine.getBounds(), {
          padding: [50, 50],
          maxZoom: 18,
        });
      }
    }
  }, [route, alternativeRoute, isNavigating]);

  // Render User Location / Moving Marker during Navigation
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const iconHtml = `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background-color: #2563eb; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'user-gps-pulse-marker',
      html: iconHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 2000,
      }).addTo(mapInstanceRef.current);
    } else {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }

    if (isNavigating) {
      mapInstanceRef.current.panTo([userLocation.lat, userLocation.lng], { animate: true });
    }
  }, [userLocation, isNavigating]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 shadow-xl pointer-events-auto">
        <div className="font-semibold text-slate-100 mb-1 flex items-center justify-between">
          <span>Campus Pedestrian Map</span>
          <span className="text-[10px] text-sky-400 font-mono">1:1 Verified Graph</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
            <span>Academic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Library</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Food / Dining</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
            <span>Hostels</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            <span>Sports</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-500 border-t border-dashed"></span>
            <span className="text-red-400">Closed Path</span>
          </div>
        </div>
      </div>
    </div>
  );
};
