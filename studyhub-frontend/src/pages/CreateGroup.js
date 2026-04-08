import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/layout/Layout';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lightbulb, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PROGRAMS = ['IT', 'SE', 'CS', 'DS', 'ISM', 'CSNE'];
const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];

export function CreateGroup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', moduleCode: location.state?.prefillModule || '', year: '', semester: '', targetProgram: '', description: '' });
  const [suggestedModules, setSuggestedModules] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch student's current modules for smart suggestion
    api.get('/auth/me').then(res => {
      setUser(res.data);
      if (res.data.currentModules?.length) {
        setSuggestedModules(res.data.currentModules);
        setForm(f => ({
          ...f,
          moduleCode: location.state?.prefillModule || f.moduleCode,
          targetProgram: res.data.program || '',
          year: res.data.currentYear || '',
          semester: res.data.currentSemester || '',
        }));
      }
    }).catch(() => { });
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/groups', form);
      toast.success('Group created successfully!');
      navigate('/groups');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group.');
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Create Study Group</h1>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {suggestedModules.length > 0 && user && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Based on your Student ID ({user.studentId}), here are your current modules:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {suggestedModules.map((m) => (
                        <button
                          key={m.code || m}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, moduleCode: m.code || m, targetProgram: user.program, year: user.currentYear, semester: 1 }))}
                          className={`px-3 py-1 border rounded-full text-xs font-medium transition-colors shadow-sm ${form.moduleCode === (m.code || m) ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100'}`}
                        >
                          {m.code || m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Name</label>
                <input required type="text" name="name" value={form.name} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Module Code</label>
                <input required type="text" name="moduleCode" value={form.moduleCode} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Program</label>
                <select name="targetProgram" value={form.targetProgram} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all">
                  <option value="">Any Program</option>
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
                <select name="year" value={form.year} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all">
                  <option value="">Any Year</option>
                  {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
                <select name="semester" value={form.semester} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all">
                  <option value="">Any Semester</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea name="description" placeholder="What will this group focus on?" value={form.description}
                onChange={handleChange} rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none" />
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/groups')}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
