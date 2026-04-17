import React, { useState } from 'react';
import { Button } from './ui/button';
import { X, CheckCircle2 } from 'lucide-react';
import { vibrate } from '../utils/vibrate';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (amount: number, address: string) => void;
  balance: number;
}

export function WithdrawModal({ isOpen, onClose, onWithdraw, balance }: WithdrawModalProps) {
  const [amount, setAmount] = useState<number | string>('');
  const [address, setAddress] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const numAmount = Number(amount);
    if (!address || numAmount <= 0 || numAmount > balance) return;
    
    vibrate(15);
    onWithdraw(numAmount, address);
    setSuccess(true);
    
    setTimeout(() => {
      setSuccess(false);
      onClose();
      setAmount('');
      setAddress('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
        
        {success ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8 animate-in slide-in-from-bottom-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} className="text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Заявка отправлена</h2>
            <p className="text-slate-400 text-center">Средства поступят на ваш кошелек в течение 5 минут.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">Вывод средств</h2>
            
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Сумма (TON)</label>
                  <span className="text-xs text-slate-500 font-bold">Доступно: {balance.toFixed(2)}</span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(Number(e.target.value))} 
                    max={balance}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-xl font-bold shadow-inner focus:outline-none focus:border-blue-500 transition-colors" 
                  />
                  <button 
                    onClick={() => { setAmount(balance); vibrate(10); }}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-slate-700/50 hover:bg-slate-700 text-yellow-500 text-xs font-bold rounded-lg transition-colors border border-slate-600/50"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider font-semibold">Адрес кошелька TON</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  placeholder="Например: UQ..." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors" 
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={!address || Number(amount) <= 0 || Number(amount) > balance} 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 h-14 font-bold mt-2 text-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] rounded-xl"
              >
                Отправить заявку
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
