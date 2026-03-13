import React from 'react';
import { LayoutDashboard, Radio, Database, FileText, Settings, Shield, Activity, Clock, BrainCircuit, Users } from 'lucide-react';

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
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, setActiveTab, onAdminClick, onSettingsClick, isUnlocked }) => {
  return (
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
      </div>
    </aside>
  );
};