import React from 'react';
<<<<<<< HEAD
import { LayoutDashboard, Radio, Database, FileText, Settings, Shield, Clock, BrainCircuit, Users, FileSearch, ScanSearch } from 'lucide-react';
=======
import { LayoutDashboard, Radio, Database, FileText, Settings, Shield, Activity, Clock, BrainCircuit, Users } from 'lucide-react';
>>>>>>> 56db3e8247e61c3986066c68fee7e7ea022c0cac

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAdminClick: () => void;
  onSettingsClick: () => void;
  isUnlocked: boolean;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'live-feed', label: 'Live Intel Feed', icon: Radio },
  { id: 'social-search', label: 'Social Media Search', icon: Users },
  { id: 'nlp-search', label: 'NLP Search', icon: BrainCircuit },
  { id: 'leaks', label: 'Leak Monitor', icon: Database },
  { id: 'history', label: 'Search History', icon: Clock },
  { id: 'reports', label: 'Threat Reports', icon: FileText },
<<<<<<< HEAD
  { id: 'hidden-data', label: 'Hidden Data', icon: FileSearch },
  { id: 'spiderfoot', label: 'SpiderFoot Recon', icon: ScanSearch },
=======
>>>>>>> 56db3e8247e61c3986066c68fee7e7ea022c0cac
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, setActiveTab, onAdminClick, onSettingsClick, isUnlocked }) => {
  return (
<<<<<<< HEAD
    <aside
      className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-[#e8e6e0] transition-transform duration-300 z-10 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
    >
      <div className="flex flex-col h-full">
        {/* System Status */}
        <div className="p-4">
          <div className="mb-5 px-3 py-2.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#16a34a] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16a34a]" />
            </div>
            <div>
              <div className="text-[10px] text-[#666] uppercase font-semibold tracking-wide">System Status</div>
              <div className="text-xs font-bold text-[#16a34a] tracking-wide">OPERATIONAL</div>
            </div>
          </div>

          {/* Nav Section Label */}
          <div className="text-[10px] text-[#bbb] uppercase font-semibold tracking-wider mb-2 px-3">Navigation</div>

          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                      ? 'bg-[#fff4ee] text-[#e8521a] border border-[#fbd5c0]'
                      : 'text-[#555] hover:bg-[#f5f5f0] hover:text-[#111] border border-transparent'
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#e8521a]' : 'text-[#999]'}`}
                  />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e8521a] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#e8e6e0] space-y-0.5">
          <button
            onClick={onSettingsClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[#555] hover:text-[#111] hover:bg-[#f5f5f0] rounded-lg transition-colors text-sm font-medium border border-transparent"
          >
            <Settings className="w-4 h-4 text-[#999]" />
            <span>Settings</span>
          </button>
          <button
            onClick={onAdminClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium border ${isUnlocked
                ? 'text-[#16a34a] bg-[#f0fdf4] border-[#bbf7d0]'
                : 'text-[#555] hover:text-[#111] hover:bg-[#f5f5f0] border-transparent'
              }`}
          >
            <Shield className={`w-4 h-4 ${isUnlocked ? 'text-[#16a34a]' : 'text-[#999]'}`} />
            <span>{isUnlocked ? 'Admin Unlocked' : 'Admin Panel'}</span>
          </button>
        </div>
=======
    <aside className={`fixed top-16 left-0 bottom-0 w-64 bg-cyber-900 border-r border-cyber-700 transition-transform duration-300 z-10 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="p-4">
        <div className="mb-6 px-4 py-3 bg-cyber-800 rounded border border-cyber-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyber-900 border border-cyber-600 overflow-hidden flex-shrink-0">
             <img src="/logo.png" alt="Kavach" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-xs text-cyber-400 uppercase font-bold mb-0.5">System Status</div>
            <div className="flex items-center gap-1.5 text-cyber-success text-xs font-mono font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-success"></span>
                </span>
                OPERATIONAL
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-cyber-800 text-cyber-accent border-l-4 border-cyber-accent' 
                    : 'text-cyber-400 hover:bg-cyber-800 hover:text-white border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyber-accent' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyber-700">
        <button 
            onClick={onSettingsClick}
            className="w-full flex items-center gap-3 px-4 py-3 text-cyber-400 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
         <button 
            onClick={onAdminClick}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:text-white transition-colors ${isUnlocked ? 'text-cyber-success' : 'text-cyber-400'}`}
         >
          <Shield className="w-5 h-5" />
          <span className="text-sm font-medium">
              {isUnlocked ? 'Admin Unlocked' : 'Admin Panel'}
          </span>
        </button>
>>>>>>> 56db3e8247e61c3986066c68fee7e7ea022c0cac
      </div>
    </aside>
  );
};