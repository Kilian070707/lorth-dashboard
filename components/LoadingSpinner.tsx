"use client";

import React from 'react';

const LoadingSpinner = ({ text = "Chargement" }: { text?: string }) => {
  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-[#020408] animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full fast-spin"></div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{text}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
