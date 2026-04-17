import React, { useState } from 'react';
import { Button } from './ui/button';
import { Users, Ban, DollarSign } from 'lucide-react';

interface AdminPanelProps {
  api: any;
  adminId: number;
  currentUser?: any;
  currentBalance?: number;
  currentStats?: any;
  onUpdateBalance?: (userId: number, newBalance: number) => void;
}

export function AdminPanel({ api, adminId, currentUser, currentBalance, currentStats, onUpdateBalance }: AdminPanelProps) {
  const [users, setUsers] = useState(() => {
    // Начальные моковые данные
    const initialUsers = [
      { id: 101, username: 'PlayerX', balance: 500.5, games: 42, blocked: false },
      { id: 102, username: 'CryptoKing', balance: 12500, games: 156, blocked: false },
      { id: 103, username: 'Newbie', balance: 10, games: 3, blocked: true },
    ];
    
    // Если мы зашли в приложение, добавляем себя в список админки для наглядности (ведь мы тоже игрок)
    if (currentUser && currentUser.id) {
      const isAlreadyIn = initialUsers.find(u => u.id === currentUser.id);
      if (!isAlreadyIn) {
        initialUsers.unshift({
          id: currentUser.id,
          username: currentUser.username || currentUser.first_name || 'Игрок',
          balance: currentBalance || 0,
          games: currentStats?.games || 0,
          blocked: false
        });
      }
    }
    
    return initialUsers;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [amountFilter, setAmountFilter] = useState('');

  const filteredUsers = users.filter(u => {
    if (amountFilter && u.balance < Number(amountFilter)) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      if (!u.username.toLowerCase().includes(search) && !u.id.toString().includes(search)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto pb-20 w-full fade-in-up">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
          <Users size={24} className="text-yellow-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide">Админ Панель</h2>
          <span className="text-xs font-mono text-slate-500">ID: {adminId}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col gap-3">
        <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Фильтры пользователей</h3>
        <div className="flex flex-col gap-2">
          <input 
            type="text" 
            placeholder="Поиск по ID или Нику..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm w-full text-white focus:outline-none focus:border-blue-500 transition-colors" 
          />
          <input 
            type="number" 
            placeholder="Минимальный баланс" 
            value={amountFilter} 
            onChange={e => setAmountFilter(e.target.value)} 
            className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm w-full text-white focus:outline-none focus:border-blue-500 transition-colors" 
          />
        </div>
      </div>
      
      {/* Users List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mt-2">Список ({filteredUsers.length})</h3>
        
        {filteredUsers.map(u => (
          <div key={u.id} className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col gap-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-bold text-white text-lg flex items-center gap-2">
                  {u.username}
                  {u.blocked && <span className="px-2 py-0.5 rounded text-[10px] bg-red-900/50 text-red-500 uppercase">Заблокирован</span>}
                </span>
                <span className="text-xs font-mono text-slate-500 mt-1">ID: {u.id}</span>
                <span className="text-sm text-slate-400 mt-2">Игр сыграно: <strong className="text-white">{u.games}</strong></span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-xs text-slate-500 uppercase font-bold">Баланс</span>
                <span className="text-yellow-400 font-bold text-xl drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">{u.balance}</span>
              </div>
            </div>
            
            <div className="flex gap-2 border-t border-slate-800/50 pt-4 mt-1">
              <Button 
                variant="outline" 
                onClick={() => {
                  const newBalance = window.prompt(`Введите новый баланс для ${u.username}:`, u.balance.toString());
                  if (newBalance !== null && !isNaN(Number(newBalance))) {
                    const parsedBalance = Number(newBalance);
                    setUsers(prev => prev.map(user => 
                      user.id === u.id ? { ...user, balance: parsedBalance } : user
                    ));
                    if (onUpdateBalance) {
                      onUpdateBalance(u.id, parsedBalance);
                    }
                  }
                }}
                className="flex-1 border-blue-500/30 text-blue-400 bg-blue-900/10 hover:bg-blue-900/30 hover:border-blue-500 transition-colors h-10 text-xs font-bold"
              >
                <DollarSign size={14} className="mr-1" /> Баланс
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setUsers(prev => prev.map(user => 
                    user.id === u.id ? { ...user, blocked: !user.blocked } : user
                  ));
                }}
                className={`flex-1 transition-colors h-10 text-xs font-bold ${
                  u.blocked 
                    ? "border-green-500/30 text-green-400 bg-green-900/10 hover:bg-green-900/30 hover:border-green-500" 
                    : "border-red-500/30 text-red-400 bg-red-900/10 hover:bg-red-900/30 hover:border-red-500"
                }`}
              >
                <Ban size={14} className="mr-1" /> {u.blocked ? 'Разблок' : 'Блок'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
