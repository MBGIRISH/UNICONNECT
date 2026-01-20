import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

export type SharedLocation = {
  latitude: number;
  longitude: number;
  name?: string;
};

export default function LocationCard({ location }: { location: SharedLocation }) {
  const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  const subtitle = location.name || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors overflow-hidden"
    >
      <div className="p-3 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <MapPin size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Shared location</p>
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        </div>
        <ExternalLink size={16} className="text-slate-400 flex-shrink-0 mt-1" />
      </div>
      <div className="px-3 pb-3">
        <div className="h-16 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-500">
          Tap to open in Maps
        </div>
      </div>
    </a>
  );
}


