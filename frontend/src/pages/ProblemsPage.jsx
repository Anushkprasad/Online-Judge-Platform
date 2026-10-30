import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, SlidersHorizontal, CheckCircle2, Bookmark, BookmarkCheck, ArrowRight, Heart } from 'lucide-react';

const ProblemsPage = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [company, setCompany] = useState('');

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (difficulty) params.difficulty = difficulty;
      if (category) params.category = category;
      if (company) params.company = company;
      if (search) params.search = search;

      const response = await axios.get('/problems', { params });
      setProblems(response.data.data);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [difficulty, category, company]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProblems();
  };

  const toggleFavorite = async (id) => {
    try {
      const response = await axios.post(`/problems/${id}/favorite`);
      const { isFavorite } = response.data;
      setProblems((prev) =>
        prev.map((prob) =>
          prob._id === id ? { ...prob, isFavorite } : prob
        )
      );
    } catch (error) {
      console.error('Failed to toggle favorite status:', error);
    }
  };

  // Static tags for sidebar filter helpers
  const categories = ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Greedy', 'Sorting', 'Searching'];
  const companies = ['Google', 'Meta', 'Amazon', 'Apple', 'Netflix', 'Microsoft', 'Uber'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Problem Set</h1>
          <p className="text-slate-400">Sharpen your programming skills on data structures and algorithms</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 self-start">
          <div className="flex items-center gap-2 text-white font-semibold">
            <SlidersHorizontal className="w-4 h-4 text-blue-500" />
            <span>Filters</span>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-white rounded-lg pl-10 pr-4 py-2 outline-none text-sm transition-all placeholder:text-slate-700"
            />
            <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 hover:text-slate-300">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 text-slate-300 text-sm rounded-lg p-2.5 outline-none transition-all"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Topic Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 text-slate-300 text-sm rounded-lg p-2.5 outline-none transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Company Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Tags</label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 text-slate-300 text-sm rounded-lg p-2.5 outline-none transition-all"
            >
              <option value="">All Companies</option>
              {companies.map((comp) => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Problems List Table */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              Loading problems list...
            </div>
          ) : problems.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No problems found matching these criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase bg-slate-900/40">
                    <th className="px-6 py-4 w-12 text-center">Status</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Topic</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4 w-16 text-center">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {problems.map((problem) => (
                    <tr key={problem._id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 text-center">
                        {problem.isSolved ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-slate-800 rounded-full mx-auto group-hover:border-slate-700"></div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/problems/${problem.slug}`}
                          className="font-semibold text-slate-100 hover:text-blue-400 transition-colors block text-sm"
                        >
                          {problem.title}
                        </Link>
                        {problem.companyTags && problem.companyTags.length > 0 && (
                          <div className="flex gap-1.5 mt-1.5">
                            {problem.companyTags.map((t) => (
                              <span key={t} className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {problem.category}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            problem.difficulty === 'easy'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : problem.difficulty === 'medium'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleFavorite(problem._id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            problem.isFavorite
                              ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                              : 'text-slate-500 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Heart className="w-4 h-4" fill={problem.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemsPage;
