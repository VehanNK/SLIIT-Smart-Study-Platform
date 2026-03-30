import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { Layout } from '../components/layout/Layout';
import { User, BookOpen, Brain } from 'lucide-react';
import api from '../services/api';

const STUDY_STYLES = ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'];

export function Profile() {
  const [profile, setProfile] = useState(null);
  const [studyStyle, setStudyStyle] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(res => {
      setProfile(res.data);
      setStudyStyle(res.data.studyStyle || '');
      setReminderEnabled(res.data.reminderEnabled || false);
    }).catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await api.put('/students/profile', { studyStyle });
      await api.put('/auth/me/preferences', { reminderEnabled });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
        </div>

        {/* Identity Card */}
        <Card>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
              {profile?.studentId?.slice(-4) || 'ST'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile?.studentId}</h2>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
          </div>
        </Card>

        {/* Academic Info (read-only) */}
        <Card title={<div className="flex items-center gap-2"><BookOpen size={18} className="text-indigo-500" /> Academic Info</div>}>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Program', value: profile?.program },
              { label: 'Intake Year', value: profile?.intakeYear },
              { label: 'Current Year', value: profile?.currentYear ? `Year ${profile.currentYear}` : '—' },
              { label: 'Semester', value: profile?.currentSemester ? `Semester ${profile.currentSemester}` : '—' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">{item.label}</p>
                <p className="text-gray-900 font-semibold">{item.value || '—'}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Current Modules */}
        {profile?.currentModules?.length > 0 && (
          <Card title={<div className="flex items-center gap-2"><BookOpen size={18} className="text-green-500" /> Current Modules</div>}>
            <div className="flex flex-wrap gap-2">
              {profile.currentModules.map(m => (
                <Badge key={m} text={m} color="indigo" />
              ))}
            </div>
          </Card>
        )}

        {/* Study Style — editable */}
        <Card title={<div className="flex items-center gap-2"><Brain size={18} className="text-purple-500" /> Study Preferences</div>}>
          <div className="space-y-4">
            <div>
              <div className="grid grid-cols-2 gap-3">
                {STUDY_STYLES.map(style => (
                  <button key={style} type="button"
                    onClick={() => setStudyStyle(style)}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${studyStyle === style
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                      }`}>
                    {style === 'Visual' && '👁️ '}
                    {style === 'Auditory' && '👂 '}
                    {style === 'Kinesthetic' && '🤲 '}
                    {style === 'Reading/Writing' && '📖 '}
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Reminders</p>
                </div>
              </label>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
            {saved && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">✅ Profile saved successfully!</div>}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </Card>


      </div>
    </Layout>
  );
}
