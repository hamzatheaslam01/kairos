import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ fallback = '/dashboard', label = 'Back' }) => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => window.history.length > 1 ? navigate(-1) : navigate(fallback)}
      className="flex items-center gap-2 text-on-surface-variant font-eyebrow text-[11px] uppercase tracking-widest hover:text-primary transition-all duration-300 group"
    >
      <div className="w-8 h-8 rounded-full border border-outline/30 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
        <span className="material-symbols-outlined text-[18px] font-[200] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
      </div>
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
