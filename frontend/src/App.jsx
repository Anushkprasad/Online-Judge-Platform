import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import CoursesPage from './pages/CoursesPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import ContestsPage from './pages/ContestsPage';
import ContestDetailPage from './pages/ContestDetailPage';
import LeaderboardPage from './pages/LeaderboardPage';
import DiscussionPage from './pages/DiscussionPage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationPreferencesPage from './pages/NotificationPreferencesPage';
import Dashboard from './pages/Dashboard';
import AdminAnalyticsDashboard from './pages/AdminAnalyticsDashboard';
import AdminUsersManagement from './pages/AdminUsersManagement';
import AdminProblemsManagement from './pages/AdminProblemsManagement';
import AdminCoursesManagement from './pages/AdminCoursesManagement';
import AdminContestsManagement from './pages/AdminContestsManagement';
import AdminDiscussionModeration from './pages/AdminDiscussionModeration';
import AdminNotificationCenter from './pages/AdminNotificationCenter';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Code2, 
  BookOpen, 
  Trophy, 
  Briefcase,
  MessageSquare, 
  LogOut, 
  User, 
  Bell,
  Shield
} from 'lucide-react';

// Navigation Sidebar Layout Shell
const SidebarLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      {children}
    </Link>
  );
};

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/notifications', { params: { unreadOnly: true } });
        setUnreadCount(response.data.unreadCount || 0);
      } catch (error) {
        console.error('Failed to load notification count:', error);
      }
    };

    fetchUnreadCount();
    const interval = window.setInterval(fetchUnreadCount, 30000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-slate-900 bg-slate-950 flex flex-col justify-between p-4">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
              C
            </div>
            <span className="font-bold text-lg tracking-wider text-white">CODERANK</span>
          </div>
          <nav className="flex flex-col gap-1">
            <SidebarLink to="/" icon={LayoutDashboard}>Dashboard</SidebarLink>
            <SidebarLink to="/problems" icon={Code2}>Problems</SidebarLink>
            <SidebarLink to="/courses" icon={BookOpen}>Courses</SidebarLink>
            <SidebarLink to="/contests" icon={Trophy}>Contests</SidebarLink>
            <SidebarLink to="/leaderboard" icon={Trophy}>Leaderboard</SidebarLink>
            <SidebarLink to="/forum" icon={MessageSquare}>Discussions</SidebarLink>
            <SidebarLink to="/interview-prep" icon={Briefcase}>Interview Prep</SidebarLink>
            {user?.role === 'admin' && (
              <SidebarLink to="/admin/dashboard" icon={Shield}>Admin Panel</SidebarLink>
            )}
          </nav>
        </div>
        
        <div className="flex flex-col gap-2">
          <SidebarLink to="/profile" icon={User}>Profile</SidebarLink>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-slate-900 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40">
          <div className="text-sm text-slate-400">
            Welcome back, <span className="text-white font-medium">{user?.username || 'Developer'}</span>!
          </div>
          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link 
              to="/profile" 
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden text-sm font-medium text-slate-200 hover:border-blue-500 transition-all"
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="User" className="w-full h-full object-cover" />
              ) : (
                (user?.username?.[0] || 'U').toUpperCase()
              )}
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 bg-slate-950 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedAdminRoute>
                <Routes>
                  <Route path="dashboard" element={<AdminAnalyticsDashboard />} />
                  <Route path="users" element={<AdminUsersManagement />} />
                  <Route path="problems" element={<AdminProblemsManagement />} />
                  <Route path="courses" element={<AdminCoursesManagement />} />
                  <Route path="contests" element={<AdminContestsManagement />} />
                  <Route path="discussions" element={<AdminDiscussionModeration />} />
                  <Route path="notifications" element={<AdminNotificationCenter />} />
                </Routes>
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/problems" element={<ProblemsPage />} />
                    <Route path="/problems/:slug" element={<ProblemDetailPage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/courses/:id" element={<CoursePlayerPage />} />
                    <Route path="/contests" element={<ContestsPage />} />
                    <Route path="/contests/:id" element={<ContestDetailPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/forum" element={<DiscussionPage />} />
                    <Route path="/interview-prep" element={<InterviewPrepPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<NotificationPreferencesPage />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
