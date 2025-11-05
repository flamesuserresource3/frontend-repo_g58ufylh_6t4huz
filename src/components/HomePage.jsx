import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import Loader from './Loader';

const OPEN_HOUR = 6; // 6 AM
const CLOSE_HOUR = 22; // 10 PM (22)

function toMinutes(h, m = 0) {
  return h * 60 + m;
}

function formatHour(h) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = ((h + 11) % 12) + 1;
  return `${hr} ${suffix}`;
}

function ymd(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function hasOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export default function HomePage() {
  const [date, setDate] = useState(ymd(new Date()));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(localStorage.getItem('rj_name') || '');
  const [phone, setPhone] = useState(localStorage.getItem('rj_phone') || '');
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(8);
  const [toast, setToast] = useState('');

  useEffect(() => {
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
  }, [date]);

  useEffect(() => {
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const hours = useMemo(() => {
    const arr = [];
    for (let h = OPEN_HOUR; h <= CLOSE_HOUR; h++) arr.push(h);
    return arr;
  }, []);

  const slotStatus = useMemo(() => {
    // Build a map of booked hours for highlighting
    const status = {};
    for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) status[h] = 'available';
    bookings.forEach((b) => {
      for (let h = b.startMinutes / 60; h < b.endMinutes / 60; h++) {
        status[h] = 'booked';
      }
    });
    for (let h = startHour; h < endHour; h++) if (status[h] !== 'booked') status[h] = 'selected';
    return status;
  }, [bookings, startHour, endHour]);

  async function handleBook(e) {
    e.preventDefault();
    const sMin = toMinutes(startHour);
    const eMin = toMinutes(endHour);
    if (!name.trim() || !phone.trim()) return alert('Please enter your name and phone number.');
    if (eMin <= sMin) return alert('End time must be after start time.');

    // Check overlap
    const overlap = bookings.some((b) => hasOverlap(sMin, eMin, b.startMinutes, b.endMinutes));
    if (overlap) return alert('Selected time overlaps with an existing booking.');

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(endHour).padStart(2, '0')}:00`,
      startMinutes: sMin,
      endMinutes: eMin,
      date,
      createdAt: Date.now(),
    };
    try {
      await addDoc(collection(db, 'bookings'), payload);
      localStorage.setItem('rj_name', payload.name);
      localStorage.setItem('rj_phone', payload.phone);
      setToast('Booking Confirmed!');
    } catch (err) {
      console.error(err);
      alert('Failed to create booking. Please try again.');
    }
  }

  function changeDay(offset) {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(ymd(d));
  }

  function cardColor(h) {
    const s = slotStatus[h];
    if (s === 'booked') return 'bg-red-50 border-red-200 text-red-600';
    if (s === 'selected') return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    return 'bg-green-50 border-green-200 text-green-700';
  }

  function isHourDisabled(h) {
    return slotStatus[h] === 'booked';
  }

  return (
    <div className="pb-20">{/* space for bottom nav */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => changeDay(-1)} className="px-3 py-1.5 rounded-lg border text-sm">← Prev</button>
          <div className="text-lg font-semibold">RJ Pickleball</div>
          <button onClick={() => changeDay(1)} className="px-3 py-1.5 rounded-lg border text-sm">Next →</button>
        </div>
        <div className="max-w-md mx-auto px-4 pb-3 text-center text-sm text-gray-600">{date}</div>
      </header>

      {loading ? (
        <Loader label="Fetching bookings..." />
      ) : (
        <div className="max-w-md mx-auto px-4 py-4">
          <section className="mb-5">
            <h2 className="text-base font-semibold mb-2">Select Time Range</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border bg-white shadow-sm">
                <label className="text-xs text-gray-500">Start</label>
                <select
                  value={startHour}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setStartHour(v);
                    if (v >= endHour) setEndHour(v + 1);
                  }}
                  className="w-full mt-1 rounded-lg border px-3 py-2"
                >
                  {hours.slice(0, -1).map((h) => (
                    <option key={h} value={h} disabled={isHourDisabled(h)}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-3 rounded-xl border bg-white shadow-sm">
                <label className="text-xs text-gray-500">End</label>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border px-3 py-2"
                >
                  {hours.slice(1).map((h) => (
                    <option key={h} value={h} disabled={isHourDisabled(h - 1)}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i).map((h) => (
                <div key={h} className={`p-3 rounded-xl border text-sm text-center ${cardColor(h)}`}>
                  {formatHour(h)} – {formatHour(h + 1)}
                </div>
              ))}
            </div>
          </section>

          <form onSubmit={handleBook} className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <input
                className="w-full rounded-xl border px-4 py-3 shadow-sm"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="w-full rounded-xl border px-4 py-3 shadow-sm"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium shadow-md active:scale-[0.99]"
            >
              Book Now
            </button>
            <p className="text-xs text-gray-500 text-center">Selected: {formatHour(startHour)} – {formatHour(endHour)} on {date}</p>
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
