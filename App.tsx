import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { LiveFeed } from './components/LiveFeed';
import { LeakMonitor } from './components/LeakMonitor';
import { HistoryLogView } from './components/HistoryLog';
import { ThreatReports } from './components/ThreatReports';
import { NLPSearch } from './components/NLPSearch';
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
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-cyber-900 text-slate-200 font-sans selection:bg-cyber-accent selection:text-cyber-900">
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

      <main className={`pt-20 px-4 pb-6 transition-all duration-300 lg:ml-64 min-h-screen`}>
        <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

const RestrictedAccess = () => (
    <div className="flex flex-col items-center justify-center h-[70vh] text-cyber-500 border-2 border-dashed border-cyber-800 rounded-lg">
        <div className="p-6 bg-cyber-900/50 rounded-full mb-6">
            <AlertOctagon className="w-16 h-16 text-cyber-danger opacity-80" />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-white">Restricted Access</h2>
        <p className="max-w-md text-center mb-6">This intelligence module is locked to Enterprise users only. Please authenticate via the Admin Panel to access this data.</p>
        <div className="px-4 py-2 bg-cyber-800 rounded text-sm font-mono text-cyber-400">Error Code: ENT_AUTH_REQUIRED</div>
    </div>
);

export default App;