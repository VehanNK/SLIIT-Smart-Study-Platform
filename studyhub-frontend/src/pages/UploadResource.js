import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Layout } from '../components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { Tag, UploadCloud } from 'lucide-react';
import api from '../services/api';

const RESOURCE_TYPES = ['NOTES', 'PAST_PAPER', 'TUTORIAL', 'SLIDES', 'OTHER'];

export function UploadResource() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', moduleCode: '', resourceType: 'NOTES', program: '', year: '', semester: '' });
  const [moduleOptions, setModuleOptions] = useState([]);
  const [file, setFile] = useState(null);
  const [autoTags, setAutoTags] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(res => {
      const d = res.data;
      const tags = { program: d.program || '', intakeYear: d.intakeYear || '', year: d.currentYear || '', semester: d.currentSemester || '' };
      setAutoTags(tags);
      setForm(f => ({ ...f, ...tags }));

      if (tags.program && tags.year && tags.semester) {
        api.get('/students/curriculum/modules', {
          params: {
            program: tags.program,
            year: tags.year,
            semester: tags.semester
          }
        }).then(modRes => {
          const mods = modRes.data || [];
          setModuleOptions(mods);
          if (mods.length > 0) {
            setForm(f => ({ ...f, moduleCode: f.moduleCode || mods[0] }));
          }
        }).catch(() => setModuleOptions([]));
      }
    }).catch(() => { });
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('moduleCode', form.moduleCode);
    formData.append('resourceType', form.resourceType);

    try {
      // Must use multipart/form-data headers
      await api.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/resources');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to upload resource.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Upload Resource</h1>
        </div>

        {/* Auto-tags */}
        {autoTags && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
            <Tag className="text-green-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-green-700 mb-2">Auto-tagged from your profile:</p>
              <div className="flex gap-2">
                {autoTags.program && <Badge text={`Program: ${autoTags.program}`} color="green" />}
                {autoTags.intakeYear && <Badge text={`Intake: ${autoTags.intakeYear}`} color="green" />}
                {autoTags.year && <Badge text={`Year ${autoTags.year}`} color="green" />}
                {autoTags.semester && <Badge text={`Sem ${autoTags.semester}`} color="green" />}
              </div>
            </div>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
              <input name="title" type="text" placeholder="e.g. IT1050 Lecture Notes Week 3" value={form.title}
                onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea name="description" rows={3} placeholder="Brief description of what this covers..."
                value={form.description} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select File *</label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl px-6 py-8 text-center hover:bg-gray-50 transition-colors">
                <input type="file" onChange={handleFileChange} required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <UploadCloud className="text-indigo-500" size={32} />
                  <span className="text-sm font-medium text-gray-700">
                    {file ? file.name : "Click to select or drag and drop"}
                  </span>
                  {!file && <span className="text-xs text-gray-500">PDF, PNG, JPG, DOCX (Max 10MB)</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Module Code *</label>
                {moduleOptions.length > 0 ? (
                  <select
                    name="moduleCode"
                    value={form.moduleCode}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    {moduleOptions.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input name="moduleCode" type="text" placeholder="e.g. IT1050" value={form.moduleCode}
                    onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Type *</label>
                <select name="resourceType" value={form.resourceType} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                  {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Uploading safely to Cloud...' : 'Upload Resource'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/resources')} disabled={loading}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
