import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  addDoc,
} from 'firebase/firestore';
import Loader from './Loader';

const OPEN_HOUR = 6;
const CLOSE_HOUR = 22;

function ymd(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toMinutes(h, m = 0) {
  return h * 60 + m;
}

function formatHour(h) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = ((h + 11) % 12) + 1;
  return `${hr} ${suffix}`;
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(localStorage.getItem('isAdmin') === 'true');
  const [key, setKey] = useState('');
  const [date, setDate] = useState(ymd(new Date()));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', date),
      orderBy('startMinutes', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBookings(data);
      setLoading(false);
    });
    return () => unsub();
  }, [authed, date]);

  function login() {
    if (key === 'rjadmin123') {
      localStorage.setItem('isAdmin', 'true');
      setAuthed(true);
    } else {
      alert('Invalid key');
    }
  }

  function logout() {
    localStorage.removeItem('isAdmin');
    setAuthed(false);
  }

  async function cancel(id) {
    if (!confirm('Cancel this booking?')) return;
    await deleteDoc(doc(db, 'bookings', id));
  }

  async function addOffline(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    const phone = String(form.get('phone') || '').trim();
    const startHour = Number(form.get('startHour'));
    const endHour = Number(form.get('endHour'));
    if (!name || !phone) return alert('Enter name and phone');
    if (endHour <= startHour) return alert('End must be after start');

    // Overlap check
    const sMin = toMinutes(startHour);
    const eMin = toMinutes(endHour);
    const overlap = bookings.some((b) => sMin < b.endMinutes && eMin > b.startMinutes);
    if (overlap) return alert('Overlaps with existing booking');

    await addDoc(collection(db, 'bookings'), {
      name,
      phone,
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(endHour).padStart(2, '0')}:00`,
      startMinutes: sMin,
      endMinutes: eMin,
      date,
      createdAt: Date.now(),
      source: 'admin',
    });
    e.currentTarget.reset();
  }

  function exportCSV() {
    const header = ['name','phone','date','startTime','endTime'];
    const rows = bookings.map(b => [b.name,b.phone,b.date,b.startTime,b.endTime]);
    const csv = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rj_bookings_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 pt-10 pb-24">
        <h1 className="text-lg font-semibold mb-3">Admin Access</h1>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <label className="text-xs text-gray-500">Enter Admin Key</label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="Admin Key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button onClick={login} className="mt-3 w-full py-2 rounded-lg bg-blue-600 text-white">Enter</button>
        </div>
      </div>
    );
  }

  const hours = useMemo(() => {
    const arr = [];
    for (let h = OPEN_HOUR; h <= CLOSE_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        <button onClick={logout} className="text-sm text-red-600">Logout</button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button className="px-3 py-2 rounded-lg border" onClick={() => setDate(ymd(new Date(Date.parse(date) - 86400000)))}>← Prev</button>
        <div className="flex-1 text-center text-sm">{date}</div>
        <button className="px-3 py-2 rounded-lg border" onClick={() => setDate(ymd(new Date(Date.parse(date) + 86400000)))}>Next →</button>
        <button className="px-3 py-2 rounded-lg border" onClick={() => setDate(ymd(new Date()))}>Today</button>
      </div>

      <form onSubmit={addOffline} className="p-4 rounded-xl border bg-white shadow-sm mb-4 grid grid-cols-2 gap-3">
        <input className="col-span-2 rounded-lg border px-3 py-2" name="name" placeholder="Name" />
        <input className="col-span-2 rounded-lg border px-3 py-2" name="phone" placeholder="Phone" />
        <div>
          <label className="text-xs text-gray-500">Start</label>
          <select name="startHour" className="w-full mt-1 rounded-lg border px-3 py-2">
            {hours.slice(0, -1).map((h) => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">End</label>
          <select name="endHour" className="w-full mt-1 rounded-lg border px-3 py-2">
            {hours.slice(1).map((h) => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="col-span-2 w-full py-2 rounded-lg bg-green-600 text-white">Add Offline Booking</button>
      </form>

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium">All Bookings</h2>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg border" onClick={() => setDate(date => date)}>Refresh</button>
          <button className="px-3 py-2 rounded-lg border" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : bookings.length === 0 ? (
        <p className="text-sm text-gray-600">No bookings for this date.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id} className="p-4 rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{b.name} <span className="text-gray-500">({b.phone})</span></div>
                  <div className="text-sm text-gray-600">{b.startTime} – {b.endTime}</div>
                </div>
                <button onClick={() => cancel(b.id)} className="text-red-600 text-sm">Cancel</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
