
import React from 'react';
import { NewsSection } from '../types';

interface AnalysisCardProps {
  section: NewsSection;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ section }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
          {section.category}
        </span>
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{section.title}</h3>
      <p className="text-slate-600 leading-relaxed mb-4">{section.content}</p>
      <div className="space-y-2">
        {section.keyPoints.map((point, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
            <span className="text-sm text-slate-500 italic">{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisCard;
