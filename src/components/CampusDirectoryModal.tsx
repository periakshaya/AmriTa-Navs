import React, { useState } from 'react';
import { CampusVertex, LocationType } from '../types/campus';
import { Search, X, MapPin, Building, BookOpen, Coffee, Dumbbell, ShieldCheck, Accessibility } from 'lucide-react';

interface CampusDirectoryModalProps {
  vertices: CampusVertex[];
  onClose: () => void;
  onSelect: (vertex: CampusVertex, role: 'origin' | 'destination') => void;
}

const CATEGORIES: { label: string; type: LocationType | 'ALL' }[] = [
  { label: 'All Places', type: 'ALL' },
  { label: 'Academic & Blocks', type: 'ACADEMIC' },
  { label: 'Laboratories', type: 'LABORATORY' },
  { label: 'Library & Study', type: 'LIBRARY' },
  { label: 'Food & Canteen', type: 'DINING' },
  { label: 'Hostels & Living', type: 'HOSTEL' },
  { label: 'Sports & Fitness', type: 'SPORTS' },
  { label: 'Gates & Entrances', type: 'ENTRANCE' },
  { label: 'Health & Clinic', type: 'HEALTH' },
  { label: 'Campus Amenities', type: 'AMENITY' },
];

export const CampusDirectoryModal: React.FC<CampusDirectoryModalProps> = ({
  vertices,
  onClose,
  onSelect,
}) => {
  const [activeCategory, setActiveCategory] = useState<LocationType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = vertices.filter((v) => {
    const matchesCat = activeCategory === 'ALL' || v.type === activeCategory;
    const matchesSearch =
      !searchQuery ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h2 className="text-sm font-bold">Amrita Chennai Campus Directory</h2>
            <p className="text-[11px] text-slate-400">
              Verified campus buildings, facilities, and academic departments
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by building name, department, or keyword (e.g., CSE, Mess, Gym)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.type}
                onClick={() => setActiveCategory(cat.type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat.type
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Locations */}
        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {filtered.map((vertex) => (
            <div
              key={vertex.id}
              className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-2 hover:border-slate-600 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-100 text-xs">{vertex.name}</div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {vertex.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {vertex.description || 'Verified campus facility.'}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                  <span>Elev: {vertex.elevationMeters}m</span>
                  <span>·</span>
                  <span>{vertex.accessible ? '♿ Accessible' : 'Stairs Only'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                <button
                  onClick={() => {
                    onSelect(vertex, 'origin');
                    onClose();
                  }}
                  className="flex-1 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg font-semibold text-center transition-colors"
                >
                  Set as Start
                </button>
                <button
                  onClick={() => {
                    onSelect(vertex, 'destination');
                    onClose();
                  }}
                  className="flex-1 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-semibold text-center transition-colors"
                >
                  Set as Destination
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
