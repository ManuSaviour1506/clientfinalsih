import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/**
 * VelocityChart handles both single-session and dual-session comparison.
 * Expects data in the format: [{ time: '0s', velA: 10, velB: 12 }, ...]
 */
const VelocityChart = ({ data = [] }) => {
  // Safety check: show a message if data is missing or empty
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <p className="text-gray-400 italic">No telemetry data available for this selection</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {/* Gradient for Selected 1 (Amber) */}
            <linearGradient id="colorVelA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            {/* Gradient for Selected 2 (Blue) */}
            <linearGradient id="colorVelB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12, fill: '#9ca3af' }} 
            axisLine={false} 
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#9ca3af' }} 
            axisLine={false} 
            tickLine={false}
            label={{ value: 'm/s', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />

          {/* Area for Submission A */}
          <Area
            type="monotone"
            dataKey="velA"
            name="Session 1"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorVelA)"
            activeDot={{ r: 6 }}
          />

          {/* Area for Submission B */}
          <Area
            type="monotone"
            dataKey="velB"
            name="Session 2"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorVelB)"
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VelocityChart;