import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: '', moduleCode: '', moduleName: '', year: 1, semester: 1, targetProgram: 'ALL', description: '' });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const res = await axios.get('http://localhost:8080/api/groups/my', { headers: { Authorization: `Bearer ${token}` } });
    setGroups(res.data);
  };

  const createGroup = async () => {
    await axios.post('http://localhost:8080/api/groups', newGroup, { headers: { Authorization: `Bearer ${token}` } });
    fetchGroups();
    setNewGroup({ name: '', moduleCode: '', moduleName: '', year: 1, semester: 1, targetProgram: 'ALL', description: '' });
  };

  const joinGroup = async (groupId) => {
    await axios.post(`http://localhost:8080/api/groups/${groupId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchGroups();
  };

  return (
    <div>
      <h2>Study Groups</h2>
      <div>
        <h3>Create New Group</h3>
        <input placeholder="Name" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
        <input placeholder="Module Code" value={newGroup.moduleCode} onChange={e => setNewGroup({...newGroup, moduleCode: e.target.value})} />
        <input placeholder="Module Name" value={newGroup.moduleName} onChange={e => setNewGroup({...newGroup, moduleName: e.target.value})} />
        <input type="number" placeholder="Year" value={newGroup.year} onChange={e => setNewGroup({...newGroup, year: parseInt(e.target.value)})} />
        <input type="number" placeholder="Semester" value={newGroup.semester} onChange={e => setNewGroup({...newGroup, semester: parseInt(e.target.value)})} />
        <select value={newGroup.targetProgram} onChange={e => setNewGroup({...newGroup, targetProgram: e.target.value})}>
          <option value="ALL">All Programs</option>
          <option value="IT">IT</option>
          <option value="CS">CS</option>
          <option value="DS">DS</option>
          <option value="SE">SE</option>
        </select>
        <textarea placeholder="Description" value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})} />
        <button onClick={createGroup}>Create</button>
      </div>
      <h3>Your Groups</h3>
      <ul>{groups.map(g => <li key={g.id}>{g.name} - {g.moduleCode} <button onClick={() => joinGroup(g.id)}>Join (if not already)</button></li>)}</ul>
    </div>
  );
}

export default Groups;