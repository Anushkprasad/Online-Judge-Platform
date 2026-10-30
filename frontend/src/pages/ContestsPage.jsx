import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CalendarClock, Clock, History, Radio, Trophy } from 'lucide-react';

const statusStyles = {
  live: 'bg-emerald-500/10 text-emerald-400',
  upcoming: 'bg-blue-500/10 text-blue-400',
  ended: 'bg-slate-800 text-slate-400',
};

const ContestsPage = () => {
  const [contests, setContests] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/contests', { params: status ? { status } : {} });
        setContests(response.data.data);
      } catch (error) {
        console.error('Failed to load contests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, [status]);

  const featuredContest = useMemo(
    () => contests.find((contest) => contest.status === 'live') || contests[0],
    [contests]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contests</h1>
          <p className="text-slate-400">Weekly and monthly programming rounds with live standings.</p>
        </div>
        <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1">
          {[
            ['', 'All'],
            ['live', 'Live'],
            ['upcoming', 'Upcoming'],
            ['ended', 'History'],
          ].map(([value, label]) => (
            <button
              key={label}
              onClick={() => setStatus(value)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                status === value ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {featuredContest && (
        <section className="border border-slate-800 bg-slate-900 rounded-lg p-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <Radio className="w-4 h-4" />
              Featured Round
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{featuredContest.title}</h2>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">{featuredContest.description || 'Solve the set, climb the board, and bank rating points after the round closes.'}</p>
            </div>
          </div>
          <Link
            to={`/contests/${featuredContest._id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Trophy className="w-4 h-4" />
            Open Contest
          </Link>
        </section>
      )}

      <div className="border border-slate-800 bg-slate-900 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading contests...</div>
        ) : contests.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No contests found for this view.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {contests.map((contest) => (
              <Link
                key={contest._id}
                to={`/contests/${contest._id}`}
                className="grid gap-4 p-5 transition-colors hover:bg-slate-800/40 lg:grid-cols-[1.4fr_1fr_1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white">{contest.title}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[contest.status]}`}>
                      {contest.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{contest.type} contest</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CalendarClock className="w-4 h-4 text-slate-500" />
                  {new Date(contest.startTime).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {contest.durationMinutes} min
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <History className="w-4 h-4 text-slate-500" />
                  {contest.leaderboard?.length || 0} participants
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestsPage;
