import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { BarChart3, Users, Code, BookOpen, Trophy, MessageSquare } from 'lucide-react';

const AnalyticsDashboard = () => {
  const { token } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/analytics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg text-gray-600">Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-red-600">{error}</div>
      </AdminLayout>
    );
  }

  const stats = analytics.summary || {};
  const recentActivity = analytics.recentActivity || {};
  const topProblems = analytics.topProblems || [];
  const difficultyDistribution = analytics.difficultyDistribution || [];

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-2">Overview of your platform metrics</p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={Code}
            label="Total Problems"
            value={stats.totalProblems || 0}
            color="bg-green-500"
          />
          <StatCard
            icon={BookOpen}
            label="Total Courses"
            value={stats.totalCourses || 0}
            color="bg-purple-500"
          />
          <StatCard
            icon={Trophy}
            label="Total Contests"
            value={stats.totalContests || 0}
            color="bg-orange-500"
          />
          <StatCard
            icon={BarChart3}
            label="Total Submissions"
            value={stats.totalSubmissions || 0}
            color="bg-pink-500"
          />
          <StatCard
            icon={MessageSquare}
            label="Total Discussions"
            value={stats.totalDiscussions || 0}
            color="bg-indigo-500"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Submissions (Last 7 Days)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recentActivity.submissionsLast7Days || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">New Users (Last 30 Days)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recentActivity.newUsersLast30Days || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Problem Difficulty</h3>
            <div className="space-y-3">
              {difficultyDistribution.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {item._id}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item._id === 'easy'
                            ? 'bg-green-500'
                            : item._id === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (item.count / stats.totalProblems) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Problems */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Problems by Submissions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Problem Title
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Submissions
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Accepted
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Acceptance Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProblems.map((problem) => (
                  <tr key={problem._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{problem.title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{problem.submissionCount}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{problem.acceptedCount}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {problem.acceptanceRate?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsDashboard;
