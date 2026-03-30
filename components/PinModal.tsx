import React, { useState } from 'react';
import { Unlock, X, Shield } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white border border-[#e8e6e0] rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#ccc] hover:text-[#111] transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f0]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-[#fff4ee] border border-[#fbd5c0] rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="KAVACH"
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <Shield className="w-8 h-8 text-[#e8521a] hidden" style={{ display: 'none' }} />
          </div>
          <h2 className="text-lg font-black text-[#111] tracking-tight">Admin Authentication</h2>
          <p className="text-xs text-[#888] mt-1 text-center">Enter security PIN to access Enterprise Modules</p>
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
              placeholder="• • • • • •"
              className={`w-full border-2 ${error
                  ? 'border-[#dc2626] bg-[#fef2f2] text-[#dc2626]'
                  : 'border-[#e8e6e0] bg-[#f5f5f0] text-[#111] focus:border-[#e8521a]'
                } rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none transition-colors`}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-[#dc2626] text-xs text-center font-bold bg-[#fef2f2] border border-[#fecaca] rounded-lg py-2">
              ACCESS DENIED: INVALID PIN
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#e8521a] hover:bg-[#c73f0a] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Unlock className="w-4 h-4" />
            UNLOCK PANEL
          </button>
        </form>
      </div>
    </div>
  );
};