import React, { useState } from 'react';
import { CampusEdge, CampusVertex, WalkabilityStatus } from '../types/campus';
import { AlertCircle, CheckCircle, Lock, Shield, X, RefreshCw } from 'lucide-react';

interface AdminClosureModalProps {
  edges: CampusEdge[];
  vertices: CampusVertex[];
  activeClosures: Record<string, string>;
  onClose: () => void;
  onUpdateClosure: (edgeId: string, status: WalkabilityStatus, adminKey: string) => Promise<boolean>;
  onReopenEdge: (edgeId: string, adminKey: string) => Promise<boolean>;
}

export const AdminClosureModal: React.FC<AdminClosureModalProps> = ({
  edges,
  vertices,
  activeClosures,
  onClose,
  onUpdateClosure,
  onReopenEdge,
}) => {
  const [adminKey, setAdminKey] = useState('amrita-admin-secure-2026');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>(edges[0]?.id || '');
  const [closureStatus, setClosureStatus] = useState<WalkabilityStatus>('TEMPORARILY_CLOSED');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const vertexMap = new Map<string, string>();
  vertices.forEach((v) => vertexMap.set(v.id, v.name));

  const handleApplyClosure = async () => {
    if (!selectedEdgeId) return;
    setSubmitting(true);
    setStatusMessage(null);

    const success = await onUpdateClosure(selectedEdgeId, closureStatus, adminKey);
    setSubmitting(false);

    if (success) {
      setStatusMessage({
        text: `Successfully marked pathway ${selectedEdgeId} as ${closureStatus}.`,
        isError: false,
      });
    } else {
      setStatusMessage({
        text: 'Failed to update edge closure. Verify admin API key.',
        isError: true,
      });
    }
  };

  const handleReopen = async (edgeId: string) => {
    setSubmitting(true);
    setStatusMessage(null);

    const success = await onReopenEdge(edgeId, adminKey);
    setSubmitting(false);

    if (success) {
      setStatusMessage({
        text: `Reopened pathway ${edgeId} for pedestrian transit.`,
        isError: false,
      });
    } else {
      setStatusMessage({
        text: 'Failed to reopen pathway. Verify admin credentials.',
        isError: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold">Dynamic Campus Edge Closures (Admin Control)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Key & Security Warning */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                <span>Admin Authorization Key</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Restricted to authorized estate maintenance staff.
              </p>
            </div>
            <input
              type="text"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs text-sky-300 w-full sm:w-64"
            />
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.isError
                  ? 'bg-red-950/50 border-red-800 text-red-200'
                  : 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
              }`}
            >
              {statusMessage.isError ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Active Closures Table */}
          <div className="space-y-2">
            <div className="font-bold text-slate-200 text-xs">
              Currently Closed or Restricted Pathways ({Object.keys(activeClosures).length})
            </div>
            {Object.keys(activeClosures).length === 0 ? (
              <div className="p-4 bg-slate-800/40 rounded-xl text-center text-slate-400 text-xs">
                All campus walkways and corridors are currently open and traversable.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                {Object.entries(activeClosures).map(([edgeId, status]) => {
                  const edge = edges.find((e) => e.id === edgeId);
                  const srcName = edge ? vertexMap.get(edge.source) || edge.source : 'Unknown';
                  const dstName = edge ? vertexMap.get(edge.destination) || edge.destination : 'Unknown';

                  return (
                    <div key={edgeId} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-red-300">{edgeId}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {srcName} ↔ {dstName}
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                          Status: {status}
                        </div>
                      </div>

                      <button
                        onClick={() => handleReopen(edgeId)}
                        disabled={submitting}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors"
                      >
                        Reopen Pathway
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form to Close an Edge */}
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
            <div className="font-bold text-slate-200">Set Pathway Closure or Maintenance</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Select Campus Pathway</label>
                <select
                  value={selectedEdgeId}
                  onChange={(e) => setSelectedEdgeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                >
                  {edges.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id}: {vertexMap.get(e.source) || e.source} → {vertexMap.get(e.destination) || e.destination} ({Math.round(e.distanceMeters)}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Closure Status</label>
                <select
                  value={closureStatus}
                  onChange={(e) => setClosureStatus(e.target.value as WalkabilityStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                >
                  <option value="TEMPORARILY_CLOSED">Temporarily Closed (Events / Convocation)</option>
                  <option value="MAINTENANCE">Maintenance (Paving / Repairs)</option>
                  <option value="RESTRICTED">Restricted Access (Authorized Staff Only)</option>
                  <option value="OPEN">Open</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleApplyClosure}
              disabled={submitting}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-600/20"
            >
              {submitting ? 'Applying Closure...' : 'Apply Pathway Closure'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
