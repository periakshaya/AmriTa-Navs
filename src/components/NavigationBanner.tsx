import React from 'react';
import { RouteResponse } from '../types/campus';
import {
  Navigation,
  Square,
  RotateCcw,
  AlertTriangle,
  Play,
  FastForward,
} from 'lucide-react';

interface NavigationBannerProps {
  route: RouteResponse;
  currentStepIndex: number;
  isSimulating: boolean;
  simulationSpeed: number;
  isOffRoute: boolean;
  onStopNavigation: () => void;
  onRecalculateRoute: () => void;
  onToggleSimulation: () => void;
  onChangeSimSpeed: (speed: number) => void;
}

export const NavigationBanner: React.FC<NavigationBannerProps> = ({
  route,
  currentStepIndex,
  isSimulating,
  simulationSpeed,
  isOffRoute,
  onStopNavigation,
  onRecalculateRoute,
  onToggleSimulation,
  onChangeSimSpeed,
}) => {
  const currentInstruction =
    route.turnByTurnInstructions[currentStepIndex] ||
    route.turnByTurnInstructions[0] ||
    'Proceed along the highlighted walking corridor.';

  const nextInstruction =
    route.turnByTurnInstructions[currentStepIndex + 1];

  return (
    <div className="absolute top-4 left-4 right-4 md:left-[440px] md:right-8 z-30 pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-md border border-sky-500/50 rounded-2xl p-4 shadow-2xl text-white space-y-3">
        {/* Off-route Warning Banner */}
        {isOffRoute && (
          <div className="p-2.5 bg-amber-500/20 border border-amber-500/50 rounded-xl flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Off-route detected (&gt;25m from active graph corridor).</span>
            </div>
            <button
              onClick={onRecalculateRoute}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px]"
            >
              Recalculate Now
            </button>
          </div>
        )}

        {/* Current Instruction HUD */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-sky-600/30 border border-sky-500/60 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                Step {currentStepIndex + 1} of {route.turnByTurnInstructions.length}
              </div>
              <div className="text-sm font-bold text-slate-100 leading-snug mt-0.5">
                {currentInstruction}
              </div>
              {nextInstruction && (
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span className="text-slate-500">Then:</span>
                  <span>{nextInstruction}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRecalculateRoute}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Recalculate Route"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onStopNavigation}
              className="px-3 py-2 bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-red-600/30"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Controls for Evaluators */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Pedestrian Tracker</span>
            <span className="text-slate-600">|</span>
            <button
              onClick={onToggleSimulation}
              className={`font-semibold hover:underline ${
                isSimulating ? 'text-amber-400' : 'text-sky-400'
              }`}
            >
              {isSimulating ? 'Pause Walk Simulation' : 'Simulate Walking'}
            </button>
          </div>

          {isSimulating && (
            <div className="flex items-center gap-2">
              <span>Speed:</span>
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onChangeSimSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    simulationSpeed === spd
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
