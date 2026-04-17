import React, { useState } from 'react';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { vibrate } from '../utils/vibrate';

interface RouletteProps {
  balance: number;
  onBet: (amount: number, type: string, value: string | number) => void;
  gameState: 'idle' | 'spinning' | 'finished';
  result?: number;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export function Roulette({ balance, onBet, gameState, result }: RouletteProps) {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBetType, setSelectedBetType] = useState<string | null>(null);
  const [selectedBetValue, setSelectedBetValue] = useState<string | number | null>(null);

  const handleBetClick = (type: string, value: string | number) => {
    vibrate(10);
    setSelectedBetType(type);
    setSelectedBetValue(value);
  };

  const placeBetLocal = () => {
    if (selectedBetType && selectedBetValue && balance >= betAmount && gameState === 'idle') {
      vibrate(20);
      onBet(betAmount, selectedBetType, selectedBetValue);
    }
  };

  const isSelected = (type: string, val: string | number) => 
    selectedBetType === type && selectedBetValue === val;

  return (
    <div className="flex-1 flex flex-col p-4 gap-6 text-slate-100 overflow-y-auto w-full pb-10">
      
      {/* Wheel Simulation */}
      <div className="relative w-48 h-48 mx-auto mt-4 rounded-full border-[12px] border-slate-900 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center bg-slate-800">
        <motion.div
          animate={
            gameState === 'spinning' 
              ? { rotate: 360 * 5 } 
              : gameState === 'finished' 
              ? { rotate: result ? result * 10 : 0 }
              : { rotate: 0 }
          }
          transition={{ 
            duration: gameState === 'spinning' ? 5 : 0.5, 
            ease: "circOut",
            repeat: gameState === 'spinning' ? Infinity : 0
          }}
          className="w-full h-full rounded-full border-4 border-slate-700 absolute"
          style={{
            background: 'conic-gradient(from 0deg, #1e293b 0%, #0f172a 100%)'
          }}
        >
          {/* Faux Wheel Lines */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxjaXJjbGUgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNDglIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==')] bg-center bg-contain opacity-20" />
        </motion.div>
        
        {/* Result Overlay */}
        {gameState === 'finished' && result !== undefined && (
          <div className="absolute z-10 w-16 h-16 rounded-full bg-slate-900 shadow-xl border-2 border-slate-700 flex items-center justify-center text-2xl font-black shadow-[0_0_15px_rgba(255,255,255,0.2)]">
             <span className={result === 0 ? 'text-green-500' : RED_NUMBERS.includes(result) ? 'text-red-500' : 'text-slate-200'}>
               {result}
             </span>
          </div>
        )}

        {/* Center Pin */}
        <div className="absolute z-20 w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)] border border-yellow-300" />
      </div>

      {/* Bet Options */}
      <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
         <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
               variant="outline"
               onClick={() => handleBetClick('color', 'red')}
               className={`h-12 border-slate-700 text-red-500 font-bold hover:bg-red-900/20 hover:text-red-400 transition-all shadow-md ${isSelected('color', 'red') ? 'bg-red-900/40 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-slate-800'}`}
            >
               КРАСНОЕ
            </Button>
            <Button
               variant="outline"
               onClick={() => handleBetClick('color', 'black')}
               className={`h-12 border-slate-700 text-slate-300 font-bold hover:bg-slate-700/50 transition-all shadow-md ${isSelected('color', 'black') ? 'bg-slate-700 border-slate-400/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-slate-800'}`}
            >
               ЧЕРНОЕ
            </Button>
         </div>
         <div className="grid grid-cols-2 gap-2">
            <Button
               variant="outline"
               onClick={() => handleBetClick('parity', 'even')}
               className={`h-12 border-slate-700 text-blue-400 font-bold hover:bg-blue-900/20 transition-all shadow-md ${isSelected('parity', 'even') ? 'bg-blue-900/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-800'}`}
            >
               ЧЕТ
            </Button>
            <Button
               variant="outline"
               onClick={() => handleBetClick('parity', 'odd')}
               className={`h-12 border-slate-700 text-blue-400 font-bold hover:bg-blue-900/20 transition-all shadow-md ${isSelected('parity', 'odd') ? 'bg-blue-900/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-800'}`}
            >
               НЕЧЕТ
            </Button>
         </div>
      </div>

      {/* Bet Controls */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.6)] flex flex-col gap-4 relative">
         <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
            <input 
               type="number" 
               value={betAmount} 
               onChange={(e) => setBetAmount(Number(e.target.value) || 0)}
               className="bg-slate-800/80 border border-slate-700 rounded-md text-white text-lg font-bold text-center h-12 shadow-inner focus:outline-none focus:border-blue-500 w-full"
            />
            <Button 
               variant="outline" 
               onClick={() => { vibrate(10); setBetAmount(betAmount + 10); }}
               className="h-12 w-14 bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 transition-all shadow-md"
            >
               +10
            </Button>
            <Button 
               variant="outline" 
               onClick={() => { vibrate(20); setBetAmount(balance); }}
               className="h-12 px-3 bg-slate-800/80 border-yellow-700/50 text-yellow-500 font-bold hover:bg-yellow-900/30 transition-all"
            >
               MAX
            </Button>
         </div>

         <div className="relative">
            {gameState === 'idle' && (
               <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute -top-3 -right-3 z-20 text-xl pointer-events-none drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
               >
                  ⭐
               </motion.div>
            )}
            <Button 
               onClick={placeBetLocal}
               disabled={gameState !== 'idle' || !selectedBetType}
               className={`w-full h-14 text-xl font-black tracking-wide transition-all border shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] active:scale-95 ${
                  gameState !== 'idle' 
                     ? 'bg-slate-800 text-slate-400 border-slate-700' 
                     : 'bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white border-blue-400/30'
               }`}
            >
               {gameState === 'spinning' ? 'ВРАЩЕНИЕ...' : gameState === 'finished' ? 'РАУНД ОКОНЧЕН' : 'СДЕЛАТЬ СТАВКУ'}
            </Button>
         </div>
      </div>
    </div>
  );
}
