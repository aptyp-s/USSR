import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Wallet, Scale, ArrowLeftRight, Coins, ShieldAlert, Lock, Flame, Banknote } from 'lucide-react';

type TransactionType = 'requisition' | 'supply';
type SupplyType = 'base' | 'bonus';
type RequisitionType = 'expense' | 'debt_payment';

export const GosplanModal: React.FC = () => {
  const { state, dispatch } = useGame();
  
  const { monthlyIncome: income, monthlyWorkHours: hours } = state.settings;
  const { hasUnlockedReserves } = state;
  const hourlyRate = hours > 0 ? income / hours : 0;

  // Local State
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('requisition');
  
  // Sub-types
  const [supplyType, setSupplyType] = useState<SupplyType>('base');
  const [reqType, setReqType] = useState<RequisitionType>('expense');
  
  // Allocation Logic (0 to 100):
  // Req -> Expense: 0 = 100% Cash, 100 = 100% Reserves
  // Req -> Debt:    0 = 100% Principal (Good), 100 = 100% Interest (Burn)
  // Supply -> Bonus: 0 = 100% Reserves, 100 = 100% Debt Paydown
  const [allocation, setAllocation] = useState(0); 
  
  const [stamp, setStamp] = useState<'APPROVED' | 'DENIED' | 'LIQUIDATED' | 'ALLOCATED' | 'WASTED' | null>(null);
  const [showInterception, setShowInterception] = useState(false);

  // Reset logic when switching modes
  useEffect(() => {
    setAllocation(0);
  }, [type, supplyType, reqType]);

  const numAmount = parseFloat(amount) || 0;
  const requisitionHours = hourlyRate > 0 ? numAmount / hourlyRate : 0;

  // --- CALCULATION LOGIC ---
  let cashDelta = 0;
  let reservesDelta = 0;
  let debtDelta = 0;
  // Specific for Debt Repayment UI
  let interestBurn = 0;
  let principalPayment = 0;

  if (type === 'requisition') {
      if (reqType === 'expense') {
          // Standard Expense: Split between Cash and Reserves
          const fromReserves = Math.floor(numAmount * (allocation / 100));
          const fromCash = numAmount - fromReserves;
          
          cashDelta = -fromCash;
          reservesDelta = -fromReserves;
      } else {
          // Debt Repayment: Always from Cash, Split between Principal and Interest
          // Allocation 0% = All Principal, 100% = All Interest
          interestBurn = Math.floor(numAmount * (allocation / 100));
          principalPayment = numAmount - interestBurn;

          cashDelta = -numAmount; // Full amount leaves cash
          debtDelta = -principalPayment; // Only principal reduces debt
          // Interest simply vanishes (logic: paid to capitalist shark)
      }
  } else {
      // Supply Logic
      if (supplyType === 'base') {
          cashDelta = numAmount;
      } else {
          const toDebt = Math.floor(numAmount * (allocation / 100));
          const toReserves = numAmount - toDebt;
          
          reservesDelta = toReserves;
          debtDelta = -toDebt;
      }
  }

  // --- FORMATTING HELPERS ---
  const formatLifeCost = (h: number) => {
    if (h > 8) { 
        const days = Math.floor(h / 8);
        const remHours = (h % 8).toFixed(1);
        return `${days} DAYS ${remHours} WORK HOURS`;
    }
    return `${h.toFixed(1)} WORK HOURS`;
  };

  const handleTransaction = () => {
    if (isNaN(numAmount) || numAmount <= 0) return;

    // --- REQUISITION HANDLER ---
    if (type === 'requisition') {
        
        // 1. Interception Check (Only for Reserves usage)
        if (reservesDelta < 0 && !showInterception) {
            setShowInterception(true);
            return;
        }

        // 2. Insufficient Funds Check
        if (state.resources.cash + cashDelta < 0) { // cashDelta is negative
            setStamp('DENIED');
            setTimeout(() => setStamp(null), 2000);
            return;
        }
        if (state.resources.reserves + reservesDelta < 0) { // reservesDelta is negative
            setStamp('DENIED');
            setTimeout(() => setStamp(null), 2000);
            return;
        }

        // 3. Execution
        if (cashDelta !== 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'cash', amount: cashDelta } });
        if (reservesDelta !== 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'reserves', amount: reservesDelta } });
        if (debtDelta !== 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'debt', amount: debtDelta } });

        if (reqType === 'debt_payment' && interestBurn > 0) {
             setStamp('WASTED'); // Special stamp for paying interest
        } else {
             setStamp('APPROVED');
        }

    } else {
        // --- SUPPLY HANDLER ---
        if (cashDelta !== 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'cash', amount: cashDelta } });
        if (reservesDelta !== 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'reserves', amount: reservesDelta } });
        if (debtDelta !== 0) dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'debt', amount: debtDelta } });
        
        if (supplyType === 'bonus' && allocation === 100) setStamp('LIQUIDATED');
        else if (supplyType === 'bonus') setStamp('ALLOCATED');
        else setStamp('APPROVED');
    }

    if (showInterception) setShowInterception(false);
    setAmount('');
    setTimeout(() => setStamp(null), 2000);
  };

  const handleInterceptionChoice = (choice: 1 | 2 | 3) => {
      const transactionPayload = {
          cash: Math.abs(cashDelta),
          reserves: Math.abs(reservesDelta),
          debt: 0 
      };

      if (choice === 1) {
          handleTransaction();
          dispatch({ type: 'SET_RESERVE_UNLOCK', payload: false });
      } else if (choice === 2) {
          dispatch({ type: 'SET_PENDING_TRANSACTION', payload: transactionPayload });
          dispatch({ type: 'SET_KGB_STATUS', payload: 'warning_mild' });
          dispatch({ type: 'SELECT_BUILDING', payload: null });
          dispatch({ type: 'SET_RESERVE_UNLOCK', payload: true });
      } else if (choice === 3) {
           dispatch({ type: 'SET_PENDING_TRANSACTION', payload: transactionPayload });
           dispatch({ type: 'SET_KGB_STATUS', payload: 'warning_grave' });
           dispatch({ type: 'SELECT_BUILDING', payload: null });
      }
  };

  if (showInterception) {
      return (
          <div className="flex flex-col min-h-full gap-4 text-zinc-300 font-mono animate-in fade-in zoom-in duration-300 relative">
              <div className="absolute inset-0 bg-red-950/10 z-0 pointer-events-none"></div>
              
              <div className="bg-amber-950/30 border border-amber-700 p-4 flex items-center gap-4 shrink-0">
                  <ShieldAlert className="text-amber-500" size={32} />
                  <div>
                      <h3 className="font-bold text-amber-500 uppercase tracking-widest text-lg">Reserve Access Protocol</h3>
                      <p className="text-xs text-amber-200/70">Warning: You are attempting to withdraw from strategic reserves.</p>
                  </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-4">
                  <p className="text-base sm:text-lg">Does this expenditure align with the 5-Year Plan?</p>
                  
                  <div className="flex flex-col w-full gap-3 max-w-sm">
                      <button 
                        onClick={() => handleInterceptionChoice(2)}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold uppercase tracking-widest text-sm sm:text-lg transition-all border border-zinc-600 hover:border-zinc-400"
                      >
                          I need time to think
                      </button>
                      
                      <div className="flex gap-3">
                          <button 
                            onClick={() => handleInterceptionChoice(1)}
                            disabled={!hasUnlockedReserves}
                            className={`flex-1 py-2 font-bold uppercase tracking-wider text-[10px] sm:text-xs border transition-all flex items-center justify-center gap-2
                                ${hasUnlockedReserves 
                                    ? 'bg-emerald-900/20 text-emerald-500 border-emerald-800 hover:bg-emerald-900/40 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer' 
                                    : 'bg-zinc-800/50 text-zinc-600 border-zinc-700 cursor-not-allowed'
                                }
                            `}
                          >
                              {!hasUnlockedReserves && <Lock size={12} />} Yes, all clear
                          </button>
                          <button 
                             onClick={() => handleInterceptionChoice(3)}
                             className="flex-1 py-2 bg-transparent border border-red-900 text-red-500 hover:bg-red-950/50 hover:text-red-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs transition-all"
                          >
                              No, proceed anyway
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col min-h-full gap-6 text-zinc-300 font-mono relative">
      
      {/* Top Section: The Equation */}
      <div className="bg-black/40 border border-zinc-700 flex flex-col relative overflow-hidden group shrink-0">
        <div className="bg-zinc-900/80 border-b border-zinc-800 px-3 py-1 flex justify-between items-center">
            <span className="text-soviet-gold text-[10px] uppercase tracking-widest font-bold">Sector_Value_Calculator</span>
            <div className="flex gap-1 items-center">
                 <span className="text-[9px] text-zinc-600 mr-1">LOCKED BY KREMLIN</span>
                 <Lock size={10} className="text-zinc-600" />
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-end gap-4 p-4 relative">
          <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none"></div>

          <div>
              <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Monthly Disp. Income</label>
              <div className="flex items-center border-b border-zinc-700 pb-1">
                <span className="text-zinc-500 mr-2 font-sans">₽</span>
                <input 
                  type="number" 
                  value={income}
                  readOnly
                  className="bg-transparent w-full focus:outline-none font-mono font-bold text-xl text-soviet-gold opacity-80 cursor-not-allowed"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Monthly Work Hours</label>
              <div className="flex items-center border-b border-zinc-700 pb-1">
                <Calculator size={14} className="text-zinc-500 mr-2" />
                <input 
                  type="number" 
                  value={hours}
                  readOnly
                  className="bg-transparent w-full focus:outline-none font-mono font-bold text-xl text-soviet-gold opacity-80 cursor-not-allowed"
                />
              </div>
            </div>
          
          <div className="text-right bg-zinc-900/80 p-2 border border-zinc-800 min-w-[120px]">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Calculated Rate</div>
            <div className="text-xl font-bold text-white leading-none">
              {hourlyRate.toFixed(0)} <span className="text-[10px] text-zinc-500 font-normal align-top">RUB/HR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: The Ledger */}
      <div className="flex-1 bg-zinc-900/30 border border-zinc-700 p-6 flex flex-col items-center justify-start relative">
        
        {/* Main Tabs */}
        <div className="flex gap-4 mb-6 w-full max-w-md shrink-0">
          <button 
            onClick={() => setType('requisition')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest border transition-all ${
              type === 'requisition' 
                ? 'bg-zinc-800 border-soviet-red text-white shadow-[0_0_10px_rgba(208,0,0,0.2)]' 
                : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            Requisition
          </button>
          <button 
            onClick={() => setType('supply')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest border transition-all ${
              type === 'supply' 
                ? 'bg-zinc-800 border-soviet-red text-white shadow-[0_0_10px_rgba(208,0,0,0.2)]' 
                : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            Supply
          </button>
        </div>

        {/* --- SUB-TABS: REQUISITION --- */}
        {type === 'requisition' && (
             <div className="flex gap-2 mb-6 w-full max-w-sm justify-center animate-in fade-in slide-in-from-top-2 duration-300 shrink-0">
                 <button 
                    onClick={() => setReqType('expense')}
                    className={`px-4 py-2 text-[10px] sm:text-xs uppercase tracking-wider border rounded transition-all flex-1 ${
                        reqType === 'expense' ? 'bg-zinc-800 text-white border-zinc-500' : 'text-zinc-600 border-zinc-800 hover:border-zinc-600'
                    }`}
                 >
                     Standard Expense
                 </button>
                 <button 
                    onClick={() => setReqType('debt_payment')}
                    className={`px-4 py-2 text-[10px] sm:text-xs uppercase tracking-wider border rounded transition-all flex items-center justify-center gap-2 flex-1 ${
                        reqType === 'debt_payment' ? 'bg-red-950/40 text-red-200 border-red-900' : 'text-zinc-600 border-zinc-800 hover:border-red-900/50 hover:text-red-900'
                    }`}
                 >
                     <Scale size={12}/> Pay Debt (Cash)
                 </button>
             </div>
        )}

        {/* --- SUB-TABS: SUPPLY --- */}
        {type === 'supply' && (
             <div className="flex gap-2 mb-6 w-full max-w-xs justify-center animate-in fade-in slide-in-from-top-2 duration-300 shrink-0">
                 <button 
                    onClick={() => setSupplyType('base')}
                    className={`px-4 py-1 text-xs uppercase tracking-wider border rounded-full transition-all ${
                        supplyType === 'base' ? 'bg-zinc-800 text-white border-zinc-500' : 'text-zinc-600 border-zinc-800 hover:border-zinc-600'
                    }`}
                 >
                     Base (Cash)
                 </button>
                 <button 
                    onClick={() => setSupplyType('bonus')}
                    className={`px-4 py-1 text-xs uppercase tracking-wider border rounded-full transition-all flex items-center gap-1 ${
                        supplyType === 'bonus' ? 'bg-zinc-800 text-white border-zinc-500' : 'text-zinc-600 border-zinc-800 hover:border-zinc-600'
                    }`}
                 >
                     Bonus
                 </button>
             </div>
        )}

        {/* Input Area */}
        <div className="w-full max-w-md relative mb-2 shrink-0">
           <label className="block text-xs text-center mb-2 text-zinc-500 uppercase tracking-widest">
             {type === 'requisition' 
                ? (reqType === 'expense' ? 'Enter Expense Cost' : 'Enter Repayment Amount') 
                : `Enter ${supplyType} Amount`}
           </label>
           <div className="relative group">
              <input 
                type="number" 
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/50 border-2 border-zinc-700 text-center text-4xl py-4 font-bold text-white focus:outline-none focus:border-soviet-gold transition-all"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">RUB</span>
           </div>
        </div>

        {/* Real-time Feedback Display */}
        <div className="w-full flex flex-col items-center justify-center mb-4 min-h-[120px] shrink-0">
            {type === 'requisition' && reqType === 'expense' && numAmount > 0 && hourlyRate > 0 && (
                 <div className="text-center w-full animate-in fade-in zoom-in duration-200">
                    <div className="text-soviet-red font-bold text-3xl tracking-tighter drop-shadow-[0_0_8px_rgba(208,0,0,0.8)]">
                        COST: {formatLifeCost(requisitionHours)}
                    </div>
                 </div>
            )}
            
            {/* Unified Slider Control */}
            {((type === 'requisition') || (type === 'supply' && supplyType === 'bonus')) && (
               <div className="w-full max-w-md mx-auto mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-zinc-900/50 border border-zinc-700 p-4 rounded mb-2">
                        
                        <div className="flex justify-between text-xs font-bold uppercase mb-2">
                            {/* --- EXPENSE LABELS --- */}
                            {type === 'requisition' && reqType === 'expense' && (
                                <>
                                    <div className="text-emerald-400 flex items-center gap-1">
                                        <Wallet size={12}/> Cash: {Math.abs(cashDelta).toLocaleString()}
                                    </div>
                                    <div className="text-amber-500 flex items-center gap-1">
                                        Reserves: {Math.abs(reservesDelta).toLocaleString()} <Coins size={12}/>
                                    </div>
                                </>
                            )}

                            {/* --- DEBT REPAYMENT LABELS --- */}
                            {type === 'requisition' && reqType === 'debt_payment' && (
                                <>
                                    <div className="text-red-400 flex items-center gap-1">
                                        <Scale size={12}/> Principal: {principalPayment.toLocaleString()}
                                    </div>
                                    <div className="text-orange-600 flex items-center gap-1">
                                        Interest: {interestBurn.toLocaleString()} <Flame size={12}/>
                                    </div>
                                </>
                            )}

                            {/* --- BONUS SUPPLY LABELS --- */}
                            {type === 'supply' && supplyType === 'bonus' && (
                                <>
                                    <div className="text-amber-500 flex items-center gap-1">
                                        <Coins size={12}/> To Reserves: {Math.abs(reservesDelta).toLocaleString()}
                                    </div>
                                    <div className="text-red-500 flex items-center gap-1">
                                        To Debt: {Math.abs(debtDelta).toLocaleString()} <Scale size={12}/>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="1"
                            value={allocation}
                            onChange={(e) => setAllocation(Number(e.target.value))}
                            className={`w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer hover:opacity-80 transition-all 
                                ${reqType === 'debt_payment' ? 'accent-orange-500' : (type === 'requisition' ? 'accent-emerald-500' : 'accent-amber-500')}`}
                        />
                        
                        <div className="flex justify-between text-[9px] text-zinc-500 mt-1 uppercase">
                            {type === 'requisition' && reqType === 'expense' && (
                                <><span>Cash</span><span><ArrowLeftRight size={10} /></span><span>Reserves</span></>
                            )}
                            {type === 'requisition' && reqType === 'debt_payment' && (
                                <><span>Principal (Reduce Debt)</span><span><ArrowLeftRight size={10} /></span><span>Interest (Burn)</span></>
                            )}
                            {type === 'supply' && supplyType === 'bonus' && (
                                <><span>Reserves</span><span><ArrowLeftRight size={10} /></span><span>Debt</span></>
                            )}
                        </div>
                    </div>
               </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md mt-auto">
             <button 
                onClick={handleTransaction}
                className="w-full py-4 bg-soviet-red hover:bg-red-700 text-white font-bold uppercase tracking-widest text-lg transition-all border border-transparent hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={!numAmount}
             >
                {type === 'requisition' && reqType === 'expense' && "Authorize Requisition"}
                {type === 'requisition' && reqType === 'debt_payment' && <><Banknote size={20}/> Pay Capitalists</>}
                {type === 'supply' && supplyType === 'base' && "Log Standard Income"}
                {type === 'supply' && supplyType === 'bonus' && <><Scale size={20} />CONFIRM MY CHOICES</>}
             </button>
        </div>

        {/* Animated Stamp */}
        <AnimatePresence>
            {stamp && (
                <motion.div 
                    initial={{ scale: 2, opacity: 0, rotate: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-hard-light`}
                >
                    <div className={`
                        border-4 border-double p-4 text-4xl font-black uppercase tracking-widest -rotate-12 mask-image-grunge whitespace-nowrap
                        ${stamp === 'APPROVED' ? 'text-green-500 border-green-500' : ''}
                        ${stamp === 'DENIED' ? 'text-soviet-red border-soviet-red' : ''}
                        ${stamp === 'LIQUIDATED' ? 'text-amber-500 border-amber-500' : ''}
                        ${stamp === 'ALLOCATED' ? 'text-blue-400 border-blue-400' : ''}
                        ${stamp === 'WASTED' ? 'text-orange-500 border-orange-500' : ''}
                    `}>
                        {stamp}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};