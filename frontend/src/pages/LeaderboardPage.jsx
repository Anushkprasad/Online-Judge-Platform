import { useEffect, useState } from 'react';
import axios from 'axios';
import { Medal, School, Star, Users } from 'lucide-react';

const scopes = [
  { value: 'global', label: 'Global', icon: Medal },
  { value: 'college', label: 'College', icon: School },
  { value: 'friends', label: 'Friends', icon: Users },
];

const LeaderboardPage = () => {
  const [scope, setScope] = useState('global');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/leaderboard', { params: { scope } });
        setRows(response.data.data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [scope]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <p className="text-slate-400">Compare rating, solves, streaks, and contest history.</p>
        </div>
        <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1">
          {scopes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setScope(value)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                scope === value ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="border border-slate-800 bg-slate-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Rank</th>
                <th className="px-5 py-4">Coder</th>
                <th className="px-5 py-4">Rating</th>
                <th className="px-5 py-4">Solved</th>
                <th className="px-5 py-4">Streak</th>
                <th className="px-5 py-4">Recent Contest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {loading ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-slate-500">Loading leaderboard...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-slate-500">No users found for this view.</td></tr>
              ) : rows.map((row) => {
                const recent = row.contestHistory?.[row.contestHistory.length - 1];
                return (
                  <tr key={row._id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-4 font-bold text-white">#{row.rank}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-100">{row.username}</div>
                      <div className="text-xs text-slate-500">{row.college || 'Independent'}</div>
                    </td>
                    <td className="px-5 py-4 text-amber-400 font-bold">
                      <span className="inline-flex items-center gap-1"><Star className="w-4 h-4" />{row.rating}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{row.solvedCount}</td>
                    <td className="px-5 py-4 text-slate-300">{row.streak}</td>
                    <td className="px-5 py-4 text-slate-400">
                      {recent?.contestId?.title ? `${recent.contestId.title} · #${recent.rank} · ${recent.ratingChange >= 0 ? '+' : ''}${recent.ratingChange}` : 'No contest yet'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default LeaderboardPage;
