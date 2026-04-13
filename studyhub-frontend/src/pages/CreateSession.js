import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Lightbulb } from 'lucide-react';
import api from '../services/api';

export function CreateSession() {
  const navigate = useNavigate();
  const location = require('react-router-dom').useLocation();
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    groupId: location.state?.prefillGroupId || '',
    title: '',
    startTime: location.state?.prefillStartTime || '',
    endTime: location.state?.prefillEndTime || '',
    provider: 'Google Meet'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deadlineWarnings, setDeadlineWarnings] = useState([]);
  const [overrideWarning, setOverrideWarning] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    api.get('/groups/my').then(res => setGroups(res.data)).catch(() => { });
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  // Load smart time suggestions when a group is selected
  useEffect(() => {
    if (form.groupId) {
      setLoadingSuggestions(true);
      api.get(`/sessions/suggest-times?groupId=${form.groupId}`)
        .then(res => setSuggestedTimes(res.data || []))
        .catch(() => setSuggestedTimes([]))
        .finally(() => setLoadingSuggestions(false));
    } else {
      setSuggestedTimes([]);
    }
  }, [form.groupId]);

  // Check deadlines whenever start time or group changes
  useEffect(() => {
    if (form.startTime && form.groupId) {
      const g = groups.find(x => x.id === form.groupId);
      if (g) {
        api.get(`/sessions/deadlines?modules=${g.moduleCode}&date=${form.startTime}`)
          .then(res => setDeadlineWarnings(res.data || []))
          .catch(() => { });
      }
    }
  }, [form.startTime, form.groupId, groups]);

  const applySuggestion = (isoTime) => {
    const start = new Date(isoTime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    // Format as "YYYY-MM-DDTHH:MM" in local timezone
    const fmt = (d) => {
      const local = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
      return local.toISOString().slice(0, 16);
    };

    setForm(f => ({ ...f, startTime: fmt(start), endTime: fmt(end) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (deadlineWarnings.length > 0 && !overrideWarning) {
      setError('Please acknowledge the deadline warnings by checking the override box before scheduling.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, title: `[${form.provider}] ${form.title}` };
      await api.post(`/sessions`, payload);
      navigate('/sessions');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create session.');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  const formatSuggestion = (isoTime) => {
    const d = new Date(isoTime);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Schedule Session</h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Group selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Group *</label>
              <select name="groupId" value={form.groupId} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="">Select a group you're in</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.moduleCode})</option>
                ))}
              </select>
              {groups.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">You need to join a group first.</p>
              )}
            </div>

            {/* Smart Time Suggestions */}
            {form.groupId && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} className="text-indigo-600 shrink-0" />
                  <span className="text-sm font-semibold text-indigo-800">Smart Time Suggestions</span>
                  <span className="text-xs text-indigo-400">(based on typical study patterns)</span>
                </div>
                {loadingSuggestions ? (
                  <p className="text-xs text-indigo-400">Calculating best slots…</p>
                ) : suggestedTimes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {suggestedTimes.slice(0, 5).map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applySuggestion(t)}
                        className="flex items-center gap-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all font-medium shadow-sm"
                      >
                        <Clock size={12} />
                        {formatSuggestion(t)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-indigo-400">No suggestions available.</p>
                )}
              </div>
            )}

            {/* Session title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Title *</label>
              <input name="title" type="text" placeholder="e.g. IT1050 Exam Prep" value={form.title}
                onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                <input name="startTime" type="datetime-local" value={form.startTime}
                  onChange={handleChange} required min={minDateTime}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                <input name="endTime" type="datetime-local" value={form.endTime}
                  onChange={handleChange} required min={form.startTime || minDateTime}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
              </div>
            </div>

            {/* Deadline conflict warnings */}
            {deadlineWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="font-bold">⚠️ Academic Deadline Imminent</span>
                </div>
                <ul className="list-disc pl-8">
                  {deadlineWarnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
                <label className="flex items-center gap-2 mt-2 font-medium cursor-pointer">
                  <input type="checkbox" checked={overrideWarning} onChange={(e) => setOverrideWarning(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500" />
                  I acknowledge these deadlines. Schedule anyway.
                </label>
              </div>
            )}

            {/* Meeting provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meeting Provider</label>
              <select name="provider" value={form.provider} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all">
                <option value="Google Meet">Google Meet (Auto-generate)</option>
                <option value="Zoom">Zoom (Auto-generate)</option>
              </select>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading || groups.length === 0} className="flex-1">
                {loading ? 'Scheduling…' : 'Schedule Session'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/sessions')}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
