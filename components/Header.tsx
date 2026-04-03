import React from 'react';
<<<<<<< HEAD
import { Bell, Settings, Menu, Search, Shield } from 'lucide-react';
=======
import { Bell, Menu, Shield } from 'lucide-react';
>>>>>>> 56db3e8247e61c3986066c68fee7e7ea022c0cac

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
<<<<<<< HEAD
    <header className="h-16 bg-white border-b border-[#e8e6e0] flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-20 shadow-sm">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-8">
        <button onClick={toggleSidebar} className="text-[#666] hover:text-[#111] lg:hidden">
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-9 h-9 rounded-lg bg-[#e8521a] flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
            <img
              src="/logo.png"
              alt="KAVACH"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  const shield = document.createElement('div');
                  shield.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
                  e.currentTarget.parentElement.appendChild(shield.firstChild!);
                }
              }}
            />
          </div>
          <div>
            <div className="text-[15px] font-black tracking-tight leading-none">
              <span className="text-[#111]">KAVACH</span>
              <span className="text-[#e8521a] ml-0.5">COMMAND</span>
            </div>
            <div className="text-[10px] text-[#999] font-medium tracking-wide uppercase leading-none mt-0.5">
              Threat Intelligence System
            </div>
=======
    <header className="h-16 bg-cyber-900 border-b border-cyber-700 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-20 shadow-xl shadow-black/20">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="text-cyber-400 hover:text-white lg:hidden">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 group cursor-pointer">
          {/* Logo Container with Fallback */}
          <div className="w-10 h-10 rounded-lg bg-cyber-800 border border-cyber-600 p-0.5 overflow-hidden flex items-center justify-center relative shadow-lg group-hover:border-cyber-accent transition-colors">
             {/* Background Icon (Fallback/Underlay) */}
             <Shield className="w-6 h-6 text-cyber-accent absolute opacity-80" />
             
             {/* Main Logo Image */}
             <img 
                src="/logo.png" 
                alt="KAVACH Logo" 
                className="w-full h-full object-contain relative z-10"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
             />
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-widest text-white leading-none group-hover:text-cyber-accent transition-colors">
              KAVACH
            </h1>
            <span className="text-[10px] text-cyber-400 font-mono tracking-wide uppercase">Threat Intelligence System</span>
>>>>>>> 56db3e8247e61c3986066c68fee7e7ea022c0cac
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Right: Search + Bells + User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-[#f5f5f0] border border-[#e8e6e0] rounded-full px-4 py-2 w-56 hover:border-[#e8521a]/40 transition-colors">
          <Search className="w-3.5 h-3.5 text-[#999] flex-shrink-0" />
          <input
            className="bg-transparent text-sm text-[#111] placeholder-[#bbb] focus:outline-none w-full"
            placeholder="Search global vectors..."
          />
        </div>

        {/* Bell */}
        <button className="relative w-9 h-9 flex items-center justify-center bg-[#f5f5f0] hover:bg-[#e8e6e0] rounded-full transition-colors">
          <Bell className="w-4 h-4 text-[#444]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#e8521a] rounded-full border-2 border-white" />
        </button>

        {/* Settings */}
        <button className="w-9 h-9 flex items-center justify-center bg-[#f5f5f0] hover:bg-[#e8e6e0] rounded-full transition-colors">
          <Settings className="w-4 h-4 text-[#444]" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-[#e8e6e0]" />

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-[#111] leading-none">Operator</div>
            <div className="text-[10px] text-[#16a34a] font-semibold mt-0.5 leading-none">SECURE LINK</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8521a] to-[#c73f0a] flex items-center justify-center text-xs font-bold text-white shadow-sm">
            OP
          </div>
=======
      <div className="flex items-center gap-4">
        <button className="relative text-cyber-300 hover:text-white transition-colors p-2 hover:bg-cyber-800 rounded-full">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyber-danger rounded-full animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyber-danger rounded-full border border-cyber-900"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-cyber-700">
            <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white">Operator</div>
                <div className="text-[10px] text-cyber-success font-mono">SECURE LINK</div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyber-600 to-cyber-800 border border-cyber-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            OP
            </div>
>>>>>>> 56db3e8247e61c3986066c68fee7e7ea022c0cac
        </div>
      </div>
    </header>
  );
};