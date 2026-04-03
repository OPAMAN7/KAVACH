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

<<<<<<< HEAD
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp, colorClass = "text-[#e8521a]" }) => {
  const getIconBg = () => {
    if (colorClass.includes('orange') || colorClass.includes('e8521a') || colorClass.includes('f97316')) return 'bg-[#fff4ee] text-[#e8521a]';
    if (colorClass.includes('danger') || colorClass.includes('dc2626') || colorClass.includes('ef476f')) return 'bg-[#fef2f2] text-[#dc2626]';
    if (colorClass.includes('warning') || colorClass.includes('d97706') || colorClass.includes('ffd166')) return 'bg-[#fffbeb] text-[#d97706]';
    if (colorClass.includes('success') || colorClass.includes('16a34a') || colorClass.includes('06d6a0')) return 'bg-[#f0fdf4] text-[#16a34a]';
    if (colorClass.includes('info') || colorClass.includes('2563eb') || colorClass.includes('accent')) return 'bg-[#fff4ee] text-[#e8521a]';
    return 'bg-[#f5f5f0] text-[#666]';
  };

  const iconBg = getIconBg();

  return (
    <div className="bg-white border border-[#e8e6e0] rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#e8521a]/30 transition-all duration-200 card-hover">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider leading-tight">{title}</h3>
        <div className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-black text-[#111] leading-none">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp
              ? 'bg-[#f0fdf4] text-[#16a34a]'
              : 'bg-[#fef2f2] text-[#dc2626]'
            }`}>
            {trendUp ? '↑' : '↓'} {trend}
=======
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
>>>>>>> 56db3e8247e61c3986066c68fee7e7ea022c0cac
          </span>
        )}
      </div>
    </div>
  );
};