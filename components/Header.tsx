import React from 'react';
import { Bell, Menu, Shield } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
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
          </div>
        </div>
      </div>

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
        </div>
      </div>
    </header>
  );
};