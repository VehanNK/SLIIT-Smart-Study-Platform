import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Layout } from '../components/layout/Layout';
import { BookOpen, Users, Calendar, Award, Inbox, Search } from 'lucide-react';
import api from '../services/api';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getModuleColorClass = (code) => {
    const c = code?.toLowerCase() || '';
    if (c.includes('it3010')) return 'bg-mod-it3010 text-white';
    if (c.includes('it3020')) return 'bg-mod-it3020 text-white';
    if (c.includes('it3030')) return 'bg-mod-it3030 text-white';
    if (c.includes('it3040')) return 'bg-mod-it3040 text-white';
    return 'bg-mod-default text-white';
  };

  useEffect(() => {
    api.get('/dashboard')
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Resources */}
          <Card title={<div className="flex items-center gap-2"><BookOpen className="text-indigo-500" size={20} /> Recommended Resources</div>} className="elevated-card">
            {data?.recommendedResources?.length === 0 ? (
              <EmptyState text="No resources found for your modules" icon={Inbox} />
            ) : (
              <div className="space-y-0 divide-y divide-gray-100">
                {data?.recommendedResources?.map(r => (
                  <div key={r.id} className="py-4 hover:bg-slate-50 -mx-5 px-5 transition-colors cursor-pointer group relative">
                    <div className="font-semibold text-slate-800 group-hover:text-primary transition-colors">
                      {r.title}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm uppercase ${getModuleColorClass(r.moduleCode)}`}>
                        {r.moduleCode}
                      </span>
                      <Badge text={`⭐ ${r.avgRating > 0 ? r.avgRating : 'New'}`} color="gray" />
                    </div>
                    {/* Hover quick preview */}
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 smooth-transition">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">View Details</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Groups */}
          <Card title={<div className="flex items-center gap-2"><Users className="text-green-500" size={20} /> Suggested Groups</div>} className="elevated-card">
            {data?.suggestedGroups?.length === 0 ? (
              <EmptyState text="No suitable groups found" icon={Users} />
            ) : (
              <div className="space-y-0 divide-y divide-gray-100">
                {data?.suggestedGroups?.map(g => (
                  <div key={g.id} className="py-4 hover:bg-slate-50 -mx-5 px-5 transition-colors cursor-pointer group flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-green-600 transition-colors">
                        {g.name}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm uppercase ${getModuleColorClass(g.moduleCode)}`}>
                          {g.moduleCode}
                        </span>
                        <Badge text={`${g.members?.length || 0} members`} color="green" />
                      </div>
                    </div>
                    {/* Hover quick preview */}
                    <div className="opacity-0 group-hover:opacity-100 smooth-transition">
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Preview</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Peers */}
          <Card title={<div className="flex items-center gap-2"><Award className="text-yellow-500" size={20} /> Recommended Peers</div>} className="elevated-card">
            {data?.recommendedPeers?.length === 0 ? (
              <EmptyState text="No peer matches found" icon={Search} />
            ) : (
              <div className="space-y-0 divide-y divide-gray-100">
                {data?.recommendedPeers?.map(p => (
                  <div key={p.studentId} className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-5 px-5 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold">
                        {p.studentId.slice(-4)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 group-hover:text-primary transition-colors">
                          {p.studentId}
                        </p>
                        <p className="text-sm text-slate-500">{p.program} • Year {p.currentYear}</p>
                      </div>
                    </div>
                    {/* Hover quick preview */}
                    <div className="opacity-0 group-hover:opacity-100 smooth-transition">
                      <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">Connect</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Sessions */}
          <Card title={<div className="flex items-center gap-2"><Calendar className="text-rose-500" size={20} /> Upcoming Sessions</div>} className="elevated-card">
            {data?.upcomingSessions?.length === 0 ? (
              <EmptyState text="No scheduled sessions soon" icon={Calendar} />
            ) : (
              <div className="space-y-0 divide-y divide-gray-100">
                {data?.upcomingSessions?.map(s => (
                  <div key={s.id} className="py-4 hover:bg-slate-50 -mx-5 px-5 transition-colors cursor-pointer group border-l-4 border-transparent hover:border-rose-400">
                    <p className="font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">
                      {s.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(s.startTime).toLocaleDateString()} at {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>
    </Layout>
  );
}
