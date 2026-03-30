import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { LiveFeed } from './components/LiveFeed';
import { LeakMonitor } from './components/LeakMonitor';
import { HistoryLogView } from './components/HistoryLog';
import { ThreatReports } from './components/ThreatReports';
import { NLPSearch } from './components/NLPSearch';
import { SocialSearch } from './components/SocialSearch';
import { HiddenData } from './components/HiddenData';
import { SpiderFoot } from './components/SpiderFoot';
import { PinModal } from './components/PinModal';
import { SettingsModal } from './components/SettingsModal';
import { AlertOctagon } from 'lucide-react';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Security & Config State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'live-feed':
        return <LiveFeed />;
      case 'social-search':
        if (isUnlocked) return <SocialSearch />;
        return <RestrictedAccess />;
      case 'nlp-search':
        if (isUnlocked) return <NLPSearch />;
        return <RestrictedAccess />;
      case 'leaks':
        if (isUnlocked) return <LeakMonitor />;
        return <RestrictedAccess />;
      case 'history':
        if (isUnlocked) return <HistoryLogView />;
        return <RestrictedAccess />;
      case 'reports':
        if (isUnlocked) return <ThreatReports />;
        return <RestrictedAccess />;
      case 'hidden-data':
        if (isUnlocked) return <HiddenData />;
        return <RestrictedAccess />;
      case 'spiderfoot':
        if (isUnlocked) return <SpiderFoot />;
        return <RestrictedAccess />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f0', color: '#111111', fontFamily: 'Inter, sans-serif' }}>
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <Sidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        onAdminClick={() => !isUnlocked && setShowPinModal(true)}
        onSettingsClick={() => setShowSettingsModal(true)}
        isUnlocked={isUnlocked}
      />

      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onUnlock={() => setIsUnlocked(true)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <main className={`pt-20 px-5 pb-8 transition-all duration-300 lg:ml-64 min-h-screen`}>
        <div className="max-w-7xl mx-auto h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const RestrictedAccess = () => (
  <div className="flex flex-col items-center justify-center h-[70vh] border-2 border-dashed border-[#e8e6e0] rounded-2xl bg-white">
    <div className="p-5 bg-[#fef2f2] rounded-full mb-5 border border-[#fecaca]">
      <AlertOctagon className="w-12 h-12 text-[#dc2626]" />
    </div>
    <h2 className="text-2xl font-bold mb-2 text-[#111]">Restricted Access</h2>
    <p className="max-w-sm text-center mb-5 text-[#666] text-sm leading-relaxed">
      This intelligence module is locked to Enterprise users only. Please authenticate via the Admin Panel to access this data.
    </p>
    <div className="px-4 py-2 bg-[#f5f5f0] border border-[#e8e6e0] rounded-lg text-sm font-mono text-[#888]">
      Error Code: ENT_AUTH_REQUIRED
    </div>
  </div>
);

export default App;