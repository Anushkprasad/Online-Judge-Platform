import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Trophy, 
  Flame, 
  BookOpen, 
  Code, 
  TrendingUp, 
  Award, 
  ChevronRight,
  Zap,
  CheckCircle2
} from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/users/dashboard');
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400">
        Unable to load dashboard. Please verify your connection.
      </div>
    );
  }

  // GitHub contribution grid helper
  const getContributionGrid = () => {
    const grid = [];
    const today = new Date();
    // Generate grid for last 12 weeks (84 days)
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const daySubmissions = data.submissionHistory?.filter(s => s.date === dateString) || [];
      const hasAccepted = daySubmissions.some(s => s.status === 'Accepted');
      const count = daySubmissions.length;

      let color = 'bg-slate-900 border-slate-950/20'; // default empty
      if (count > 0) {
        if (hasAccepted) {
          color = count > 2 ? 'bg-emerald-400 border-emerald-500/20' : 'bg-emerald-600 border-emerald-700/20';
        } else {
          color = 'bg-amber-600/60 border-amber-700/20';
        }
      }

      grid.push({
        date: dateString,
        color,
        count,
      });
    }
    return grid;
  };

  const contributions = getContributionGrid();

  // SVG Donut Chart variables
  const easyPct = data.solvedStats.total > 0 ? (data.solvedStats.easy / data.solvedStats.total) * 100 : 0;
  const mediumPct = data.solvedStats.total > 0 ? (data.solvedStats.medium / data.solvedStats.total) * 100 : 0;
  const hardPct = data.solvedStats.total > 0 ? (data.solvedStats.hard / data.solvedStats.total) * 100 : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-900/10 via-slate-900 to-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome Back, {data.username}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">Ready to solve today's challenge and keep your streak active?</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl">
          <Flame className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Streak Days</div>
            <div className="text-xl font-black text-white">{data.streak} Days</div>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Problems Solved Stats Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Solved Problems</span>
              <h3 className="text-4xl font-black text-white mt-1">{data.solvedStats.total}</h3>
            </div>
            <Code className="w-5 h-5 text-blue-500" />
          </div>

          {/* Difficulty Splits */}
          <div className="space-y-3 mt-6">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                <span>Easy</span>
                <span className="text-emerald-400 font-bold">{data.solvedStats.easy} Solved</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${easyPct}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                <span>Medium</span>
                <span className="text-amber-400 font-bold">{data.solvedStats.medium} Solved</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${mediumPct}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                <span>Hard</span>
                <span className="text-rose-400 font-bold">{data.solvedStats.hard} Solved</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${hardPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* SVG Distribution Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-between">
          <div className="flex justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 uppercase">Difficulty Ratio</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center my-4">
            {/* Custom SVG Donut */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#020617" strokeWidth="3" />
              {data.solvedStats.total > 0 ? (
                <>
                  {/* Easy segment */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3" 
                    strokeDasharray={`${easyPct} ${100 - easyPct}`} strokeDashoffset="0" />
                  {/* Medium segment */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="3" 
                    strokeDasharray={`${mediumPct} ${100 - mediumPct}`} strokeDashoffset={`-${easyPct}`} />
                  {/* Hard segment */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f43f5e" strokeWidth="3" 
                    strokeDasharray={`${hardPct} ${100 - hardPct}`} strokeDashoffset={`-${easyPct + mediumPct}`} />
                </>
              ) : (
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="3" 
                  strokeDasharray="100 0" strokeDashoffset="0" />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-black text-white">{data.solvedStats.total}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Total</span>
            </div>
          </div>

          <div className="flex gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 block"></span>Easy</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span>Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500 block"></span>Hard</span>
          </div>
        </div>

        {/* Credentials / Certificates Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Certificates Issued</span>
              <h3 className="text-4xl font-black text-white mt-1">{data.certificates?.length || 0}</h3>
            </div>
            <Award className="w-5 h-5 text-blue-500" />
          </div>

          {/* Badges checklist */}
          <div className="mt-6 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Earned Badges</div>
            {data.badges && data.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.badges.map((b, idx) => (
                  <span key={idx} className="flex items-center gap-1 bg-blue-950/40 border border-blue-900/50 text-blue-300 text-xs px-2.5 py-1 rounded-full">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {b.badgeId?.name || 'Achievement'}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No badges earned yet. Complete courses to unlock achievements!</p>
            )}
          </div>
        </div>
      </div>

      {/* Contributions Calendar Heat Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Daily Coding Activity</h2>
          <p className="text-xs text-slate-400 mt-0.5">Your compilation and problem submissions logs over the last 12 weeks</p>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
            {contributions.map((day, idx) => (
              <div
                key={idx}
                title={`${day.date}: ${day.count} submissions`}
                className={`w-3.5 h-3.5 rounded-[3px] border ${day.color} transition-all hover:scale-110 cursor-pointer`}
              ></div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-800/40">
          <span>{contributions[0]?.date ? new Date(contributions[0].date).toLocaleDateString() : ''}</span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <span className="w-3.5 h-3.5 bg-slate-900 border border-slate-950/20 rounded-[3px]"></span>
            <span className="w-3.5 h-3.5 bg-emerald-600 rounded-[3px]"></span>
            <span className="w-3.5 h-3.5 bg-emerald-400 rounded-[3px]"></span>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Recently Enrolled Courses */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Recently Accessed Courses</h2>
        {data.coursesProgress && data.coursesProgress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.coursesProgress.map((c) => (
              <div key={c.courseId} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-base leading-snug">{c.title}</h3>
                  <div className="flex justify-between text-xs text-slate-400 font-semibold">
                    <span>Lessons Completed</span>
                    <span>{c.completedCount} / {c.totalCount}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${c.percent}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-800/40">
                  <button
                    onClick={() => navigate(`/courses/${c.courseId}`)}
                    className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-white"
                  >
                    Resume Study
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-sm">
            You haven't enrolled in any programming courses yet.{' '}
            <Link to="/courses" className="text-blue-500 hover:underline font-semibold ml-1">
              Explore Catalog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
