/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CampusMap } from './components/CampusMap';
import { RouteSidebar } from './components/RouteSidebar';
import { NavigationBanner } from './components/NavigationBanner';
import { AdminClosureModal } from './components/AdminClosureModal';
import { DsaLabModal } from './components/DsaLabModal';
import { CampusDirectoryModal } from './components/CampusDirectoryModal';
import { DataValidationModal } from './components/DataValidationModal';
import {
  CampusVertex,
  CampusEdge,
  MetricType,
  AlgorithmType,
  RouteResponse,
  GraphStatistics,
  WalkabilityStatus,
} from './types/campus';
import { haversineDistanceMeters } from './services/graphEngine';

export default function App() {
  const [vertices, setVertices] = useState<CampusVertex[]>([]);
  const [edges, setEdges] = useState<CampusEdge[]>([]);
  const [statistics, setStatistics] = useState<GraphStatistics | null>(null);
  const [activeClosures, setActiveClosures] = useState<Record<string, string>>({});

  // Route Planning State
  const [origin, setOrigin] = useState<CampusVertex | null>(null);
  const [destination, setDestination] = useState<CampusVertex | null>(null);
  const [metric, setMetric] = useState<MetricType>('DISTANCE');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('AStar');
  const [wheelchairOnly, setWheelchairOnly] = useState<boolean>(false);
  const [selectedVertex, setSelectedVertex] = useState<CampusVertex | null>(null);

  // Route Computation Results
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [alternativeRoute, setAlternativeRoute] = useState<RouteResponse | null>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);

  // Navigation & GPS State
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; heading?: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [navStepIndex, setNavStepIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [isOffRoute, setIsOffRoute] = useState<boolean>(false);
  const simTimerRef = useRef<any>(null);
  const simProgressRef = useRef<number>(0);

  // Modal State
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showDsaLabModal, setShowDsaLabModal] = useState<boolean>(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState<boolean>(false);
  const [showDataAuditModal, setShowDataAuditModal] = useState<boolean>(false);

  // Load initial campus data
  const loadCampusData = useCallback(async () => {
    try {
      const [vRes, eRes, sRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/edges'),
        fetch('/api/graph/statistics'),
      ]);
      const vData: CampusVertex[] = await vRes.json();
      const eData: CampusEdge[] = await eRes.json();
      const sData: GraphStatistics = await sRes.json();

      setVertices(vData);
      setEdges(eData);
      setStatistics(sData);

      // Set default demo origin and destination
      const gate = vData.find((v) => v.id === 'GATE_MAIN');
      const canteen = vData.find((v) => v.id === 'CANTEEN_FOODCOURT');
      if (gate && !origin) setOrigin(gate);
      if (canteen && !destination) setDestination(canteen);
    } catch (err) {
      console.error('Failed to load campus graph data:', err);
    }
  }, [origin, destination]);

  useEffect(() => {
    loadCampusData();
  }, [loadCampusData]);

  // Recalculate route whenever parameters change
  const computeActiveRoute = useCallback(async () => {
    if (!origin || !destination) {
      setRoute(null);
      setAlternativeRoute(null);
      return;
    }

    setLoadingRoute(true);
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originId: origin.id,
          destinationId: destination.id,
          metric,
          algorithm,
          wheelchairOnly,
          returnAlternatives: true,
        }),
      });

      const data: RouteResponse = await res.json();
      setRoute(data);
      if (data.alternativeRoute) {
        setAlternativeRoute(data.alternativeRoute);
      } else {
        setAlternativeRoute(null);
      }
    } catch (err) {
      console.error('Failed to compute route:', err);
    } finally {
      setLoadingRoute(false);
    }
  }, [origin, destination, metric, algorithm, wheelchairOnly]);

  useEffect(() => {
    computeActiveRoute();
  }, [computeActiveRoute]);

  // Handle GPS location request
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setGpsActive(true);

        // Snap to nearest campus vertex
        let nearest: CampusVertex | null = null;
        let minD = Infinity;
        vertices.forEach((v) => {
          const d = haversineDistanceMeters(latitude, longitude, v.latitude, v.longitude);
          if (d < minD) {
            minD = d;
            nearest = v;
          }
        });

        // If user is within 500m of Amrita Chennai campus, snap as origin
        if (nearest && minD <= 500) {
          setOrigin(nearest);
        } else if (nearest) {
          // If user is remote, inform and snap to Main Gate for campus demonstration
          alert(
            `You are currently outside Amrita Chennai campus (${Math.round(minD / 1000)} km away). Snapping starting point to Main Security Gate 1 for campus route demonstration.`
          );
          const gate = vertices.find((v) => v.id === 'GATE_MAIN');
          if (gate) setOrigin(gate);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        alert(
          'Location access was unavailable or denied. You can manually select any starting point from the search box or map.'
        );
        setGpsActive(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Turn Navigation & Walking Simulation
  const handleStartNavigation = () => {
    if (!route || !route.success || route.geometryCoordinates.length === 0) return;
    setIsNavigating(true);
    setNavStepIndex(0);
    setIsOffRoute(false);

    // Initial position at route start
    const startCoord = route.geometryCoordinates[0];
    setUserLocation({ lat: startCoord[0], lng: startCoord[1] });
    setIsSimulating(true);
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    setIsSimulating(false);
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
  };

  // Walking simulation runner
  useEffect(() => {
    if (!isNavigating || !isSimulating || !route || !route.success) {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
      return;
    }

    const coords = route.geometryCoordinates;
    if (coords.length < 2) return;

    simProgressRef.current = 0;
    const intervalMs = 1000 / simulationSpeed;

    simTimerRef.current = setInterval(() => {
      simProgressRef.current += 0.05 * simulationSpeed;

      if (simProgressRef.current >= coords.length - 1) {
        const last = coords[coords.length - 1];
        setUserLocation({ lat: last[0], lng: last[1] });
        setNavStepIndex(route.turnByTurnInstructions.length - 1);
        setIsSimulating(false);
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
        return;
      }

      const currentIndex = Math.floor(simProgressRef.current);
      const nextIndex = Math.min(currentIndex + 1, coords.length - 1);
      const ratio = simProgressRef.current - currentIndex;

      const p1 = coords[currentIndex];
      const p2 = coords[nextIndex];
      const curLat = p1[0] + (p2[0] - p1[0]) * ratio;
      const curLng = p1[1] + (p2[1] - p1[1]) * ratio;

      setUserLocation({ lat: curLat, lng: curLng });

      // Update active turn instruction step
      const stepIdx = Math.min(
        currentIndex,
        Math.max(0, route.turnByTurnInstructions.length - 1)
      );
      setNavStepIndex(stepIdx);
    }, intervalMs);

    return () => {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
      }
    };
  }, [isNavigating, isSimulating, route, simulationSpeed]);

  // Dynamic Edge Closure Update Handlers
  const handleUpdateClosure = async (
    edgeId: string,
    status: WalkabilityStatus,
    adminKey: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/closures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
        body: JSON.stringify({ edgeId, status }),
      });
      if (res.ok) {
        setActiveClosures((prev) => ({ ...prev, [edgeId]: status }));
        // Refresh graph and recalculate active route
        await computeActiveRoute();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleReopenEdge = async (edgeId: string, adminKey: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/closures/${edgeId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': adminKey },
      });
      if (res.ok) {
        setActiveClosures((prev) => {
          const next = { ...prev };
          delete next[edgeId];
          return next;
        });
        await computeActiveRoute();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col md:flex-row overflow-hidden font-sans bg-slate-950">
      {/* Route Navigation & Planner Sidebar */}
      <RouteSidebar
        vertices={vertices}
        origin={origin}
        destination={destination}
        metric={metric}
        algorithm={algorithm}
        wheelchairOnly={wheelchairOnly}
        route={route}
        alternativeRoute={alternativeRoute}
        loading={loadingRoute}
        onSetOrigin={setOrigin}
        onSetDestination={setDestination}
        onSwapPoints={() => {
          const temp = origin;
          setOrigin(destination);
          setDestination(temp);
        }}
        onChangeMetric={setMetric}
        onChangeAlgorithm={setAlgorithm}
        onToggleWheelchair={setWheelchairOnly}
        onUseCurrentLocation={handleUseCurrentLocation}
        gpsActive={gpsActive}
        onStartNavigation={handleStartNavigation}
        onOpenDirectory={() => setShowDirectoryModal(true)}
        onOpenDsaLab={() => setShowDsaLabModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenDataAudit={() => setShowDataAuditModal(true)}
      />

      {/* Main Interactive Map Canvas */}
      <div className="flex-1 relative h-full">
        <CampusMap
          vertices={vertices}
          edges={edges}
          origin={origin}
          destination={destination}
          route={route}
          alternativeRoute={alternativeRoute}
          userLocation={userLocation}
          isNavigating={isNavigating}
          activeClosures={activeClosures}
          selectedVertex={selectedVertex}
          onSelectVertex={(v, role) => {
            setSelectedVertex(v);
            if (role === 'origin') setOrigin(v);
            if (role === 'destination') setDestination(v);
          }}
        />

        {/* Turn-by-Turn HUD Banner during Navigation */}
        {isNavigating && route && route.success && (
          <NavigationBanner
            route={route}
            currentStepIndex={navStepIndex}
            isSimulating={isSimulating}
            simulationSpeed={simulationSpeed}
            isOffRoute={isOffRoute}
            onStopNavigation={handleStopNavigation}
            onRecalculateRoute={computeActiveRoute}
            onToggleSimulation={() => setIsSimulating(!isSimulating)}
            onChangeSimSpeed={setSimulationSpeed}
          />
        )}
      </div>

      {/* Modals */}
      {showDsaLabModal && (
        <DsaLabModal
          vertices={vertices}
          onClose={() => setShowDsaLabModal(false)}
        />
      )}

      {showAdminModal && (
        <AdminClosureModal
          edges={edges}
          vertices={vertices}
          activeClosures={activeClosures}
          onClose={() => setShowAdminModal(false)}
          onUpdateClosure={handleUpdateClosure}
          onReopenEdge={handleReopenEdge}
        />
      )}

      {showDirectoryModal && (
        <CampusDirectoryModal
          vertices={vertices}
          onClose={() => setShowDirectoryModal(false)}
          onSelect={(v, role) => {
            if (role === 'origin') setOrigin(v);
            if (role === 'destination') setDestination(v);
          }}
        />
      )}

      {showDataAuditModal && (
        <DataValidationModal
          statistics={statistics}
          onClose={() => setShowDataAuditModal(false)}
        />
      )}
    </div>
  );
}
