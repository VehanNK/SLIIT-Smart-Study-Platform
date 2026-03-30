import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Layout } from '../components/layout/Layout';
import { UserPlus, Check } from 'lucide-react';
import api from '../services/api';

export function Matching() {
  const navigate = require('react-router-dom').useNavigate();
  const [activeTab, setActiveTab] = useState('peers'); // peers, mentors, crossprogram, pending
  const [peers, setPeers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [crossProgram, setCrossProgram] = useState([]);
  const [groupSuggestion, setGroupSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState({ pending: [], sent: [], accepted: [] });
  const [confidence, setConfidence] = useState({});
  const [user, setUser] = useState(null);

  const loadMatches = () => {
    setLoading(true);
    Promise.all([
      api.get('/matches/peers?size=10').catch(() => ({ data: { content: [] } })),
      api.get('/matches/mentors?size=5').catch(() => ({ data: { content: [] } })),
      api.get('/matches/crossprogram?size=10').catch(() => ({ data: { content: [] } })),
      api.get('/matches/suggest').catch(() => ({ data: null })),
      api.get('/connections/pending').catch(() => ({ data: [] })),
      api.get('/connections/sent').catch(() => ({ data: [] })),
      api.get('/connections/accepted').catch(() => ({ data: [] })),
      api.get('/auth/me').catch(() => ({ data: null }))
    ]).then(([pRes, mRes, cpRes, gRes, pendRes, sentRes, accRes, meRes]) => {
      setPeers(pRes.data?.content || []);
      setMentors(mRes.data?.content || []);
      setCrossProgram(cpRes.data?.content || []);
      setGroupSuggestion(gRes.data);
      setConnections({ pending: pendRes.data || [], sent: sentRes.data || [], accepted: accRes.data || [] });
      setUser(meRes.data);
      if (meRes.data?.moduleConfidence) {
        setConfidence(meRes.data.moduleConfidence);
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMatches(); }, []);

  const handleConnect = async (studentId) => {
    try {
      await api.post(`/connections/request?toStudentId=${studentId}`);
      loadMatches();
    } catch (e) { console.error(e); }
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/connections/${id}/accept`);
      loadMatches();
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id) => {
    try {
      await api.delete(`/connections/${id}/reject`);
      loadMatches();
    } catch (e) { console.error(e); }
  };

  const saveConfidence = async (mod, val) => {
    const next = { ...confidence, [mod]: parseInt(val) };
    setConfidence(next);
    await api.put('/auth/me/confidence', next);
    // Reload matches subtly
    api.get('/matches/peers?size=10').then(res => setPeers(res.data?.content || []));
    api.get('/matches/crossprogram?size=10').then(res => setCrossProgram(res.data?.content || []));
  };

  if (loading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Smart Matching</h1>
        </div>

        {/* Auto Group Suggestion Banner */}
        {groupSuggestion && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-indigo-200 text-sm font-semibold mb-1">🤖 Smart Suggestion</p>
                <h3 className="text-xl font-bold mb-2">{groupSuggestion.message}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge text={`Module: ${groupSuggestion.moduleCode}`} color="indigo" />
                  {groupSuggestion.suggestedPeers?.map(p => (
                    <span key={p} className="text-sm bg-white/20 text-white px-2 py-0.5 rounded-lg">{p}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => navigate('/groups/create', { state: { prefillModule: groupSuggestion.moduleCode } })}
                className="shrink-0 bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform">
                Suggest new group for this module
              </button>
            </div>
          </div>
        )}

        {/* Confidence Sliders */}
        {user?.currentModules?.length > 0 && (
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-3">Module Confidence Levels</h2>
            <p className="text-sm text-gray-500 mb-4">Set your confidence for each module to improve matching.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.currentModules.map(mod => (
                <div key={mod} className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="font-semibold text-sm">{mod}</span>
                  <div className="flex items-center gap-3 flex-1 max-w-[250px]">
                    <span className="text-xs text-gray-400 font-medium">Low</span>
                    <input type="range" min="1" max="5" step="1"
                      value={confidence[mod] || 3}
                      onChange={(e) => saveConfidence(mod, e.target.value)}
                      className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer smooth-transition
                        ${(confidence[mod] || 3) <= 2 ? 'accent-purple-300 bg-purple-100' :
                          (confidence[mod] || 3) <= 4 ? 'accent-indigo-500 bg-indigo-100' :
                          'accent-primary-vibrant bg-indigo-200'}`} />
                    <span className="text-xs text-gray-400 font-medium">High</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          {['peers', 'mentors', 'crossprogram', 'pending'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 px-2 font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'peers' && 'Peers'}
              {tab === 'mentors' && 'Mentors'}
              {tab === 'crossprogram' && 'Cross-Program'}
              {tab === 'pending' && `Requests (${connections.pending.length})`}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {/* Peers */}
          {activeTab === 'peers' && (
            <div className="space-y-4">
              {peers.length === 0 ? (
                <Card><EmptyState text="No peers matched. Set your study style in your profile to improve results." /></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {peers.map(peer => {
                    const isPending = connections.pending.some(c => c.fromStudentId === peer.studentId) || connections.sent.some(c => c.toStudentId === peer.studentId);
                    const isConnected = connections.accepted.some(c => c.toStudentId === peer.studentId || c.fromStudentId === peer.studentId);
                    return (
                      <Card key={peer.studentId} className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                            {peer.studentId.slice(-4)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{peer.studentId}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {peer.program && <Badge text={peer.program} />}
                              {peer.studyStyle && <Badge text={peer.studyStyle} color="indigo" />}
                              {peer.matchScore && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                                  {peer.matchScore}% Match
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">
                              {peer.matchReasons && peer.matchReasons.length > 0 ? peer.matchReasons.join(' • ') : "Based on shared traits"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <button onClick={() => !isConnected && !isPending && handleConnect(peer.studentId)}
                            disabled={isConnected || isPending}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all ${isConnected ? 'bg-green-50 text-green-600 border-green-200'
                              : isPending ? 'bg-gray-50 text-gray-500 border-gray-200'
                                : 'hover:bg-indigo-50 text-indigo-600 border-indigo-200'
                              }`}>
                            {isConnected ? <><Check size={12} /> Connected</> : isPending ? 'Pending' : <><UserPlus size={12} /> Connect</>}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mentors */}
          {activeTab === 'mentors' && (
            <div className="space-y-4">
              {mentors.length === 0 ? (
                <Card><EmptyState text="No senior mentors found in your program." /></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentors.map(mentor => {
                    const isPending = connections.pending.some(c => c.fromStudentId === mentor.studentId) || connections.sent.some(c => c.toStudentId === mentor.studentId);
                    const isConnected = connections.accepted.some(c => c.toStudentId === mentor.studentId || c.fromStudentId === mentor.studentId);
                    return (
                      <Card key={mentor.studentId} className="flex justify-between items-center gap-4 border-purple-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center">
                            {mentor.studentId.slice(-4)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{mentor.studentId}</p>
                            <div className="flex gap-1.5 mt-1">
                              <Badge text={`Year ${mentor.currentYear}`} color="indigo" />
                              {mentor.program && <Badge text={mentor.program} />}
                              {mentor.matchScore && (
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                                  {mentor.matchScore}% Viable
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">
                              {mentor.matchReasons && mentor.matchReasons.length > 0 ? mentor.matchReasons.join(' • ') : "Based on senior experience"}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <button onClick={() => !isConnected && !isPending && handleConnect(mentor.studentId)}
                            disabled={isConnected || isPending}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all ${isConnected ? 'bg-green-50 text-green-600 border-green-200'
                              : isPending ? 'bg-gray-50 text-gray-500 border-gray-200'
                                : 'hover:bg-purple-50 text-purple-600 border-purple-200'
                              }`}>
                            {isConnected ? <><Check size={12} /> Connected</> : isPending ? 'Pending' : <><UserPlus size={12} /> Connect</>}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Cross Program */}
          {activeTab === 'crossprogram' && (
            <div className="space-y-4">
              {crossProgram.length === 0 ? (
                <Card><EmptyState text="No cross-program matches found." /></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {crossProgram.map(peer => {
                    const isPending = connections.pending.some(c => c.fromStudentId === peer.studentId) || connections.sent.some(c => c.toStudentId === peer.studentId);
                    const isConnected = connections.accepted.some(c => c.toStudentId === peer.studentId || c.fromStudentId === peer.studentId);
                    return (
                      <Card key={peer.studentId} className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                            {peer.studentId.slice(-4)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{peer.studentId}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {peer.program && <Badge text={peer.program} color="blue" />}
                              {peer.studyStyle && <Badge text={peer.studyStyle} color="indigo" />}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {peer.matchReasons && peer.matchReasons.length > 0 ? peer.matchReasons.join(' • ') : "Module overlap match"}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <button onClick={() => !isConnected && !isPending && handleConnect(peer.studentId)}
                            disabled={isConnected || isPending}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all ${isConnected ? 'bg-green-50 text-green-600 border-green-200'
                              : isPending ? 'bg-gray-50 text-gray-500 border-gray-200'
                                : 'hover:bg-blue-50 text-blue-600 border-blue-200'
                              }`}>
                            {isConnected ? <><Check size={12} /> Connected</> : isPending ? 'Pending' : <><UserPlus size={12} /> Connect</>}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pending Requests */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {connections.pending.length === 0 ? (
                <Card><EmptyState text="No pending requests right now." /></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connections.pending.map(c => (
                    <Card key={c.id} className="flex justify-between items-center gap-4 border-yellow-200 bg-yellow-50/30">
                      <div>
                        <p className="font-semibold text-gray-900">From: {c.fromStudentId}</p>
                        <p className="text-xs text-gray-500">Wants to connect with you</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAccept(c.id)} className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-700">Accept</button>
                        <button onClick={() => handleReject(c.id)} className="bg-red-100 text-red-600 text-xs px-3 py-1.5 rounded hover:bg-red-200">Reject</button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
