import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [resources, setResources] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('http://localhost:8080/api/groups/my', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setGroups(res.data))
      .catch(err => console.log(err));
    axios.get('http://localhost:8080/api/resources/search', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setResources(res.data.slice(0, 5)))
      .catch(err => console.log(err));
  }, [token]);

  return (
    <div>
      <h1>Dashboard</h1>
      <nav>
        <Link to="/groups">My Groups</Link> | <Link to="/resources">Resources</Link> | 
        <Link to="/matching">Find Study Buddies</Link> | <Link to="/sessions">Sessions</Link>
      </nav>
      <h3>Your Study Groups</h3>
      <ul>{groups.map(g => <li key={g.id}>{g.name} ({g.moduleCode})</li>)}</ul>
      <h3>Recent Resources</h3>
      <ul>{resources.map(r => <li key={r.id}>{r.title} - ⭐{r.avgRating}</li>)}</ul>
    </div>
  );
}

export default Dashboard;