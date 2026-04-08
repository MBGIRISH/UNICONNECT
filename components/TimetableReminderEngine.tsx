import React, { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../App';
import { addNotification } from '../services/notificationService';
import { to12h } from './TimePicker12h';

type ClassItem = {
  id: string;
  subject: string;
  day: string;
  startTime: string; // 'HH:mm'
  endTime: string;   // 'HH:mm'
  location: string;
  professor?: string;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime12h(value24: string) {
  const parsed = to12h(value24);
  const minute = String(parsed.minute).padStart(2, '0');
  return `${parsed.hour12}:${minute} ${parsed.ampm}`;
}

function toMinutes(value24: string) {
  const [hhStr, mmStr] = (value24 || '00:00').split(':');
  const hh = Math.min(23, Math.max(0, parseInt(hhStr || '0', 10) || 0));
  const mm = Math.min(59, Math.max(0, parseInt(mmStr || '0', 10) || 0));
  return hh * 60 + mm;
}

// Runs timetable notifications globally while the app is open.
export default function TimetableReminderEngine() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());
  const lastDateRef = useRef<string>('');

  // Keep local class list in sync with Firestore.
  useEffect(() => {
    if (!user || !db) {
      setClasses([]);
      return;
    }

    const q = query(collection(db, 'timetable'), where('userId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: ClassItem[] = [];
        snap.forEach((d) => next.push({ id: d.id, ...(d.data() as any) }));
        setClasses(next);
      },
      (err) => {
        console.error('Timetable reminder: failed to load classes', err);
        setClasses([]);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  // Ask permission once (some browsers may ignore without user gesture, but harmless).
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    Notification.requestPermission().catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || !db || classes.length === 0) return;

    const tick = () => {
      const now = new Date();
      const currentDate = now.toDateString();

      if (lastDateRef.current !== currentDate) {
        lastDateRef.current = currentDate;
        notifiedRef.current = new Set();
      }

      // No Sunday in UI.
      if (now.getDay() === 0) return;

      const currentDay = DAYS[now.getDay() - 1];
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const todayClasses = classes.filter((c) => c.day === currentDay);
      const candidates = todayClasses
        .map((c) => ({ c, diff: toMinutes(c.startTime) - nowMinutes }))
        .filter((x) => x.diff >= 5 && x.diff <= 10);

      if (candidates.length === 0) return;

      for (const { c, diff } of candidates) {
        if (notifiedRef.current.has(c.id)) continue;
        notifiedRef.current.add(c.id);

        const timeLabel = formatTime12h(c.startTime);
        const message = `${c.subject} starts in ${diff} minutes at ${timeLabel} in ${c.location}`;

        addNotification(user.uid, {
          type: 'class_reminder',
          title: 'Class Starting Soon',
          message,
          link: '/timetable',
          createdAt: new Date()
        }).catch((err) => console.error('Timetable reminder: failed to add notification', err));

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('📚 Class Reminder', {
              body: `${c.subject} starts in ${diff} minutes\nTime: ${timeLabel}\nLocation: ${c.location}${c.professor ? `\nProfessor: ${c.professor}` : ''}`,
              tag: `class-${c.id}`,
              requireInteraction: false
            });
          } catch (err) {
            console.error('Timetable reminder: browser notification failed', err);
          }
        }
      }
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [classes, user?.uid]);

  return null;
}

