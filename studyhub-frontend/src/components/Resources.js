import React, { useState } from 'react';
import axios from 'axios';

function Resources() {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState({ moduleCode: '', year: '', semester: '' });
  const [newResource, setNewResource] = useState({ title: '', description: '', fileUrl: '', moduleCode: '', year: 1, semester: 1, resourceType: 'notes' });
  const token = localStorage.getItem('token');

  const searchResources = async () => {
    const params = new URLSearchParams();
    if (search.moduleCode) params.append('moduleCode', search.moduleCode);
    if (search.year) params.append('year', search.year);
    if (search.semester) params.append('semester', search.semester);
    const res = await axios.get(`http://localhost:8080/api/resources/search?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    setResources(res.data);
  };

  const uploadResource = async () => {
    await axios.post('http://localhost:8080/api/resources', newResource, { headers: { Authorization: `Bearer ${token}` } });
    alert('Uploaded!');
    setNewResource({ title: '', description: '', fileUrl: '', moduleCode: '', year: 1, semester: 1, resourceType: 'notes' });
    searchResources();
  };

  const addReview = async (resourceId, rating, comment) => {
    await axios.post(`http://localhost:8080/api/resources/${resourceId}/review?rating=${rating}&comment=${comment}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    searchResources();
  };

  return (
    <div>
      <h2>Resource Repository</h2>
      <div>
        <h3>Search</h3>
        <input placeholder="Module Code" value={search.moduleCode} onChange={e => setSearch({...search, moduleCode: e.target.value})} />
        <input placeholder="Year" value={search.year} onChange={e => setSearch({...search, year: e.target.value})} />
        <input placeholder="Semester" value={search.semester} onChange={e => setSearch({...search, semester: e.target.value})} />
        <button onClick={searchResources}>Search</button>
      </div>
      <div>
        <h3>Upload Resource</h3>
        <input placeholder="Title" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} />
        <textarea placeholder="Description" value={newResource.description} onChange={e => setNewResource({...newResource, description: e.target.value})} />
        <input placeholder="File URL" value={newResource.fileUrl} onChange={e => setNewResource({...newResource, fileUrl: e.target.value})} />
        <input placeholder="Module Code" value={newResource.moduleCode} onChange={e => setNewResource({...newResource, moduleCode: e.target.value})} />
        <input type="number" placeholder="Year" value={newResource.year} onChange={e => setNewResource({...newResource, year: parseInt(e.target.value)})} />
        <input type="number" placeholder="Semester" value={newResource.semester} onChange={e => setNewResource({...newResource, semester: parseInt(e.target.value)})} />
        <select value={newResource.resourceType} onChange={e => setNewResource({...newResource, resourceType: e.target.value})}>
          <option value="notes">Notes</option>
          <option value="past_paper">Past Paper</option>
          <option value="lab_sheet">Lab Sheet</option>
        </select>
        <button onClick={uploadResource}>Upload</button>
      </div>
      <h3>Results</h3>
      {resources.map(r => (
        <div key={r.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h4>{r.title}</h4>
          <p>{r.description}</p>
          <a href={r.fileUrl} target="_blank">Download</a> | Downloads: {r.downloads} | Rating: {r.avgRating}
          <div>
            <input type="number" min="1" max="5" placeholder="Rating" id={`rating-${r.id}`} />
            <input type="text" placeholder="Comment" id={`comment-${r.id}`} />
            <button onClick={() => {
              const rating = document.getElementById(`rating-${r.id}`).value;
              const comment = document.getElementById(`comment-${r.id}`).value;
              addReview(r.id, rating, comment);
            }}>Add Review</button>
          </div>
          <ul>
            {r.reviews?.map((rev, idx) => <li key={idx}>{rev.studentId}: ⭐{rev.rating} - {rev.comment}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default Resources;