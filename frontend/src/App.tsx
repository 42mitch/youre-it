import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import TagPage from './pages/TagPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PlayersPage from './pages/PlayersPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto relative min-h-screen">
        <div className="pb-20">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tag" element={<TagPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/players" element={<PlayersPage />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}