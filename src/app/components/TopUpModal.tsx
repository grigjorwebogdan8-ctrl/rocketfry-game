import React, { useState } from 'react';
import { Button } from './ui/button';
import { X, Star, Wallet } from 'lucide-react';
import { vibrate } from '../utils/vibrate';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopUpStars: (amount: number) => void;
  onTopUpTon: (amount: number) => void;
}

export function TopUpModal({ isOpen, onClose, onTopUpStars, onTopUpTon }: TopUpModalProps) {
  const [amount, setAmount] = useState(100);
  const [showTon, setShowTon] = useState(false);

  if (!isOpen) return null;

  const handleStars = () => {
    // Attempt Telegram WebApp payment invoice
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    if (tg && tg.openInvoice) {
       tg.openInvoice({ slug: 'stars-product-id' }, (status: string) => {
          if (status === 'paid') {
             vibrate(20);
             onTopUpStars(amount);
             onClose();
          }
       });
    } else {
       // Mock for local testing outside TG
       vibrate(20);
       onTopUpStars(amount);
       onClose();
    }
  };

  const handleTon = () => {
    vibrate(20);
    onTopUpTon(amount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
           <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Пополнение</h2>
        
        {!showTon ? (
          <div className="flex flex-col gap-4">
            <div>
               <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider font-semibold">Сумма</label>
               <input 
                 type="number" 
                 value={amount} 
                 onChange={e => setAmount(Number(e.target.value))} 
                 className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-center text-2xl font-bold shadow-inner focus:outline-none focus:border-blue-500 transition-colors" 
               />
            </div>
            
            <Button onClick={handleStars} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 h-14 rounded-xl text-lg font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Star className="text-yellow-400 fill-yellow-400" /> Пополнить через Stars
            </Button>
            
            <div className="relative py-2 flex items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="shrink-0 px-4 text-xs text-slate-500 font-medium">ИЛИ</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <Button onClick={() => setShowTon(true)} variant="outline" className="h-14 rounded-xl border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700 flex items-center gap-2">
              <Wallet className="text-blue-400" /> Пополнить через TON
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 items-center animate-in slide-in-from-right-4">
            <p className="text-slate-300 text-center font-medium">Переведите <span className="text-white font-bold">{amount} TON</span> на адрес:</p>
            
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <div className="w-40 h-40 border-4 border-black flex items-center justify-center text-black font-bold relative overflow-hidden bg-slate-100">
                <span className="z-10">QR Code</span>
                {/* Fake QR pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMiLz48L3N2Zz4=')] opacity-20"></div>
              </div>
            </div>
            
            <div className="w-full">
              <p className="text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wider text-center">TON Адрес</p>
              <p className="text-xs text-blue-400 font-mono break-all bg-slate-800/80 border border-slate-700 p-3 rounded-lg w-full text-center select-all">
                UQBc_x39...TON_ADDRESS...789XYZ
              </p>
            </div>

            <Button onClick={handleTon} className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 h-14 rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] mt-2">
              Я перевел
            </Button>
            
            <button onClick={() => setShowTon(false)} className="text-sm text-slate-400 hover:text-white transition-colors">
              Вернуться назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
