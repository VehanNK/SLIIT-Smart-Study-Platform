import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Matching() {
  const [peers, setPeers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('http://localhost:8080/api/matches/peers', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPeers(res.data));
    axios.get('http://localhost:8080/api/matches/mentors', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMentors(res.data));
  }, [token]);

  return (
    <div>
      <h2>Study Buddy Matching</h2>
      <h3>Same Program & Intake (Peers)</h3>
      <ul>{peers.map(p => <li key={p.id}>{p.studentId} - {p.program} Y{p.currentYear}</li>)}</ul>
      <h3>Senior Mentors</h3>
      <ul>{mentors.map(m => <li key={m.id}>{m.studentId} - {m.program} Intake {m.intakeYear}</li>)}</ul>
    </div>
  );
}

export default Matching;