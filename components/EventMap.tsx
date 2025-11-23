import React from 'react';
import { MapPin } from 'lucide-react';
import { Event } from '../types';

interface EventMapProps {
  events: Array<Event & { distance?: number; distanceText?: string }>;
  userLocation?: { lat: number; lon: number } | null;
  onEventClick?: (event: Event) => void;
}

const EventMap: React.FC<EventMapProps> = ({ events, userLocation, onEventClick }) => {
  // For now, show a list view with map pins
  // This can be enhanced with Google Maps API later
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 h-[600px] overflow-y-auto">
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center text-slate-500 py-20">
            <MapPin size={48} className="mx-auto mb-4 text-slate-300" />
            <p>No events to display on map</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              onClick={() => onEventClick?.(event)}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <MapPin size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{event.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{event.location}</p>
                  {event.college && (
                    <p className="text-xs text-indigo-600 mb-1">🎓 {event.college}</p>
                  )}
                  {event.distanceText && (
                    <p className="text-xs text-primary font-medium">📍 {event.distanceText}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
        <p className="text-sm text-indigo-800">
          <strong>🗺️ Map View Coming Soon!</strong><br />
          Full Google Maps integration with interactive pins will be available soon.
          For now, events are listed above with their locations.
        </p>
      </div>
    </div>
  );
};

export default EventMap;

