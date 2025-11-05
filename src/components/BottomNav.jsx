import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Phone } from 'lucide-react';

const Tab = ({ to, label, icon: Icon }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`
      }
    >
      <Icon size={22} />
      <span className="text-xs">{label}</span>
    </NavLink>
  );
};

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-gray-200">
      <div className="mx-auto max-w-md grid grid-cols-3 gap-2 px-2 py-1">
        <Tab to="/" label="Home" icon={Home} />
        <Tab to="/my" label="My Bookings" icon={Calendar} />
        <Tab to="/contact" label="Contact" icon={Phone} />
      </div>
    </nav>
  );
}
