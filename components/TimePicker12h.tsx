import React, { useMemo } from 'react';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function to12h(value24: string) {
  const [hhStr, mmStr] = (value24 || '09:00').split(':');
  const hh = Math.min(23, Math.max(0, parseInt(hhStr || '0', 10)));
  const mm = Math.min(59, Math.max(0, parseInt(mmStr || '0', 10)));
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return { hour12, minute: mm, ampm };
}

export function to24h(hour12: number, minute: number, ampm: 'AM' | 'PM') {
  let hh = hour12 % 12;
  if (ampm === 'PM') hh += 12;
  return `${pad2(hh)}:${pad2(minute)}`;
}

export default function TimePicker12h({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value24: string) => void;
  label?: string;
}) {
  const parsed = useMemo(() => to12h(value), [value]);

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        <select
          value={parsed.hour12}
          onChange={(e) => onChange(to24h(parseInt(e.target.value, 10), parsed.minute, parsed.ampm as any))}
          className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base touch-manipulation"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <select
          value={parsed.minute}
          onChange={(e) => onChange(to24h(parsed.hour12, parseInt(e.target.value, 10), parsed.ampm as any))}
          className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base touch-manipulation"
        >
          {Array.from({ length: 60 }, (_, i) => i).map((m) => (
            <option key={m} value={m}>{pad2(m)}</option>
          ))}
        </select>
        <select
          value={parsed.ampm}
          onChange={(e) => onChange(to24h(parsed.hour12, parsed.minute, e.target.value as 'AM' | 'PM'))}
          className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm sm:text-base touch-manipulation"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}


