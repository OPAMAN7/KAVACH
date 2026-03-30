import React from 'react';
import { Bell, Settings, Menu, Search, Shield } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
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
          </div>
        </div>
      </div>

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
        </div>
      </div>
    </header>
  );
};