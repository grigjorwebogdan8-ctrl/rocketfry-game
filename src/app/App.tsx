import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StarBackground } from './components/StarBackground';
import { RocketFlight } from './components/RocketFlight';
import { BetControls } from './components/BetControls';
import { BetsList, Bet } from './components/BetsList';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { AdminPanel } from './components/AdminPanel';
import { WalletModal } from './components/WalletModal';
import { HistoryModal, HistoryItem } from './components/HistoryModal';
import { vibrate } from './utils/vibrate';

declare global {
  interface Window {
    Telegram?: any;
  }
}

const ADMIN_ID = 8266216701; // Replace with your real Admin TG ID

// API Stubs - ready to be replaced with real backend endpoints
const api = {
  getBalance: async (userId: string | number) => {
    const saved = localStorage.getItem('rocketfry_balance');
    return { balance: saved !== null ? parseFloat(saved) : 0 };
  },
  getStats: async (userId: string | number) => {
    const saved = localStorage.getItem('rocketfry_stats');
    return saved ? JSON.parse(saved) : { games: 0, wins: 0, maxMultiplier: 0, totalBet: 0 };
  },
  getHistory: async (userId: string | number) => {
    const saved = localStorage.getItem('rocketfry_history');
    return saved ? JSON.parse(saved) : [];
  },
  placeBet: async (userId: string | number, amount: number, game: string, data?: any) => ({ success: true, betId: Date.now().toString() }),
  cashout: async (userId: string | number, betId: string) => ({ success: true, win: 0 }),
  topUpStars: async (userId: string | number, amount: number) => ({ success: true }),
  topUpTon: async (userId: string | number, amount: number) => ({ success: true }),
  withdraw: async (userId: string | number, amount: number, address: string) => ({ success: true }),
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('crash');
  
  // Game State - Crash
  const [crashGameState, setCrashGameState] = useState<'idle' | 'countdown' | 'in-progress' | 'crashed'>('idle');
  const [countdown, setCountdown] = useState(5.0);
  const [multiplier, setMultiplier] = useState(1.0);
  
  // App State
  const [onlineCount, setOnlineCount] = useState(0);

  // User State
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('rocketfry_balance');
    return saved !== null ? parseFloat(saved) : 0;
  });
  const [betAmount, setBetAmount] = useState(10);
  const [isBetting, setIsBetting] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState(0);

  // User Data State
  const [tgUser, setTgUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(() => {
    const saved = localStorage.getItem('rocketfry_stats');
    return saved ? JSON.parse(saved) : { games: 0, wins: 0, maxMultiplier: 0, totalBet: 0 };
  });
  const [userHistory, setUserHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('rocketfry_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('rocketfry_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('rocketfry_stats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('rocketfry_history', JSON.stringify(userHistory));
  }, [userHistory]);

  // Modals
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Bets State
  const [bets, setBets] = useState<Bet[]>([]);
  const [myBetId, setMyBetId] = useState<string | null>(null);

  // Initialize Telegram WebApp
  useEffect(() => {
    const initApp = () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        if (user) {
           setTgUser(user);
           
           // Fetch real data on start
           api.getBalance(user.id).then(res => setBalance(res.balance));
           api.getStats(user.id).then(res => setUserStats(res));
           api.getHistory(user.id).then(res => setUserHistory(res));
        }
      }
    };

    if (typeof window !== 'undefined' && !window.Telegram) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.async = true;
      script.onload = initApp;
      document.head.appendChild(script);
    } else {
      initApp();
    }
  }, []);

  // Back Button Logic
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    // Check if BackButton is available and supported safely (requires >= 6.1)
    const isSupported = tg?.version && parseFloat(tg.version) >= 6.1;

    if (tg?.BackButton && isSupported) {
      const handleBack = () => setActiveTab('crash');
      
      const updateBackButton = () => {
         try {
           if (activeTab !== 'crash') {
              if (tg.BackButton.isVisible === false || tg.BackButton.isVisible === undefined) {
                 tg.BackButton.show();
              }
              tg.BackButton.onClick(handleBack);
           } else {
              if (tg.BackButton.isVisible) {
                 tg.BackButton.hide();
              }
              tg.BackButton.offClick(handleBack);
           }
         } catch (e) {
           // Ignore
         }
      };
      
      updateBackButton();

      return () => {
         try {
           tg.BackButton.offClick(handleBack);
         } catch (e) {}
      };
    }
  }, [activeTab]);

  const isAdmin = tgUser?.id === ADMIN_ID;

  // -------------------------
  // MOCK WEBSOCKET EVENTS (Game Loop Simulation)
  // -------------------------
  const isRunningRef = React.useRef(false);
  const betsRef = React.useRef(bets);
  betsRef.current = bets;

  useEffect(() => {
    // Simulate online users independently
    const onlineInterval = setInterval(() => {
      setOnlineCount(Math.floor(100 + Math.random() * 50));
    }, 5000);
    return () => clearInterval(onlineInterval);
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;
    let isSubscribed = true;

    // A polling loop that watches for bets when idle
    const pollInterval = setInterval(() => {
      if (isRunningRef.current) return;
      
      // We read state from setter callbacks to avoid stale closures,
      // or we can just use refs.
      if (betsRef.current.length > 0) {
        isRunningRef.current = true;
        runGameCycle();
      }
    }, 500);

    const runGameCycle = () => {
      if (!isSubscribed) return;
      
      setCrashGameState('countdown');
      setMultiplier(1.0);
      
      let cd = 5.0;
      intervalId = setInterval(() => {
        cd -= 0.1;
        if (cd <= 0) {
          clearInterval(intervalId);
          startFlying();
        } else {
          setCountdown(cd);
        }
      }, 100);
    };

    const startFlying = () => {
      if (!isSubscribed) return;
      setCrashGameState('in-progress');
      let currentMult = 1.00;
      const crashPoint = 1.0 + Math.random() * 4.0; 

      intervalId = setInterval(() => {
        currentMult += 0.01 + (currentMult * 0.005);
        if (currentMult >= crashPoint) {
          clearInterval(intervalId);
          crash(currentMult);
        } else {
          setMultiplier(currentMult);
        }
      }, 50);
    };

    const crash = (finalMult: number) => {
      if (!isSubscribed) return;
      setCrashGameState('crashed');
      setMultiplier(finalMult);
      vibrate([200, 100, 200]);

      timeoutId = setTimeout(() => {
        if (!isSubscribed) return;
        setCrashGameState('idle');
        setMultiplier(1.0);
        setCountdown(5.0);
        setIsBetting(false);
        setHasCashedOut(false);
        setBets([]); 
        
        // Add a small delay before allowing next round to start
        setTimeout(() => {
          isRunningRef.current = false;
        }, 100);
      }, 3000);
    };

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      isRunningRef.current = false;
    };
  }, []);

  // Record bet loss if crashed and hasn't cashed out
  useEffect(() => {
    if (crashGameState === 'crashed' && isBetting && !hasCashedOut) {
      setUserStats((prev: any) => ({ ...prev, games: prev.games + 1, totalBet: prev.totalBet + betAmount }));
      setUserHistory((prev: HistoryItem[]) => [{
         type: 'bet',
         game: 'Crash',
         amount: betAmount,
         multiplier: 0,
         winAmount: 0,
         date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      }, ...prev]);
      setIsBetting(false);
    }
  }, [crashGameState, isBetting, hasCashedOut, betAmount]);

  // -------------------------
  // HANDLERS (API STUBS)
  // -------------------------
  const handlePlaceCrashBet = async () => {
    const userId = tgUser ? tgUser.id : 12345; // Fallback for web preview
    const username = tgUser ? (tgUser.username || tgUser.first_name) : 'Гость';

    if ((crashGameState === 'idle' || crashGameState === 'countdown') && balance >= betAmount && !isBetting) {
      const res = await api.placeBet(userId, betAmount, 'crash');
      if (res.success) {
         vibrate([30, 30]);
         setBalance(prev => prev - betAmount);
         setIsBetting(true);
         setHasCashedOut(false);
         setMyBetId(res.betId);
         
         setBets(prev => [{
            id: res.betId,
            username: username,
            amount: betAmount,
            status: 'playing'
         }, ...prev]);
      }
    }
  };

  const handleCashout = async () => {
    const userId = tgUser ? tgUser.id : 12345;
    
    if (crashGameState === 'in-progress' && isBetting && !hasCashedOut && myBetId) {
      const res = await api.cashout(userId, myBetId);
      if (res.success) {
         const win = betAmount * multiplier; 
         vibrate([50, 100, 50, 100]);
         setWinAmount(win);
         setBalance(prev => prev + win);
         setHasCashedOut(true);
         
         setBets(prev => prev.map(bet => 
            bet.id === myBetId 
            ? { ...bet, status: 'cashed_out', multiplier, winAmount: win }
            : bet
         ));
         
         // Update local stats mock
         setUserStats((prev: any) => ({ 
           ...prev, 
           wins: prev.wins + 1, 
           games: prev.games + 1, 
           totalBet: prev.totalBet + betAmount 
         }));
         setUserHistory((prev: HistoryItem[]) => [{
            type: 'bet',
            game: 'Crash',
            amount: betAmount,
            multiplier: multiplier,
            winAmount: win,
            date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
         }, ...prev]);
      }
    }
  };

  // -------------------------
  // TOP UP & WITHDRAW 
  // -------------------------
  const handleTopUpStars = async (amount: number) => {
     const userId = tgUser ? tgUser.id : 12345;
     const res = await api.topUpStars(userId, amount);
     if (res.success) {
        setBalance(prev => prev + amount);
     }
  };

  const handleTopUpTon = async (amount: number) => {
     const userId = tgUser ? tgUser.id : 12345;
     const res = await api.topUpTon(userId, amount);
     if (res.success) {
        // Assume backend will add balance via WS / polling after TON confirmation
     }
  };

  const handleWithdraw = async (amount: number, address: string) => {
     const userId = tgUser ? tgUser.id : 12345;
     const res = await api.withdraw(userId, amount, address);
     if (res.success) {
        setBalance(prev => prev - amount);
     }
  };

  const displayName = tgUser ? (tgUser.username || tgUser.first_name) : 'Гость';

  return (
    <div className="w-full h-[100dvh] bg-gradient-to-b from-[#0B0F19] via-[#111827] to-[#0A0F1D] flex flex-col font-sans overflow-hidden text-slate-100">
      <StarBackground speedMultiplier={crashGameState === 'in-progress' ? 3 : 0.5} />

          <WalletModal 
            isOpen={isWalletOpen} 
            onClose={() => setIsWalletOpen(false)} 
            balance={balance}
            onTopUpStars={handleTopUpStars} 
            onTopUpTon={handleTopUpTon} 
          />

          <HistoryModal 
            isOpen={isHistoryOpen} 
            onClose={() => setIsHistoryOpen(false)} 
            history={userHistory} 
          />

        <div className="relative flex-1 flex flex-col z-10 w-full max-w-md mx-auto h-full bg-transparent">
        
        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth flex flex-col pb-6 no-scrollbar">
          {activeTab !== 'profile' && (
            <Header balance={balance} onlineCount={onlineCount} tgUser={tgUser} onTopUp={() => setIsWalletOpen(true)} />
          )}

          {activeTab === 'crash' && (
            <div className="flex flex-col p-4 gap-4 pb-10 fade-in-up">
              {/* Rocket Area */}
              <div className="relative w-full rounded-2xl bg-slate-900/70 border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden shrink-0 h-72 group">
                <div className="absolute inset-0 rounded-2xl border border-blue-500/10 pointer-events-none group-hover:border-blue-500/30 transition-colors z-50" />
                
                <RocketFlight gameState={crashGameState} multiplier={multiplier} countdown={countdown} />
                
                {/* Previous Multipliers Bar (Listening to WS History) */}
                <div className="absolute bottom-3 w-full px-4 z-50 overflow-hidden">
                  <div className="flex gap-2 w-full max-w-full overflow-x-auto no-scrollbar scroll-smooth">
                    {/* Render recent multipliers from API/WS here */}
                  </div>
                </div>
              </div>

              {/* Bet Controls */}
              <BetControls 
                balance={balance}
                betAmount={betAmount}
                setBetAmount={setBetAmount}
                onBet={handlePlaceCrashBet}
                onCashout={handleCashout}
                isBetting={isBetting}
                gameState={crashGameState}
                hasCashedOut={hasCashedOut}
                currentWin={betAmount * multiplier}
              />

              {/* Bets List */}
              <div className="flex flex-col mt-2 gap-2">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest flex justify-between px-1">
                  <span>Ставки раунда</span>
                  <span className="text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">
                    ★ {bets.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
                  </span>
                </div>
                <BetsList bets={bets} currentMultiplier={multiplier} />
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="flex-1 flex flex-col p-4 animate-in fade-in duration-300">
              <h2 className="text-[20px] font-bold text-white text-center mb-6 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Профиль</h2>
              
              <div className="flex flex-col items-center mb-8">
                <div className="w-[88px] h-[88px] rounded-[32px] bg-[#1C2030] overflow-hidden mb-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#2A3043] transition-transform duration-300 hover:scale-105">
                   {tgUser?.photo_url ? (
                      <img src={tgUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                        {displayName.substring(0, 2).toUpperCase()}
                      </div>
                   )}
                </div>
                <h3 className="text-[24px] font-bold text-white mb-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{displayName}</h3>
                
                <div className="bg-[#0F1423] px-4 py-1.5 rounded-full border border-[#2A3043] flex items-center gap-2 mb-2 shadow-[0_0_10px_rgba(0,0,0,0.3)]">
                   <span className="text-slate-500 text-[12px] uppercase font-bold tracking-wider">ID</span>
                   <span className="text-slate-300 text-[14px] font-mono">{tgUser?.id || 'Гость'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setIsWalletOpen(true)}
                  className="flex items-center justify-between p-4 bg-[#1C2030] rounded-[16px] hover:bg-[#2A3043] transition-all duration-300 active:scale-[0.98] shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F1423] flex items-center justify-center text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                    </div>
                    <span className="text-white font-bold text-[16px]">Кошелек</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
                </button>

                <button 
                  onClick={() => setIsHistoryOpen(true)}
                  className="flex items-center justify-between p-4 bg-[#1C2030] rounded-[16px] hover:bg-[#2A3043] transition-all duration-300 active:scale-[0.98] shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F1423] flex items-center justify-center text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <span className="text-white font-bold text-[16px]">История ставок</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
                </button>

                <button className="flex items-center justify-between p-4 bg-[#1C2030] rounded-[16px] hover:bg-[#2A3043] transition-all duration-300 active:scale-[0.98] shadow-[0_0_10px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F1423] flex items-center justify-center text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    </div>
                    <span className="text-white font-bold text-[16px]">Язык</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[14px] font-medium">Русский</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </button>

                <button 
                  onClick={() => {
                     const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
                     if (tg && tg.openTelegramLink) {
                        tg.openTelegramLink('https://t.me/arina_neytor');
                     } else {
                        window.open('https://t.me/arina_neytor', '_blank');
                     }
                  }}
                  className="flex items-center justify-between p-4 bg-[#1C2030] rounded-[16px] hover:bg-[#2A3043] transition-all duration-300 active:scale-[0.98] mt-2 shadow-[0_0_15px_rgba(0,0,0,0.4)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F1423] flex items-center justify-center text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                    </div>
                    <span className="text-white font-bold text-[16px]">Поддержка</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <AdminPanel 
              api={api} 
              adminId={ADMIN_ID} 
              currentUser={tgUser} 
              currentBalance={balance} 
              currentStats={userStats} 
              onUpdateBalance={(userId, newBalance) => {
                if (tgUser && userId === tgUser.id) {
                  setBalance(newBalance);
                }
              }}
            />
          )}
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
