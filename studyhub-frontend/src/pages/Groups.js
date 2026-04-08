import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Users, Plus, Search, Lock, Globe, UserPlus, Crown, ChevronRight, Filter, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export function Groups() {
  const [user, setUser] = useState(null);
  const [allGroups, setAllGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | my | public
  const [programFilter, setProgramFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Fallback map if you want mock student profiles for admins
  const [students, setStudents] = useState({});

  useEffect(() => {
    // Fetch all needed data parallel
    Promise.all([
      api.get('/auth/me'),
      api.get('/groups/all')
    ]).then(([meRes, groupsRes]) => {
      setUser(meRes.data);
      setAllGroups(groupsRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      toast.error('Failed to load groups');
      setLoading(false);
    });
  }, []);

  const handleJoinGroup = async (group) => {
    try {
      await api.post(`/groups/${group.id}/join`);
      toast.success(`Successfully joined "${group.name}"`);
      // Update local state to reflect join
      setAllGroups(allGroups.map(g => {
        if (g.id === group.id) {
          return { ...g, members: [...(g.members || []), user.studentId] };
        }
        return g;
      }));
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Error joining group');
    }
  };

  if (loading) {
    return <Layout><div className="flex h-full items-center justify-center text-slate-500">Loading Groups...</div></Layout>;
  }

  const filteredGroups = allGroups.filter((g) => {
    const sName = g.name || '';
    const sModCode = g.moduleCode || '';
    const sModName = g.moduleName || '';

    const matchesSearch =
      sName.toLowerCase().includes(search.toLowerCase()) ||
      sModCode.toLowerCase().includes(search.toLowerCase()) ||
      sModName.toLowerCase().includes(search.toLowerCase());

    const isMember = user && g.members && g.members.includes(user.studentId);
    const matchesMembership =
      filter === 'all' ? true : filter === 'my' ? isMember : g.isPublic;

    const matchesProgram = programFilter === 'all' || g.targetProgram === 'ALL' || g.targetProgram === programFilter;

    return matchesSearch && matchesMembership && matchesProgram;
  });

  const getModuleColorClass = (code) => {
    const c = code?.toLowerCase() || '';
    if (c.includes('it3010')) return 'bg-mod-it3010 text-white';
    if (c.includes('it3020')) return 'bg-mod-it3020 text-white';
    if (c.includes('it3030')) return 'bg-mod-it3030 text-white';
    if (c.includes('it3040')) return 'bg-mod-it3040 text-white';
    return 'bg-mod-default text-white';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Study Groups</h1>
          </div>
          <Link
            to="/groups/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sliit-blue text-white font-medium rounded-lg hover:bg-blue-900 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by group name, module code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All Groups' },
                { key: 'my', label: 'My Groups' },
                { key: 'public', label: 'Public' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${filter === key
                      ? 'bg-sliit-blue text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
            >
              <option value="all">All Programs</option>
              <option value="IT">IT</option>
              <option value="SE">SE</option>
              <option value="CS">CS</option>
              <option value="DS">DS</option>
            </select>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => {
            const isMember = user && group.members && group.members.includes(user.studentId);
            // Try to look up creator details if available
            const memberCount = group.members ? group.members.length : 0;
            const maxMem = group.maxMembers || 15;

            return (
              <div
                key={group.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-lg smooth-transition group"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${getModuleColorClass(group.moduleCode)}`}>
                        {group.moduleCode}
                      </span>
                      {group.isPublic ? (
                        <Globe className="w-4 h-4 text-green-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    {isMember && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Joined
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-slate-800 mb-1">{group.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{group.description}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {memberCount}/{maxMem}
                    </span>
                    <span>Year {group.year} • Sem {group.semester}</span>
                    <span className="uppercase">{group.targetProgram}</span>
                  </div>

                  {/* Tags */}
                  {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {group.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Creator */}
                  <div className="flex items-center gap-2 mb-4 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-7 h-7 bg-primary-light rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {group.createdBy?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        Owner: {group.createdBy}
                      </p>
                    </div>
                    {group.admins && group.admins.includes(group.createdBy) && (
                      <Crown className="w-4 h-4 text-amber-500" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/groups/${group.id}`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-primary-light bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      View <ChevronRight className="w-4 h-4" />
                    </Link>
                    {!isMember && memberCount < maxMem && (
                      <button
                        onClick={() => handleJoinGroup(group)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-sliit-blue rounded-lg hover:bg-blue-900 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Join
                      </button>
                    )}
                  </div>
                </div>

                {/* Announcements preview */}
                {group.announcements && window.length > 0 && isMember && (
                  <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50">
                    <p className="text-xs text-slate-500 truncate">
                      📢 {group.announcements[group.announcements.length - 1].text}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <Users className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No groups found</h3>
            <p className="text-slate-500 text-sm max-w-sm">We couldn't find any study groups matching your criteria. Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
