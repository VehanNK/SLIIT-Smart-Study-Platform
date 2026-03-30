import React from 'react';

export function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition duration-200 ${className}`}>
      {title && <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>}
      {children}
    </div>
  );
}
