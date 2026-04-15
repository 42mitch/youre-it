import { NavLink } from 'react-router-dom';
import { Home, Tag, Trophy, Users, ScrollText } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/tag', label: 'Tag', Icon: Tag },
  { to: '/leaderboard', label: 'Board', Icon: Trophy },
  { to: '/history', label: 'History', Icon: ScrollText },
  { to: '/players', label: 'Players', Icon: Users },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#0d0d14]/95 backdrop-blur-xl border-t border-white/5 flex safe-bottom">
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              isActive ? 'text-[#ff3b3b]' : 'text-white/25 hover:text-white/50'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-xs font-mono">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}