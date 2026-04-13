import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Layout } from '../components/layout/Layout';
import { Calendar as CalendarIcon, Video, Plus, Check, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function CalendarGrid({ sessions, onDayClick, selectedDate }) {
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const sessionsByDay = {};
  sessions.forEach(s => {
    const d = new Date(s.startTime);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!sessionsByDay[key]) sessionsByDay[key] = [];
      sessionsByDay[key].push(s);
    }
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const hasSessions = !!sessionsByDay[day];
          const isSelected = selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year;

          return (
            <button
              key={day}
              onClick={() => onDayClick(new Date(year, month, day), sessionsByDay[day] || [])}
              className={`relative flex flex-col items-center justify-start p-1.5 rounded-xl min-h-[52px] transition-all text-sm font-medium
                ${isSelected ? 'bg-indigo-600 text-white shadow-md' : isToday ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'hover:bg-gray-100 text-gray-700'}
              `}
            >
              <span>{day}</span>
              {hasSessions && (
                <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                  {sessionsByDay[day].slice(0, 3).map((s, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function SessionCard({ s, user, attending, checkedIn, onAttend, onCheckIn, onLoadAttendance, attendanceData }) {
  const startDate = new Date(s.startTime);
  const endDate = s.endTime ? new Date(s.endTime) : new Date(startDate.getTime() + 60 * 60 * 1000);
  const now = new Date();
  const isSoon = (startDate.getTime() - now.getTime()) < (24 * 60 * 60 * 1000) && startDate > now;
  const isDuring = now >= startDate && now <= endDate;
  const isAttending = attending[s.id];
  const isCheckedIn = checkedIn[s.id];
  const isHost = user && user.studentId === s.createdBy;

  return (
    <Card className={`flex flex-col justify-between ${isSoon ? 'border-rose-200 bg-rose-50/20' : ''}`}>
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-gray-900 pr-2">{s.title}</h3>
          <div className="flex flex-col gap-1 items-end">
            {isSoon && <Badge text="Soon" color="green" />}
            {isDuring && <Badge text="LIVE NOW" color="rose" />}
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CalendarIcon size={15} className="text-gray-400" />
            {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' – '}
            {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-gray-500">Host: <span className="font-medium text-gray-700">{s.createdBy}</span></div>
          {s.attendees && s.attendees.length > 0 && (
            <div className="text-gray-400 text-xs">{s.attendees.length} attendee{s.attendees.length !== 1 ? 's' : ''}</div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <div className="flex gap-2">
          {s.meetingLink && (
            <Button variant="primary" onClick={() => window.open(s.meetingLink, '_blank')}
              className="flex-1 flex justify-center items-center gap-2 text-xs py-2">
              <Video size={14} /> Join Call
            </Button>
          )}
          {!isDuring && (
            <Button
              variant={isAttending ? 'secondary' : 'outline'}
              onClick={() => onAttend(s.id)}
              disabled={isAttending}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 ${isAttending ? 'text-green-600 bg-green-50 border-green-200' : ''}`}>
              <Check size={14} /> {isAttending ? "I'm here" : "Attend"}
            </Button>
          )}
          {isDuring && (
            <Button
              variant={isCheckedIn ? 'secondary' : 'outline'}
              onClick={() => onCheckIn(s.id)}
              disabled={isCheckedIn}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 ${isCheckedIn ? 'text-green-600 bg-green-50 border-green-200' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
              <Check size={14} /> {isCheckedIn ? "Checked In" : "Check In"}
            </Button>
          )}
        </div>

        {isHost && (
          <div className="pt-3 border-t border-gray-100 mt-2">
            <button onClick={() => onLoadAttendance(s.id)} className="text-xs text-indigo-600 font-bold hover:underline">
              {attendanceData[s.id] ? "Hide Attendance" : "View Attendance Summary"}
            </button>
            {attendanceData[s.id] && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-xs font-bold text-slate-800 mb-2">Checked in Students ({attendanceData[s.id].length})</p>
                {attendanceData[s.id].length === 0 ? <p className="text-xs text-gray-500">Nobody checked in yet.</p> : (
                  <ul className="space-y-1">
                    {attendanceData[s.id].map(a => (
                      <li key={a.id} className="text-xs text-slate-600 flex justify-between">
                        <span>{a.studentId}</span>
                        <span>{new Date(a.checkedInAt).toLocaleTimeString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState({});
  const [checkedIn, setCheckedIn] = useState({});
  const [attendanceData, setAttendanceData] = useState({});
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayPanelSessions, setDayPanelSessions] = useState([]);

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data)).catch(console.error);
  }, []);

  const fetchSessions = () => {
    const end = new Date();
    end.setDate(end.getDate() + 60);
    const startStr = new Date().toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    api.get(`/sessions/upcoming?start=${startStr}T00:00&end=${endStr}T23:59`)
      .then(res => setSessions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleAttend = (sessionId) => {
    api.post(`/sessions/${sessionId}/join`).then(() => {
      setAttending(a => ({ ...a, [sessionId]: true }));
    }).catch(() => { });
  };

  const handleCheckIn = (sessionId) => {
    api.post(`/sessions/${sessionId}/checkin`).then(() => {
      setCheckedIn(c => ({ ...c, [sessionId]: true }));
    }).catch(console.error);
  };

  const loadAttendance = (sessionId) => {
    if (attendanceData[sessionId]) {
      setAttendanceData(d => { const n = { ...d }; delete n[sessionId]; return n; });
    } else {
      api.get(`/sessions/${sessionId}/attendance`).then(res => {
        setAttendanceData(d => ({ ...d, [sessionId]: res.data }));
      }).catch(console.error);
    }
  };

  const handleDayClick = (date, daySessions) => {
    setSelectedDate(date);
    setDayPanelSessions(daySessions);
  };

  if (loading) return <Layout><Loader /></Layout>;

  const sessionCardProps = { user, attending, checkedIn, onAttend: handleAttend, onCheckIn: handleCheckIn, onLoadAttendance: loadAttendance, attendanceData };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Study Sessions</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <CalendarIcon size={15} /> Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <List size={15} /> List
              </button>
            </div>
            <Button onClick={() => navigate('/sessions/create')} className="flex items-center gap-2">
              <Plus size={18} /> Schedule Session
            </Button>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar grid */}
            <div className="lg:col-span-2">
              <CalendarGrid sessions={sessions} onDayClick={handleDayClick} selectedDate={selectedDate} />
            </div>

            {/* Day panel */}
            <div className="space-y-4">
              {selectedDate ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-800 text-lg">
                      {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {dayPanelSessions.length} session{dayPanelSessions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {dayPanelSessions.length === 0 ? (
                    <Card>
                      <EmptyState text="No sessions on this day." />
                      {selectedDate && selectedDate.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) && (
                        <div className="text-center mt-3">
                          <button onClick={() => navigate('/sessions/create', { state: { prefillStartTime: selectedDate.toISOString().slice(0, 16) } })}
                            className="text-indigo-600 text-sm font-medium hover:underline">+ Schedule one</button>
                        </div>
                      )}
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {dayPanelSessions.map(s => (
                        <SessionCard key={s.id} s={s} {...sessionCardProps} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Card className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon size={40} className="text-gray-200 mb-3" />
                  <p className="text-gray-500 text-sm font-medium">Click a day to see sessions</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          sessions.length === 0 ? (
            <Card><EmptyState text="No upcoming sessions. Schedule one for your group!" /></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map(s => <SessionCard key={s.id} s={s} {...sessionCardProps} />)}
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
