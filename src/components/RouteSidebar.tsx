import React, { useState } from 'react';
import {
  CampusVertex,
  MetricType,
  AlgorithmType,
  RouteResponse,
} from '../types/campus';
import {
  Navigation,
  ArrowUpDown,
  Search,
  MapPin,
  Clock,
  Compass,
  Footprints,
  Accessibility,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface RouteSidebarProps {
  vertices: CampusVertex[];
  origin: CampusVertex | null;
  destination: CampusVertex | null;
  metric: MetricType;
  algorithm: AlgorithmType;
  wheelchairOnly: boolean;
  route: RouteResponse | null;
  alternativeRoute?: RouteResponse | null;
  loading: boolean;
  onSetOrigin: (vertex: CampusVertex | null) => void;
  onSetDestination: (vertex: CampusVertex | null) => void;
  onSwapPoints: () => void;
  onChangeMetric: (metric: MetricType) => void;
  onChangeAlgorithm: (algorithm: AlgorithmType) => void;
  onToggleWheelchair: (enabled: boolean) => void;
  onUseCurrentLocation: () => void;
  gpsActive: boolean;
  onStartNavigation: () => void;
  onOpenDirectory: () => void;
  onOpenDsaLab: () => void;
  onOpenAdmin: () => void;
  onOpenDataAudit: () => void;
}

export const RouteSidebar: React.FC<RouteSidebarProps> = ({
  vertices,
  origin,
  destination,
  metric,
  algorithm,
  wheelchairOnly,
  route,
  alternativeRoute,
  loading,
  onSetOrigin,
  onSetDestination,
  onSwapPoints,
  onChangeMetric,
  onChangeAlgorithm,
  onToggleWheelchair,
  onUseCurrentLocation,
  gpsActive,
  onStartNavigation,
  onOpenDirectory,
  onOpenDsaLab,
  onOpenAdmin,
  onOpenDataAudit,
}) => {
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [activeSearchInput, setActiveSearchInput] = useState<'origin' | 'dest' | null>(null);
  const [showDirectionsList, setShowDirectionsList] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const filterVertices = (query: string) => {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    return vertices
      .filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.id.toLowerCase().includes(q) ||
          v.type.toLowerCase().includes(q)
      )
      .slice(0, 6);
  };

  const originResults = filterVertices(originSearch);
  const destResults = filterVertices(destSearch);

  return (
    <div className="w-full md:w-[420px] h-full flex flex-col bg-slate-900 border-r border-slate-800 text-slate-100 z-20 shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Amrita Campus Nav
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/70 border border-sky-800/80 px-1.5 py-0.5 rounded">
                DSA Capstone
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Amrita Vishwa Vidyapeetham, Chennai</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenDsaLab}
            className="p-1.5 text-xs text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 font-medium"
            title="Open DSA Diagnostics & Benchmarks"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">DSA Lab</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Origin / Destination Search Card */}
        <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-lg space-y-3 relative">
          {/* Origin Input */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Choose starting point or GPS..."
                  value={origin ? origin.name : originSearch}
                  onChange={(e) => {
                    setOriginSearch(e.target.value);
                    if (origin) onSetOrigin(null);
                  }}
                  onFocus={() => setActiveSearchInput('origin')}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {origin && (
                  <button
                    onClick={() => {
                      onSetOrigin(null);
                      setOriginSearch('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Origin Autocomplete Dropdown */}
            {activeSearchInput === 'origin' && !origin && originResults.length > 0 && (
              <div className="absolute left-5 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800">
                {originResults.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSetOrigin(v);
                      setOriginSearch('');
                      setActiveSearchInput(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{v.name}</div>
                      <div className="text-[10px] text-slate-400">{v.type} · {v.id}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap & GPS bar */}
          <div className="flex items-center justify-between pl-5 pr-1">
            <button
              onClick={onUseCurrentLocation}
              className={`text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                gpsActive ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsActive ? 'text-sky-400 animate-pulse' : ''}`} />
              <span>{gpsActive ? 'GPS Position Snapped' : 'Use My GPS Position'}</span>
            </button>

            <button
              onClick={onSwapPoints}
              className="p-1 hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              title="Reverse direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Input */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search destination in campus..."
                  value={destination ? destination.name : destSearch}
                  onChange={(e) => {
                    setDestSearch(e.target.value);
                    if (destination) onSetDestination(null);
                  }}
                  onFocus={() => setActiveSearchInput('dest')}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors"
                />
                {destination && (
                  <button
                    onClick={() => {
                      onSetDestination(null);
                      setDestSearch('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Destination Autocomplete Dropdown */}
            {activeSearchInput === 'dest' && !destination && destResults.length > 0 && (
              <div className="absolute left-5 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800">
                {destResults.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSetDestination(v);
                      setDestSearch('');
                      setActiveSearchInput(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{v.name}</div>
                      <div className="text-[10px] text-slate-400">{v.type} · {v.id}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Campus Directory & Explore Shortcuts */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onOpenDirectory}
            className="flex-1 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white transition-colors text-center"
          >
            Browse Buildings Directory
          </button>
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className={`py-1.5 px-3 border rounded-xl transition-colors flex items-center gap-1.5 ${
              showAdvancedOptions
                ? 'bg-sky-950/60 border-sky-800 text-sky-300'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Routing Options</span>
          </button>
        </div>

        {/* Advanced Routing Configuration (Optimization Metric & Algorithm) */}
        {showAdvancedOptions && (
          <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Optimization Objective
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  onClick={() => onChangeMetric('DISTANCE')}
                  className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
                    metric === 'DISTANCE'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Shortest Distance (m)
                </button>
                <button
                  onClick={() => onChangeMetric('TIME')}
                  className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
                    metric === 'TIME'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fastest Time (s)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Routing Algorithm
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  onClick={() => onChangeAlgorithm('AStar')}
                  className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
                    algorithm === 'AStar'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  A* (Heuristic Guided)
                </button>
                <button
                  onClick={() => onChangeAlgorithm('Dijkstra')}
                  className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
                    algorithm === 'Dijkstra'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dijkstra (Baseline)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={wheelchairOnly}
                  onChange={(e) => onToggleWheelchair(e.target.checked)}
                  className="rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-900"
                />
                <Accessibility className="w-3.5 h-3.5 text-sky-400" />
                <span>Wheelchair Accessible Only (Avoid Stairs)</span>
              </label>
            </div>
          </div>
        )}

        {/* Route Computation Results */}
        {loading && (
          <div className="p-8 text-center text-slate-400 text-xs">
            <div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <span>Evaluating optimal walking graph...</span>
          </div>
        )}

        {route && !route.success && (
          <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-2xl text-xs text-red-200 space-y-1">
            <div className="font-semibold text-red-400">Path Not Found</div>
            <p className="text-[11px] leading-relaxed">{route.errorMessage}</p>
          </div>
        )}

        {route && route.success && (
          <div className="space-y-3">
            {/* Primary Route Summary Card */}
            <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-800/80 rounded-2xl border border-sky-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {Math.round(route.totalDistanceMeters)} m
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>~{Math.ceil(route.totalDurationSeconds / 60)} min walk</span>
                    <span>·</span>
                    <span className="font-mono text-sky-400">{route.algorithm}</span>
                  </div>
                </div>

                <button
                  onClick={onStartNavigation}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/30 flex items-center gap-1.5 transition-all transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Nav</span>
                </button>
              </div>

              {/* DSA Execution Metrics Banner */}
              <div className="pt-2 border-t border-slate-700/60 grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                <div>
                  <span className="block text-slate-500">Nodes Expanded</span>
                  <span className="font-mono font-bold text-slate-200">{route.nodesExpanded}</span>
                </div>
                <div>
                  <span className="block text-slate-500">Edges Evaluated</span>
                  <span className="font-mono font-bold text-slate-200">{route.edgesProcessed}</span>
                </div>
                <div>
                  <span className="block text-slate-500">Computation Time</span>
                  <span className="font-mono font-bold text-slate-200">
                    {route.executionTimeMs.toFixed(2)} ms
                  </span>
                </div>
              </div>
            </div>

            {/* Alternative Route Preview */}
            {alternativeRoute && alternativeRoute.success && (
              <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]">Alternative Path ({alternativeRoute.metric})</div>
                  <div className="font-semibold text-slate-200">
                    {Math.round(alternativeRoute.totalDistanceMeters)} m · ~{Math.ceil(alternativeRoute.totalDurationSeconds / 60)} min
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Diff: {Math.round(alternativeRoute.totalDistanceMeters - route.totalDistanceMeters)}m
                </div>
              </div>
            )}

            {/* Turn-by-Turn Directions List */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 overflow-hidden">
              <button
                onClick={() => setShowDirectionsList(!showDirectionsList)}
                className="w-full p-3 text-left font-semibold text-xs text-slate-200 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-sky-400" />
                  <span>Turn-by-Turn Navigation ({route.turnByTurnInstructions.length} steps)</span>
                </div>
                {showDirectionsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDirectionsList && (
                <div className="px-3 pb-3 pt-1 space-y-2 text-xs divide-y divide-slate-800/80">
                  {route.turnByTurnInstructions.map((instruction, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] text-sky-400 shrink-0 font-mono mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="text-slate-300 text-[11px] leading-relaxed">
                        {instruction}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Action Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-[11px] text-slate-400">
        <button
          onClick={onOpenAdmin}
          className="hover:text-slate-200 transition-colors underline decoration-slate-600 underline-offset-2"
        >
          Manage Edge Closures
        </button>
        <button
          onClick={onOpenDataAudit}
          className="hover:text-slate-200 transition-colors underline decoration-slate-600 underline-offset-2"
        >
          Data Audit & Survey Format
        </button>
      </div>
    </div>
  );
};
