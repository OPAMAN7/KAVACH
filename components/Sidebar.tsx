import React from 'react';
import { LayoutDashboard, Radio, Database, FileText, Settings, Shield, Clock, BrainCircuit, Users, FileSearch, ScanSearch } from 'lucide-react';

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
  { id: 'hidden-data', label: 'Hidden Data', icon: FileSearch },
  { id: 'spiderfoot', label: 'SpiderFoot Recon', icon: ScanSearch },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, setActiveTab, onAdminClick, onSettingsClick, isUnlocked }) => {
  return (
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
      </div>
    </aside>
  );
};