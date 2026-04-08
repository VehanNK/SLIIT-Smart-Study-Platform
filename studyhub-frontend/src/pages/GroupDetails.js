import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Loader } from '../components/ui/Loader';
import { ArrowLeft, Users, Send, UserMinus, LogOut, MessageSquare, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedMods, setSuggestedMods] = useState([]);
  const [feed, setFeed] = useState([]);
  const [joinError, setJoinError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [groupRes, meRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get('/auth/me')
      ]);
      setGroup(groupRes.data);
      setUser(meRes.data);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load group details');
      navigate('/groups');
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (group && user) {
      const isMem = group.members?.includes(user?.studentId);
      const isAdm = group.admins?.includes(user?.studentId);
      if (isAdm) {
        api.get(`/groups/${id}/moderators/suggestions`).then(res => setSuggestedMods(res.data)).catch(console.error);
      }
      if (isMem) {
        api.get(`/groups/${id}/feed`).then(res => setFeed(res.data)).catch(console.error);
      }
    }
  }, [group, user, id]);

  const handleJoin = async () => {
    try {
      setJoinError('');
      await api.post(`/groups/${id}/join`);
      toast.success('Joined successfully!');
      loadData();
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Failed to join group');
    }
  };

  const handlePromote = async (targetId) => {
    if (!window.confirm(`Promote ${targetId} to admin?`)) return;
    try {
      await api.post(`/groups/${id}/moderators`, null, {
        params: { targetStudentId: targetId }
      });
      toast.success(`${targetId} is now a moderator`);
      loadData();
      setSuggestedMods(prev => prev.filter(m => m.studentId !== targetId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to promote');
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/groups/${id}/announcements`, { text: announcement });
      setAnnouncement('');
      toast.success('Announcement added!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/groups/${id}/leave`);
      toast.success('You have left the group');
      navigate('/groups');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to leave group');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm(`Remove ${memberId} from the group?`)) return;
    try {
      await api.delete(`/groups/${id}/members`, {
        params: { targetStudentId: memberId }
      });
      toast.success('Member removed');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  const isMember = group.members?.includes(user?.studentId);
  const isAdmin = group.admins?.includes(user?.studentId);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/groups')}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {group.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge text={group.moduleCode} color="indigo" />
                <Badge text={`Year ${group.year}`} color="gray" />
                <Badge text={group.targetProgram === 'ALL' ? 'All Programs' : group.targetProgram} color="green" />
              </div>
            </div>
          </div>
          {isMember && (
            <button 
              className="flex items-center gap-2 text-sm font-medium text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg smooth-transition" 
              onClick={handleLeaveGroup}
            >
              <LogOut className="w-4 h-4" /> Leave Group
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-slate-600">{group.description || 'No description provided.'}</p>
            </Card>

            {isMember ? (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-xl">📢</span> Announcements
                </h2>
                
                <div className="space-y-4 mb-6">
                  {group.announcements?.length > 0 ? (
                    group.announcements.map((ann, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm text-slate-700">{ann.authorId}</span>
                          <span className="text-xs text-slate-400">{new Date(ann.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700">{ann.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                        <MessageSquare className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">No announcements yet.</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">Be the first to share something with the group.</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddAnnouncement} className="flex gap-2">
                  <input
                    type="text"
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    placeholder="Write an announcement..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sliit-blue focus:outline-none text-sm"
                  />
                  <Button type="submit" disabled={isSubmitting || !announcement.trim()}>
                    <Send className="w-4 h-4 mr-2" /> Post
                  </Button>
                </form>

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-xl">🔥</span> Trending Resources
                  </h2>
                  <div className="space-y-3">
                    {feed.length > 0 ? feed.map(r => (
                      <div key={r.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{r.title}</p>
                          <p className="text-xs text-slate-500">⭐ {r.avgRating.toFixed(1)} • 📥 {r.downloads}</p>
                        </div>
                        <Button variant="outline" onClick={() => window.open(r.fileUrl, '_blank')}>View</Button>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                          <BookOpen className="w-4 h-4 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">No trending resources yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <div className="py-8">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Join to see more</h3>
                  <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-4 rounded-lg inline-block text-left">
                    <p className="font-semibold mb-2 text-slate-800">Requirements to join:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Program: <span className="font-medium text-slate-800">{group.targetProgram === 'ALL' ? 'Any' : group.targetProgram}</span></li>
                      {group.year > 0 && <li>Year: <span className="font-medium text-slate-800">{group.year}</span></li>}
                      {group.semester > 0 && <li>Semester: <span className="font-medium text-slate-800">{group.semester}</span></li>}
                      {group.moduleCode && <li>Currently enrolled in <span className="font-medium text-slate-800">{group.moduleCode}</span></li>}
                    </ul>
                  </div>
                  {joinError && <div className="text-red-600 text-sm mb-4 px-4 py-2 bg-red-50 rounded border border-red-100">{joinError}</div>}
                  <div>
                    <Button onClick={handleJoin}>Join Group</Button>
                  </div>
                  <p className="text-slate-500 text-sm mt-4">You need to be a member to see announcements and discussions.</p>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-sliit-blue" />
                Members ({group.members?.length || 0})
              </h2>
              <div className="space-y-3">
                {group.members?.map(memberId => {
                  const memberIsAdmin = group.admins?.includes(memberId);
                  const memberIsOwner = group.createdBy === memberId;
                  return (
                    <div key={memberId} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group transition-colors">
                      <div className="flex items-center gap-3 relative">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs relative">
                          {memberId.slice(-4)}
                          {/* Online green dot indicator */}
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{memberId}</p>
                          {memberIsOwner && <span className="text-[10px] uppercase font-bold text-amber-500">Owner</span>}
                          {memberIsAdmin && !memberIsOwner && <span className="text-[10px] uppercase font-bold text-blue-500">Admin</span>}
                        </div>
                      </div>
                      
                      {isAdmin && memberId !== group.createdBy && memberId !== user?.studentId && (
                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all"
                          title="Remove from group"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {isAdmin && (
              <Card className="p-6 border-indigo-100 bg-indigo-50/30">
                <h2 className="text-md font-semibold mb-3 text-indigo-900">Suggested Moderators</h2>
                <p className="text-xs text-slate-500 mb-4">Senior members who might help moderate the group.</p>
                {suggestedMods.length === 0 ? (
                  <p className="text-sm text-slate-600 bg-white border border-indigo-50 rounded-lg p-3">
                    No senior members to suggest yet. Add members from older intakes to see moderator recommendations.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {suggestedMods.map(mod => (
                      <div key={mod.studentId} className="flex items-center justify-between p-2 bg-white border border-indigo-50 rounded-lg">
                        <div className="text-sm font-medium text-slate-800">{mod.studentId}</div>
                        <Button variant="outline" className="text-xs py-1 px-2 h-auto text-indigo-600 border-indigo-200" onClick={() => handlePromote(mod.studentId)}>
                          Promote
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
