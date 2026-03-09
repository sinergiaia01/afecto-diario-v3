import React from 'react';
import { Emotion, EMOTION_COLORS } from '../types';

interface EmotionBadgeProps {
  emotion: Emotion;
  intensity: number;
}

const EmotionBadge: React.FC<EmotionBadgeProps> = ({ emotion, intensity }) => {
  const color = EMOTION_COLORS[emotion] || '#000';
  
  return (
    <div className="flex items-center space-x-2">
      <span 
        className="px-2 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-sm"
        style={{ backgroundColor: color }}
      >
        {emotion}
      </span>
      <div className="flex items-center space-x-1" title={`Intensidad: ${intensity}/10`}>
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className={`h-2 w-2 rounded-full ${i < Math.ceil(intensity / 2) ? 'bg-slate-800' : 'bg-slate-200'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default EmotionBadge;