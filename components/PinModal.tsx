import React, { useState } from 'react';
import { Unlock, X } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '241078') {
      onUnlock();
      onClose();
      setPin('');
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-cyber-900 border-2 border-cyber-600 rounded-lg p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-cyber-400 hover:text-white transition-colors"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-cyber-800 rounded-full border border-cyber-500 mb-4 flex items-center justify-center overflow-hidden p-1">
                <img 
                    src="/logo.png" 
                    alt="KAVACH" 
                    className="w-full h-full object-contain"
                />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wider">ADMIN AUTHENTICATION</h2>
            <p className="text-sm text-cyber-400 mt-1">Enter security PIN to access Enterprise Modules</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
                <input 
                    type="password" 
                    value={pin}
                    onChange={(e) => {
                        setPin(e.target.value);
                        setError(false);
                    }}
                    maxLength={6}
                    placeholder="------"
                    className={`w-full bg-cyber-950 border-2 ${error ? 'border-cyber-danger text-cyber-danger' : 'border-cyber-700 text-cyber-accent'} rounded px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-cyber-accent transition-colors`}
                    autoFocus
                />
            </div>
            
            {error && (
                <div className="text-cyber-danger text-xs text-center font-bold animate-pulse">
                    ACCESS DENIED: INVALID PIN
                </div>
            )}

            <button 
                type="submit"
                className="w-full bg-cyber-600 hover:bg-cyber-500 text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2"
            >
                <Unlock className="w-4 h-4" />
                UNLOCK PANEL
            </button>
        </form>
      </div>
    </div>
  );
};