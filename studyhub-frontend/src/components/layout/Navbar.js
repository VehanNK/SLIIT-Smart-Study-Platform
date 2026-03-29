import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export function Navbar() {
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setStudentId(res.data.studentId || ''))
      .catch(() => {});
  }, []);

  const initials = studentId ? studentId.slice(-4) : 'ST';

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 h-16 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center space-x-4">
        {studentId && (
          <span className="text-sm font-medium text-gray-600 hidden md:block">{studentId}</span>
        )}
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md text-xs">
          {initials}
        </div>
      </div>
    </header>
  );
}
