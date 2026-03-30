import React from 'react';

export function Badge({ text, color = 'gray' }) {
  const colors = {
    gray: "bg-gray-100 text-gray-700",
    indigo: "bg-indigo-100 text-indigo-700",
    green: "bg-green-100 text-green-700",
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${colors[color] || colors.gray}`}>
      {text}
    </span>
  );
}
