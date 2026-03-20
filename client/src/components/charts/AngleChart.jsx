import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Legend, Tooltip 
} from 'recharts';

const AngleChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg border-2 border-dashed">
        <p className="text-gray-400 italic">No angle data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend />

          {/* Session 1 (Amber) */}
          <Radar
            name="Session 1"
            dataKey="valueA"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.4}
          />

          {/* Session 2 (Blue) */}
          <Radar
            name="Session 2"
            dataKey="valueB"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AngleChart;