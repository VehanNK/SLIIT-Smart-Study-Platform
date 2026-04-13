import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [newSession, setNewSession] = useState({ groupId: '', title: '', startTime: '', endTime: '' });
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('http://localhost:8080/api/sessions/upcoming', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSessions(res.data));
  }, [token]);

  const createSession = async () => {
    await axios.post('http://localhost:8080/api/sessions', newSession, { headers: { Authorization: `Bearer ${token}` } });
    alert('Session created!');
  };

  const joinSession = async (sessionId) => {
    await axios.post(`http://localhost:8080/api/sessions/${sessionId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } });
    alert('Joined!');
  };

  return (
    <div>
      <h2>Live Study Sessions</h2>
      <div>
        <h3>Schedule New Session</h3>
        <input placeholder="Group ID" value={newSession.groupId} onChange={e => setNewSession({...newSession, groupId: e.target.value})} />
        <input placeholder="Title" value={newSession.title} onChange={e => setNewSession({...newSession, title: e.target.value})} />
        <input type="datetime-local" value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} />
        <input type="datetime-local" value={newSession.endTime} onChange={e => setNewSession({...newSession, endTime: e.target.value})} />
        <button onClick={createSession}>Create</button>
      </div>
      <h3>Upcoming Sessions</h3>
      {sessions.map(s => (
        <div key={s.id}>
          <strong>{s.title}</strong> - {s.startTime} <a href={s.meetingLink}>Join Meeting</a>
          <button onClick={() => joinSession(s.id)}>Mark Attendance</button>
        </div>
      ))}
    </div>
  );
}

export default Sessions;