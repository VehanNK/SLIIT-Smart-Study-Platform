import React from 'react';
import { FolderOpen } from 'lucide-react';

export function EmptyState({ text, icon: Icon = FolderOpen }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-500 font-medium text-sm">{text}</p>
    </div>
  );
}
