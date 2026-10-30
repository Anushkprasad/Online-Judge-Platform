import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { CalendarClock, Code2, Medal, Radio, Trophy } from 'lucide-react';

const apiRoot = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const socketRoot = apiRoot.replace(/\/api\/?$/, '');

const ContestDetailPage = () => {
  const { id } = useParams();
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContest = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/contests/${id}`);
        setContest(response.data.data);
        setLeaderboard(response.data.data.leaderboard || []);
      } catch (error) {
        console.error('Failed to load contest:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [id]);

  useEffect(() => {
    const socket = io(socketRoot, { transports: ['websocket', 'polling'] });
    socket.emit('contest:join', id);
    socket.on('contest:leaderboard', (payload) => {
      if (String(payload.contestId) === id) setLeaderboard(payload.leaderboard);
    });

    const interval = window.setInterval(async () => {
      try {
        const response = await axios.get(`/contests/${id}/leaderboard`);
        setLeaderboard(response.data.data);
      } catch (error) {
        console.error('Failed to refresh leaderboard:', error);
      }
    }, 15000);

    return () => {
      window.clearInterval(interval);
      socket.emit('contest:leave', id);
      socket.disconnect();
    };
  }, [id]);

  if (loading) return <div className="p-8 text-slate-500">Loading contest...</div>;
  if (!contest) return <div className="p-8 text-slate-400">Contest not found.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
            <Trophy className="w-4 h-4" />
            {contest.type} contest
          </div>
          <h1 className="text-3xl font-bold text-white mt-2">{contest.title}</h1>
          <p className="text-slate-400 mt-2 max-w-3xl">{contest.description}</p>
        </div>
        <div className="border border-slate-800 bg-slate-900 rounded-lg p-4 min-w-64">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <CalendarClock className="w-4 h-4 text-slate-500" />
            {new Date(contest.startTime).toLocaleString()}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-400">
            <Radio className="w-4 h-4" />
            {contest.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        <section className="border border-slate-800 bg-slate-900 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2 text-white font-bold">
            <Code2 className="w-4 h-4 text-blue-400" />
            Problem Set
          </div>
          <div className="divide-y divide-slate-800">
            {contest.problems.map((problem) => (
              <Link
                key={problem._id}
                to={`/problems/${problem.slug}?contest=${contest._id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-slate-800/40"
              >
                <div>
                  <div className="font-semibold text-slate-100">{problem.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{problem.category}</div>
                </div>
                <span className="text-xs font-bold uppercase text-slate-400">{problem.difficulty}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="border border-slate-800 bg-slate-900 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Medal className="w-4 h-4 text-amber-400" />
              Live Leaderboard
            </div>
            <span className="text-xs text-slate-500">Updates live, polling fallback enabled</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {leaderboard.length === 0 ? (
                  <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-500">No accepted submissions yet.</td></tr>
                ) : leaderboard.map((entry) => (
                  <tr key={entry.userId?._id || entry.userId}>
                    <td className="px-5 py-3 font-bold text-white">#{entry.rank}</td>
                    <td className="px-5 py-3 text-slate-200">{entry.userId?.username || 'Coder'}</td>
                    <td className="px-5 py-3 text-emerald-400 font-semibold">{entry.score}</td>
                    <td className="px-5 py-3 text-slate-400">{entry.penalty} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContestDetailPage;
