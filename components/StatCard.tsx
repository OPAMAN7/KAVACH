import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp, colorClass = "text-cyber-accent" }) => {
  return (
    <div className="bg-cyber-800 border border-cyber-600 rounded-lg p-4 shadow-lg hover:border-cyber-400 transition-colors duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-cyber-300 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <div className={`p-2 rounded-full bg-opacity-20 ${colorClass.replace('text-', 'bg-')}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white font-mono">{value}</span>
        {trend && (
          <span className={`text-xs font-mono px-2 py-1 rounded ${trendUp ? 'text-cyber-success bg-cyber-success/10' : 'text-cyber-danger bg-cyber-danger/10'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};