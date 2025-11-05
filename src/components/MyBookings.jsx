import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import Loader from './Loader';

function formatHourLabel(str) {
  const [hh] = str.split(':');
  const h = Number(hh);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = ((h + 11) % 12) + 1;
  return `${hr} ${suffix}`;
}

export default function MyBookings() {
  const [phone, setPhone] = useState(localStorage.getItem('rj_phone') || '');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    const q = query(
      collection(db, 'bookings'),
      where('phone', '==', phone),
      orderBy('date', 'desc'),
      orderBy('startMinutes', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBookings(data);
      setLoading(false);
    });
    return () => unsub();
  }, [phone]);

  function savePhone() {
    localStorage.setItem('rj_phone', phone);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24">
      <h1 className="text-lg font-semibold mb-3">My Bookings</h1>
      <div className="p-3 rounded-xl border bg-white shadow-sm mb-4">
        <label className="text-xs text-gray-500">Phone Number</label>
        <div className="mt-1 flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2"
            placeholder="Enter your phone to view bookings"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={savePhone}
          />
          <button className="px-3 py-2 rounded-lg border" onClick={savePhone}>Save</button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : bookings.length === 0 ? (
        <p className="text-sm text-gray-600">No bookings found.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id} className="p-4 rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{b.date}</div>
                  <div className="text-sm text-gray-600">{formatHourLabel(b.startTime)} – {formatHourLabel(b.endTime)}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Booked</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">Name: {b.name}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
