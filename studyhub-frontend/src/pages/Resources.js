import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Layout } from '../components/layout/Layout';
import { BookOpen, Download, Star, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PROGRAM_OPTIONS = ['IT', 'SE', 'CS', 'DS', 'ISM', 'CSNE'];
const YEAR_OPTIONS = [1, 2, 3, 4];
const SEMESTER_OPTIONS = [1, 2];

export function Resources() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null); // resourceId being reviewed
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [currentUser, setCurrentUser] = useState(null); // Store current user info
  const [filterModule, setFilterModule] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterUploaderIntake, setFilterUploaderIntake] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showRecommended, setShowRecommended] = useState(true);
  const [reviewsCache, setReviewsCache] = useState({});
  const [moduleOptions, setModuleOptions] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [defaultContext, setDefaultContext] = useState({
    program: '',
    year: '',
    semester: ''
  });

  useEffect(() => {
    api.get('/auth/me').then(res => {
      const d = res.data || {};
      setCurrentUser(d); // Store user info
      const context = {
        program: d.program || '',
        year: d.currentYear ? String(d.currentYear) : '',
        semester: d.currentSemester ? String(d.currentSemester) : ''
      };
      setDefaultContext(context);
      setFilterProgram(context.program);
      setFilterYear(context.year);
      setFilterSemester(context.semester);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!filterProgram || !filterYear || !filterSemester) {
      setModuleOptions([]);
      setFilterModule('');
      return;
    }

    // Reset module when syllabus context changes to avoid stale module codes.
    setFilterModule('');
    setLoadingModules(true);

    api.get('/students/curriculum/modules', {
      params: {
        program: filterProgram,
        year: Number(filterYear),
        semester: Number(filterSemester)
      }
    }).then(res => {
      const mods = res.data || [];
      setModuleOptions(mods);
      setFilterModule(mods.length > 0 ? mods[0] : '');
    }).catch(() => {
      setModuleOptions([]);
      setFilterModule('');
    }).finally(() => setLoadingModules(false));
  }, [filterProgram, filterYear, filterSemester]);

  const handleResetFilters = () => {
    setFilterProgram(defaultContext.program);
    setFilterYear(defaultContext.year);
    setFilterSemester(defaultContext.semester);
    setFilterModule('');
    setFilterUploaderIntake('');
    setFilterType('');
    setFilterRating('');
    setSortBy('default');
    setShowRecommended(true);
  };

  const fetchResources = () => {
    setLoading(true);
    let url = '/resources/search?size=20';
    if (showRecommended) {
      url += `&sortBy=default`;
    } else {
      url += `&sortBy=${sortBy}`;
    }
    if (filterModule) url += `&moduleCode=${filterModule}`;
    if (filterProgram) url += `&program=${filterProgram}`;
    if (filterUploaderIntake) url += `&uploaderIntake=${filterUploaderIntake}`;
    if (filterYear) url += `&year=${filterYear}`;
    if (filterSemester) url += `&semester=${filterSemester}`;
    if (filterType) url += `&resourceType=${filterType}`;
    if (filterRating) url += `&minRating=${filterRating}`;
    api.get(url).then(res => setResources(res.data.content || [])).catch(console.error).finally(() => setLoading(false));
  };

  // Fetch resources on filter/sort changes
  useEffect(() => {
    fetchResources();
  }, [filterModule, filterProgram, filterYear, filterSemester, filterUploaderIntake, filterType, filterRating, sortBy, showRecommended]);

  const loadReviews = async (id) => {
    try {
      const res = await api.get(`/resources/${id}/reviews`);
      setReviewsCache(prev => ({ ...prev, [id]: res.data }));
    } catch (e) {
      console.error("Failed to load reviews", e);
    }
  };

  const handleDownload = (id, url) => {
    api.post(`/resources/${id}/download`)
      .then(() => {
        // Fetch the file as a blob and trigger download
        fetch(url)
          .then(response => response.blob())
          .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            // Extract filename from URL or use default
            const filename = url.split('/').pop()?.split('?')[0] || 'resource';
            link.download = filename || 'resource';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          })
          .catch(err => {
            console.error('Download failed:', err);
            // Fallback: open in new tab
            window.open(url, '_blank');
          });
        fetchResources();
      })
      .catch(console.error);
  };

  const handleSubmitReview = async (id) => {
    try {
      const isAnonymous = review.isAnonymous || false;
      await api.post(`/resources/${id}/review?rating=${review.rating}&comment=${encodeURIComponent(review.comment)}&isAnonymous=${isAnonymous}`);
      setReviewing(null);
      setReview({ rating: 5, comment: '', isAnonymous: false });
      // Force refetch with fresh filters
      handleResetFilters();

      // refresh reviews if open
      if (reviewsCache[id]) {
        api.get(`/resources/${id}/reviews`).then(res => {
          setReviewsCache(prev => ({ ...prev, [id]: res.data }));
        }).catch(console.error);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Could not submit review.');
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Study Resources</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Button onClick={() => navigate('/resources/upload')} className="flex items-center gap-2">
              <Plus size={18} /> Upload Resource
            </Button>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <input type="checkbox" checked={showRecommended} onChange={e => setShowRecommended(e.target.checked)} className="rounded text-indigo-600" />
              Show recommended for me first
            </label>
          </div>
        </div>

        {/* Filter Bar */}
        <Card>
          <div className="flex flex-col gap-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-indigo-900 mb-3">Curriculum Context</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                  <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                    <option value="">Any</option>
                    {PROGRAM_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                    <option value="">Any</option>
                    {YEAR_OPTIONS.map(y => (
                      <option key={y} value={String(y)}>Year {y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                    <option value="">Any</option>
                    {SEMESTER_OPTIONS.map(s => (
                      <option key={s} value={String(s)}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Module Code</label>
                {moduleOptions.length > 0 ? (
                  <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
                    disabled={loadingModules}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                    {moduleOptions.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" placeholder="e.g. IT1050" value={filterModule} onChange={e => setFilterModule(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Uploader Intake</label>
                <input type="number" min="2000" max="2100" placeholder="e.g. 2024" value={filterUploaderIntake} onChange={e => setFilterUploaderIntake(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                  <option value="">Any</option>
                  <option value="NOTES">Notes</option>
                  <option value="EXAM_PAPER">Exam Paper</option>
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="TUTORIAL">Tutorial</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                <input type="number" min="1" max="5" step="0.1" placeholder="e.g. 4.0" value={filterRating} onChange={e => setFilterRating(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  disabled={showRecommended}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400">
                  <option value="default">Recommended</option>
                  <option value="rating">Rating</option>
                  <option value="downloads">Popularity</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
              <div className="flex flex-1 items-end">
                <Button variant="outline" onClick={handleResetFilters} className="h-[42px] px-6 w-full md:w-auto">Reset Filters</Button>
              </div>
            </div>
          </div>
        </Card>

        {loading ? <Loader /> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {resources.length === 0
              ? <div className="col-span-full"><Card><EmptyState text="No resources found." /></Card></div>
              : resources.map(r => (
                <Card key={r.id}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-500 shrink-0" /> {r.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge text={r.moduleCode} color="indigo" />
                        <Badge text={r.resourceType?.replace('_', ' ')} />
                        <Badge text={`⭐ ${r.avgRating > 0 ? r.avgRating.toFixed(1) : 'New'}`} color="green" />
                        {r.uploaderIntake > 0 && <Badge text={`Intake ${r.uploaderIntake}`} />}
                      </div>
                      {r.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{r.description}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Button variant="outline" onClick={() => handleDownload(r.id, r.fileUrl)} className="flex items-center gap-1.5 text-sm">
                        <Download size={14} /> Download
                      </Button>
                      <span className="text-xs text-gray-400">{r.downloads || 0} downloads</span>
                    </div>
                  </div>

                  {/* Review section */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {reviewing === r.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Rating:</label>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} type="button" onClick={() => setReview(rv => ({ ...rv, rating: n }))}
                              className={`text-xl transition-transform hover:scale-110 ${n <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea rows={2} placeholder="Write a short review..." value={review.comment}
                          onChange={e => setReview(rv => ({ ...rv, comment: e.target.value }))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input type="checkbox" checked={review.isAnonymous} onChange={e => setReview(rv => ({ ...rv, isAnonymous: e.target.checked }))} className="rounded text-indigo-600" />
                          Post anonymously
                        </label>
                        <div className="flex gap-2">
                          <Button onClick={() => handleSubmitReview(r.id)} className="text-sm py-1.5">Submit Review</Button>
                          <Button variant="outline" onClick={() => setReviewing(null)} className="text-sm py-1.5">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        {r.uploadedBy !== currentUser?.studentId && (
                          <button onClick={() => setReviewing(r.id)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors">
                            <Star size={14} /> Write a Review
                          </button>
                        )}
                        {r.uploadedBy === currentUser?.studentId && (
                          <span className="text-sm text-gray-400 flex items-center gap-1.5">
                            <Star size={14} /> You uploaded this
                          </span>
                        )}
                        <button onClick={() => {
                          if (reviewsCache[r.id]) {
                            setReviewsCache(p => { const next = { ...p }; delete next[r.id]; return next; });
                          } else {
                            loadReviews(r.id);
                          }
                        }}
                          className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          {reviewsCache[r.id] ? 'Hide Reviews' : 'View Reviews'}
                        </button>
                      </div>
                    )}

                    {reviewsCache[r.id] && reviewsCache[r.id].length > 0 && (
                      <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-48 overflow-y-auto w-full">
                        {reviewsCache[r.id].map((rev, i) => (
                          <div key={i} className="text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">{rev.studentId}</span>
                                {rev.studentId === 'Anonymous' && <Badge text="Anonymous" color="gray" />}
                              </div>
                              <span className="text-xs text-gray-400">{new Date(rev.date).toLocaleDateString()}</span>
                            </div>
                            <div className="text-yellow-500 text-xs mb-1">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                            <p className="text-gray-600 break-words w-full">{rev.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {reviewsCache[r.id] && reviewsCache[r.id].length === 0 && (
                      <p className="mt-3 text-sm text-gray-400">No reviews yet.</p>
                    )}
                  </div>
                </Card>
              ))
            }
          </div>
        )}
      </div>
    </Layout>
  );
}
