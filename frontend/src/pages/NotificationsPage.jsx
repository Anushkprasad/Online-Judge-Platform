import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Bell, CheckCheck, Mail, Trophy } from 'lucide-react';

const typeStyles = {
  contest: 'bg-blue-500/10 text-blue-400',
  course: 'bg-cyan-500/10 text-cyan-400',
  problem: 'bg-violet-500/10 text-violet-400',
  achievement: 'bg-amber-500/10 text-amber-400',
  daily: 'bg-emerald-500/10 text-emerald-400',
  general: 'bg-slate-800 text-slate-300',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/notifications', {
        params: unreadOnly ? { unreadOnly: true } : {},
      });
      setNotifications(response.data.data);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id) => {
    await axios.patch(`/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await axios.patch('/notifications/read-all');
    fetchNotifications();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400">Contest reminders, course updates, new problems, achievements, and daily nudges.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setUnreadOnly((value) => !value)} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${unreadOnly ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-800 text-slate-300 hover:text-white'}`}>
            Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
          <button onClick={markAllRead} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700">
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No notifications in this view.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {notifications.map((notification) => (
              <div key={notification._id} className={`p-4 ${notification.isRead ? '' : 'bg-blue-500/5'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1 rounded-lg bg-slate-950 p-2 text-slate-300">
                      {notification.type === 'achievement' ? <Trophy className="w-4 h-4" /> : notification.emailSent ? <Mail className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-white">{notification.title}</h2>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${typeStyles[notification.type]}`}>
                          {notification.type}
                        </span>
                        {!notification.isRead && <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">new</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{notification.message}</p>
                      <div className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {notification.actionUrl && (
                      <Link to={notification.actionUrl} className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white">
                        Open
                      </Link>
                    )}
                    {!notification.isRead && (
                      <button onClick={() => markRead(notification._id)} className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default NotificationsPage;
