import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, Mail, Save } from 'lucide-react';

const notificationTypes = [
  ['contest', 'Contest reminders'],
  ['course', 'Course updates'],
  ['problem', 'New problems'],
  ['achievement', 'Achievements'],
  ['daily', 'Daily reminders'],
  ['general', 'General updates'],
];

const emptyPrefs = {
  inApp: {},
  email: {},
};

const NotificationPreferencesPage = () => {
  const [preferences, setPreferences] = useState(emptyPrefs);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await axios.get('/notifications/preferences/me');
        setPreferences(response.data.data || emptyPrefs);
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const toggle = (channel, type) => {
    setPreferences((current) => ({
      ...current,
      [channel]: {
        ...current[channel],
        [type]: !current[channel]?.[type],
      },
    }));
  };

  const savePreferences = async () => {
    const response = await axios.put('/notifications/preferences/me', {
      notificationPreferences: preferences,
    });
    setPreferences(response.data.data);
    setMessage('Notification preferences saved.');
    window.setTimeout(() => setMessage(''), 2500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Notification Preferences</h1>
        <p className="text-slate-400">Choose which updates arrive in-app and which ones also go to email.</p>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
          {message}
        </div>
      )}

      <section className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px] border-b border-slate-800 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <div>Notification</div>
          <div className="flex items-center justify-center gap-1"><Bell className="w-3.5 h-3.5" />In-app</div>
          <div className="flex items-center justify-center gap-1"><Mail className="w-3.5 h-3.5" />Email</div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading preferences...</div>
        ) : notificationTypes.map(([type, label]) => (
          <div key={type} className="grid grid-cols-[1fr_120px_120px] items-center border-b border-slate-800 px-4 py-4 last:border-b-0">
            <div>
              <div className="font-semibold text-white">{label}</div>
              <div className="text-xs text-slate-500">{type}</div>
            </div>
            {['inApp', 'email'].map((channel) => (
              <div key={channel} className="flex justify-center">
                <button
                  onClick={() => toggle(channel, type)}
                  className={`h-6 w-11 rounded-full p-1 transition-colors ${preferences[channel]?.[type] ? 'bg-blue-600' : 'bg-slate-700'}`}
                  aria-label={`${label} ${channel}`}
                >
                  <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${preferences[channel]?.[type] ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </section>

      <button onClick={savePreferences} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
        <Save className="w-4 h-4" />
        Save Preferences
      </button>
    </div>
  );
};

export default NotificationPreferencesPage;
