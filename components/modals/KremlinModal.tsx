import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Scroll, ArrowRight, Coins, Wallet, Landmark, CheckCircle2, Scale, Calculator, AlertTriangle, Briefcase, Clock, Save } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type DecreeType = 'balance_transfer' | 'attack_debt' | 'labor_standards';

export const KremlinModal: React.FC = () => {
  const { state, dispatch } = useGame();
  const [activeDecree, setActiveDecree] = useState<DecreeType>('balance_transfer');
  
  // Determine available resources based on mode (Only for Transfer/Debt)
  const maxAmount = activeDecree === 'balance_transfer' ? state.resources.cash : state.resources.reserves;
  
  // Initialize with 10% or 0 if empty
  const [transferAmount, setTransferAmount] = useState(() => Math.floor(maxAmount * 0.1));
  const [inputValue, setInputValue] = useState(() => String(Math.floor(maxAmount * 0.1)));
  
  // State for Labor Standards
  const [newIncome, setNewIncome] = useState(state.settings.monthlyIncome);
  const [newHours, setNewHours] = useState(state.settings.monthlyWorkHours);

  const [isExecuted, setIsExecuted] = useState(false);

  // Reset/Recalculate when switching modes
  useEffect(() => {
    if (activeDecree === 'balance_transfer' || activeDecree === 'attack_debt') {
        const initialAmt = Math.floor(maxAmount * 0.1);
        setTransferAmount(initialAmt);
        setInputValue(String(initialAmt));
    }
    // Sync Labor inputs when tab active
    if (activeDecree === 'labor_standards') {
        setNewIncome(state.settings.monthlyIncome);
        setNewHours(state.settings.monthlyWorkHours);
    }
  }, [activeDecree, maxAmount, state.settings]);

  // Derive percentage for slider
  const percentage = maxAmount > 0 ? Math.round((transferAmount / maxAmount) * 100) : 0;
  
  // Calculate remaining balance for Source
  const remainingSource = maxAmount - transferAmount;

  // Metrics for Attack Debt
  // Using default rate of 312.5 RUB/HR (50000 / 160) as a baseline estimation for "Life Hours"
  const ESTIMATED_HOURLY_RATE = 312.5;
  const lifeHoursSaved = transferAmount / ESTIMATED_HOURLY_RATE;
  const sovereigntyRegained = state.resources.debt > 0 
    ? (transferAmount / state.resources.debt) * 100 
    : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newPct = parseInt(e.target.value, 10);
      const newAmount = Math.floor(maxAmount * (newPct / 100));
      setTransferAmount(newAmount);
      setInputValue(String(newAmount));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      
      if (val === '') {
          setTransferAmount(0);
          return;
      }

      const numVal = parseInt(val, 10);
      if (!isNaN(numVal)) {
          // Clamp
          const clamped = Math.min(maxAmount, Math.max(0, numVal));
          setTransferAmount(clamped);
      }
  };

  const handleInputBlur = () => {
      // Sync UI on blur to ensure valid number is shown
      setInputValue(String(transferAmount));
  };

  const handleExecute = () => {
    if (activeDecree === 'labor_standards') {
        dispatch({ 
            type: 'UPDATE_SETTINGS', 
            payload: { monthlyIncome: newIncome, monthlyWorkHours: newHours } 
        });
    } else {
        if (transferAmount <= 0) return;

        if (activeDecree === 'balance_transfer') {
            // Deduct Cash, Add Reserves
            dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'cash', amount: -transferAmount } });
            dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'reserves', amount: transferAmount } });
        } else if (activeDecree === 'attack_debt') {
            // Deduct Reserves, Reduce Debt
            dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'reserves', amount: -transferAmount } });
            dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'debt', amount: -transferAmount } });
        }
    }

    setIsExecuted(true);
    
    // Reset success state
    setTimeout(() => {
        setIsExecuted(false);
        if (activeDecree !== 'labor_standards') {
            setTransferAmount(0);
            setInputValue("0");
        }
    }, 2000);
  };

  // Icon/Color Helpers based on mode
  const getSourceIcon = () => activeDecree === 'balance_transfer' ? Wallet : Coins;
  const getSourceColor = () => activeDecree === 'balance_transfer' ? 'text-emerald-500' : 'text-amber-500';
  const getSourceBg = () => activeDecree === 'balance_transfer' ? 'bg-emerald-950/30 border-emerald-900' : 'bg-amber-950/30 border-amber-900';
  
  const getTargetIcon = () => activeDecree === 'balance_transfer' ? Coins : Scale;
  const getTargetColor = () => activeDecree === 'balance_transfer' ? 'text-amber-500' : 'text-red-500';
  const getTargetBg = () => activeDecree === 'balance_transfer' ? 'bg-amber-950/30 border-amber-900' : 'bg-red-950/30 border-red-900';

  const SourceIcon = getSourceIcon();
  const TargetIcon = getTargetIcon();

  const getButtonText = () => {
      if (activeDecree === 'attack_debt') return "BREAK THE CHAINS";
      if (activeDecree === 'labor_standards') return "RATIFY NEW STANDARDS";
      return "ISSUE DECREE";
  }

  const getSuccessText = () => {
      if (activeDecree === 'labor_standards') return "STANDARDS UPDATED";
      if (activeDecree === 'attack_debt') return "CHAIN BROKEN";
      return "DECREE AUTHORIZED";
  }

  return (
    <div className="flex flex-col h-full font-mono text-zinc-300 relative">
      
      {/* Decree Selector Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-soviet-gold">
            <Scroll size={20} />
            <span className="uppercase tracking-widest font-bold text-sm">Select Decree Protocol</span>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setActiveDecree('balance_transfer')}
                className={`flex-1 py-3 text-[10px] sm:text-xs uppercase tracking-wider border transition-all ${
                    activeDecree === 'balance_transfer' 
                    ? 'bg-soviet-red text-white border-red-500 shadow-[0_0_10px_rgba(208,0,0,0.3)] font-bold' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Balance Transfer
            </button>
            <button 
                onClick={() => setActiveDecree('attack_debt')}
                className={`flex-1 py-3 text-[10px] sm:text-xs uppercase tracking-wider border transition-all ${
                    activeDecree === 'attack_debt' 
                    ? 'bg-soviet-red text-white border-red-500 shadow-[0_0_10px_rgba(208,0,0,0.3)] font-bold' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Attack Debt
            </button>
            <button 
                onClick={() => setActiveDecree('labor_standards')}
                className={`flex-1 py-3 text-[10px] sm:text-xs uppercase tracking-wider border transition-all ${
                    activeDecree === 'labor_standards' 
                    ? 'bg-soviet-red text-white border-red-500 shadow-[0_0_10px_rgba(208,0,0,0.3)] font-bold' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                }`}
            >
                Labor Standards
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-2 relative">
         <div className="bg-zinc-900/30 border border-zinc-700/50 p-6 rounded-lg h-full flex flex-col">
            
            {/* Context Header */}
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-zinc-800 rounded border border-zinc-600">
                    <Landmark size={32} className="text-zinc-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                        {activeDecree === 'balance_transfer' && 'State Treasury Realignment'}
                        {activeDecree === 'attack_debt' && 'Sovereignty Restoration'}
                        {activeDecree === 'labor_standards' && 'Labor Value Calibration'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        {activeDecree === 'balance_transfer' && (
                            <>
                                Authorize the immediate transfer of liquid assets (Cash) into the strategic national reserves.
                                <br/>
                                <span className="text-red-400">WARNING: This process is irreversible. Reserves cannot be converted back to Cash.</span>
                            </>
                        )}
                        {activeDecree === 'attack_debt' && (
                            <>
                                Utilize strategic reserves to aggressively pay down national debt and reclaim sovereignty.
                                <br/>
                                <span className="text-amber-400">NOTE: Debt repayment reduces the grip of foreign capital.</span>
                            </>
                        )}
                        {activeDecree === 'labor_standards' && (
                            <>
                                Redefine the fundamental constants of the Five-Year Plan.
                                <br/>
                                <span className="text-zinc-400">Updates will reflect across all GOSPLAN calculations immediately.</span>
                            </>
                        )}
                    </p>
                </div>
            </div>

            <div className="border-t border-zinc-800 my-4"></div>

            {/* Dynamic Body Content */}
            <div className="flex-1 flex flex-col justify-center gap-8">
                
                {activeDecree === 'labor_standards' ? (
                     <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         {/* Income Input */}
                         <div className="bg-black/20 border border-zinc-700 p-4 rounded group hover:border-soviet-gold transition-colors">
                             <div className="flex items-center gap-2 mb-2">
                                 <Briefcase size={16} className="text-emerald-500" />
                                 <label className="text-xs uppercase tracking-widest text-zinc-500">Monthly Disposable Income</label>
                             </div>
                             <div className="flex items-center border-b-2 border-zinc-700 group-hover:border-soviet-gold pb-2">
                                 <span className="text-zinc-500 text-2xl font-sans mr-2">₽</span>
                                 <input 
                                    type="number"
                                    value={newIncome}
                                    onChange={(e) => setNewIncome(parseInt(e.target.value) || 0)}
                                    className="bg-transparent w-full text-3xl font-bold font-mono text-white focus:outline-none"
                                 />
                             </div>
                         </div>

                         {/* Hours Input */}
                         <div className="bg-black/20 border border-zinc-700 p-4 rounded group hover:border-soviet-gold transition-colors">
                             <div className="flex items-center gap-2 mb-2">
                                 <Clock size={16} className="text-amber-500" />
                                 <label className="text-xs uppercase tracking-widest text-zinc-500">Monthly Work Hours</label>
                             </div>
                             <div className="flex items-center border-b-2 border-zinc-700 group-hover:border-soviet-gold pb-2">
                                 <Calculator size={24} className="text-zinc-500 mr-2" />
                                 <input 
                                    type="number"
                                    value={newHours}
                                    onChange={(e) => setNewHours(parseInt(e.target.value) || 0)}
                                    className="bg-transparent w-full text-3xl font-bold font-mono text-white focus:outline-none"
                                 />
                             </div>
                         </div>
                         
                         {/* Calculated Rate Preview */}
                         <div className="text-right">
                             <div className="text-[10px] text-zinc-500 uppercase tracking-widest">New Effective Rate</div>
                             <div className="text-xl font-bold text-soviet-gold">
                                 {(newHours > 0 ? newIncome / newHours : 0).toFixed(2)} RUB/HR
                             </div>
                         </div>
                     </div>
                ) : (
                    /* Slider Section for Financial Transfers */
                    <>
                        <div className="flex items-center justify-between px-4">
                            <div className="flex flex-col items-center gap-2">
                                <div className="text-xs uppercase text-zinc-500 tracking-widest">Source</div>
                                <div className={`p-4 rounded-full border ${getSourceBg()}`}>
                                    <SourceIcon className={getSourceColor()} size={32} />
                                </div>
                                <div className={`font-bold ${getSourceColor()}`}>{remainingSource.toLocaleString()}</div>
                            </div>

                            <div className="flex-1 flex flex-col items-center px-2 relative z-0">
                                <div className="w-full h-0.5 bg-zinc-700 absolute top-1/2 -translate-y-1/2 -z-10"></div>
                                <div className="bg-soviet-metal px-2 z-10 flex flex-col items-center">
                                    <ArrowRight className="text-zinc-500 animate-pulse" size={24} />
                                    <div className="text-xs font-bold text-soviet-gold mt-1 mb-1">{percentage}% Allocation</div>
                                </div>

                                {/* Manual Input */}
                                <div className="z-10 mt-2">
                                    <input 
                                        type="text"
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        onBlur={handleInputBlur}
                                        className="w-28 bg-zinc-900 border border-zinc-600 text-center text-lg font-bold text-white py-1 rounded focus:border-soviet-gold focus:outline-none placeholder-zinc-700"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <div className="text-xs uppercase text-zinc-500 tracking-widest">Target</div>
                                <div className={`p-4 rounded-full border ${getTargetBg()}`}>
                                    <TargetIcon className={getTargetColor()} size={32} />
                                </div>
                                <div className={`font-bold ${getTargetColor()}`}>
                                    <span className="text-xs text-zinc-500">{activeDecree === 'attack_debt' ? '-' : '+'}</span>
                                    {transferAmount.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Metrics for Attack Debt */}
                        {activeDecree === 'attack_debt' && transferAmount > 0 && (
                            <div className="flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex-1 bg-red-950/20 border border-red-900/30 p-2 rounded text-center">
                                    <div className="text-xl font-bold text-zinc-200">{lifeHoursSaved.toFixed(1)}</div>
                                    <div className="text-[9px] text-zinc-500 uppercase flex items-center justify-center gap-1">
                                        <Calculator size={10} /> Life Hours Saved
                                    </div>
                                </div>
                                <div className="flex-1 bg-red-950/20 border border-red-900/30 p-2 rounded text-center">
                                    <div className="text-xl font-bold text-red-500">+{sovereigntyRegained.toFixed(2)}%</div>
                                    <div className="text-[9px] text-red-500/70 uppercase flex items-center justify-center gap-1">
                                        <AlertTriangle size={10} /> Sovereignty
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="bg-black/40 p-4 border border-zinc-800 rounded">
                            <div className="flex justify-between text-xs mb-2 uppercase tracking-widest text-zinc-500">
                                <span>Transfer Amount</span>
                                <span className="text-white">{percentage}%</span>
                            </div>
                            
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="1"
                                value={percentage}
                                onChange={handleSliderChange}
                                className={`w-full h-4 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:bg-zinc-700 transition-all ${activeDecree === 'attack_debt' ? 'accent-red-600' : 'accent-soviet-red'}`}
                            />
                            
                            <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-mono">
                                <span>0 RUB</span>
                                <span>{maxAmount.toLocaleString()} RUB</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            {/* Execute Button */}
            <div className="mt-8">
                <button
                    onClick={handleExecute}
                    disabled={(activeDecree !== 'labor_standards' && transferAmount === 0) || isExecuted}
                    className={`w-full py-4 text-white font-bold uppercase tracking-[0.2em] text-lg transition-all border border-transparent relative overflow-hidden group disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-zinc-700
                        ${activeDecree === 'attack_debt' 
                            ? 'bg-red-800 hover:bg-red-700 hover:border-red-500 shadow-[0_0_20px_rgba(153,27,27,0.3)]' 
                            : 'bg-soviet-red hover:bg-red-600 hover:border-red-400'}
                        ${activeDecree === 'labor_standards' ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600' : ''}
                    `}
                >
                    {isExecuted ? (
                        <span className="flex items-center justify-center gap-2">
                            <CheckCircle2 /> {getSuccessText()}
                        </span>
                    ) : (
                        getButtonText()
                    )}
                    
                    {/* Hover Shine Effect */}
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12 pointer-events-none"></div>
                </button>
            </div>

         </div>
      </div>

      {/* Success Overlay Stamp */}
      <AnimatePresence>
        {isExecuted && (
             <motion.div 
                initial={{ opacity: 0, scale: 2, rotate: 10 }}
                animate={{ opacity: 1, scale: 1, rotate: -10 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-hard-light"
             >
                 <div className={`border-8 border-double p-6 text-5xl font-black uppercase tracking-widest opacity-80 mask-image-grunge transform -rotate-12 bg-black/50 backdrop-blur-sm whitespace-nowrap
                     ${activeDecree === 'attack_debt' ? 'text-red-500 border-red-500' : 'text-soviet-gold border-soviet-gold'}
                     ${activeDecree === 'labor_standards' ? 'text-emerald-500 border-emerald-500' : ''}
                 `}>
                     {activeDecree === 'labor_standards' ? "RATIFIED" : (activeDecree === 'attack_debt' ? "LIQUIDATED" : "EXECUTED")}
                 </div>
             </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};