import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Scroll,
  ArrowRight,
  Coins,
  Wallet,
  Landmark,
  CheckCircle2,
  Scale,
  Calculator,
  AlertTriangle,
  Briefcase,
  Clock,
  ShieldAlert,
  Download,
  Upload,
  FileJson,
  Trash2 // Иконка корзины
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type DecreeType =
  | 'balance_transfer'
  | 'attack_debt'
  | 'labor_standards'
  | 'resource_baseline'
  | 'archive_protocol';

export const KremlinModal: React.FC = () => {
  const { state, dispatch } = useGame();
  const [activeDecree, setActiveDecree] = useState<DecreeType>('balance_transfer');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxAmount = activeDecree === 'balance_transfer' ? state.resources.cash : state.resources.reserves;
  const [transferAmount, setTransferAmount] = useState(() => Math.floor(maxAmount * 0.1));
  const [inputValue, setInputValue] = useState(() => String(Math.floor(maxAmount * 0.1)));
  const [newIncome, setNewIncome] = useState(state.settings.monthlyIncome);
  const [newHours, setNewHours] = useState(state.settings.monthlyWorkHours);
  const [baselineInputs, setBaselineInputs] = useState({
    debt: String(state.resources.debt),
    cash: String(state.resources.cash),
    reserves: String(state.resources.reserves),
  });
  const [baselineRecordedAt, setBaselineRecordedAt] = useState(new Date());
  const [isExecuted, setIsExecuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeDecree === 'balance_transfer' || activeDecree === 'attack_debt') {
        const initialAmt = Math.floor(maxAmount * 0.1);
        setTransferAmount(initialAmt);
        setInputValue(String(initialAmt));
    }
    if (activeDecree === 'labor_standards') {
        setNewIncome(state.settings.monthlyIncome);
        setNewHours(state.settings.monthlyWorkHours);
    }
    if (activeDecree === 'resource_baseline') {
        setBaselineInputs({
            debt: String(state.resources.debt),
            cash: String(state.resources.cash),
            reserves: String(state.resources.reserves),
        });
        setBaselineRecordedAt(new Date());
    }
    setStatusMessage(null);
  }, [activeDecree, maxAmount, state.settings, state.resources]);

  const percentage = maxAmount > 0 ? Math.round((transferAmount / maxAmount) * 100) : 0;
  const remainingSource = maxAmount - transferAmount;
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
      if (val === '') { setTransferAmount(0); return; }
      const numVal = parseInt(val, 10);
      if (!isNaN(numVal)) {
          const clamped = Math.min(maxAmount, Math.max(0, numVal));
          setTransferAmount(clamped);
      }
  };

  const handleInputBlur = () => setInputValue(String(transferAmount));
  const cleanNumericInput = (value: string) => {
      const sanitized = value.replace(/[^\d]/g, '');
      return sanitized === '' ? 0 : parseInt(sanitized, 10);
  };

  const handleBaselineChange = (field: keyof typeof baselineInputs, value: string) => {
      setBaselineInputs((prev) => ({ ...prev, [field]: value }));
      setBaselineRecordedAt(new Date());
  };

  const baselineValues = useMemo(() => ({
      debt: cleanNumericInput(baselineInputs.debt),
      cash: cleanNumericInput(baselineInputs.cash),
      reserves: cleanNumericInput(baselineInputs.reserves),
  }), [baselineInputs]);

  const canConfirmBaseline = (Object.values(baselineInputs) as string[]).every(v => v.trim() !== '');

  const handleExecute = () => {
    if (activeDecree === 'labor_standards') {
        dispatch({ 
            type: 'UPDATE_SETTINGS', 
            payload: { monthlyIncome: newIncome, monthlyWorkHours: newHours } 
        });
    } else if (activeDecree === 'resource_baseline') {
         dispatch({ type: 'SET_RESOURCES', payload: baselineValues });
    } else {
        if (transferAmount <= 0) return;
        if (activeDecree === 'balance_transfer') {
            dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'cash', amount: -transferAmount } });
            dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'reserves', amount: transferAmount } });
        } else if (activeDecree === 'attack_debt') {
            dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'reserves', amount: -transferAmount } });
            dispatch({ type: 'UPDATE_RESOURCE', payload: { resource: 'debt', amount: -transferAmount } });
        }
    }
    setIsExecuted(true);
    setTimeout(() => {
        setIsExecuted(false);
        if (activeDecree !== 'labor_standards' && activeDecree !== 'resource_baseline') {
            setTransferAmount(0);
            setInputValue("0");
        }
    }, 2000);
  };

  const handleBaselineThink = () => {
      dispatch({
          type: 'SET_PENDING_TRANSACTION',
          payload: { cash: baselineValues.cash, reserves: baselineValues.reserves, debt: baselineValues.debt },
      });
      dispatch({ type: 'SET_KGB_STATUS', payload: 'warning_mild' });
      dispatch({ type: 'SELECT_BUILDING', payload: null });
      dispatch({ type: 'SET_RESERVE_UNLOCK', payload: true });
  };

  const handleExport = () => {
      const exportData = {
          version: "1.0",
          timestamp: new Date().toISOString(),
          resources: state.resources,
          settings: state.settings,
          resourceHistory: state.resourceHistory
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `citadel_archive_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatusMessage("ARCHIVE ENCODED & EXPORTED");
      setIsExecuted(true);
      setTimeout(() => setIsExecuted(false), 2000);
  };

  const handleImportClick = () => {
      if (fileInputRef.current) {
          fileInputRef.current.click();
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              // @ts-ignore
              dispatch({ type: 'LOAD_GAME_DATA', payload: json });
              setStatusMessage("PROTOCOL RESTORED SUCCESSFULLY");
              setIsExecuted(true);
              setTimeout(() => setIsExecuted(false), 2000);
          } catch (error) {
              console.error("Failed to parse archive", error);
              setStatusMessage("ERROR: CORRUPTED ARCHIVE FILE");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

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
      if (activeDecree === 'resource_baseline') return "RECORD BASELINE";
      return "ISSUE DECREE";
  }

  const getSuccessText = () => {
      if (statusMessage) return statusMessage;
      if (activeDecree === 'labor_standards') return "STANDARDS UPDATED";
      if (activeDecree === 'attack_debt') return "CHAIN BROKEN";
      if (activeDecree === 'resource_baseline') return "BASELINE SAVED";
      return "DECREE AUTHORIZED";
  }

  return (
    <div className="flex flex-col h-full font-mono text-zinc-300 relative">
      <div className="bg-zinc-900/50 border-b border-zinc-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-soviet-gold">
            <Scroll size={20} />
            <span className="uppercase tracking-widest font-bold text-sm">Select Decree Protocol</span>
        </div>
        
        {/* === ИЗМЕНЕННАЯ СЕКЦИЯ КНОПОК === */}
        <div className="grid grid-cols-2 gap-2 pb-2">
             {[
                { id: 'balance_transfer', label: 'Balance Transfer' },
                { id: 'attack_debt', label: 'Attack Debt' },
                { id: 'labor_standards', label: 'Labor Standards' },
                { id: 'resource_baseline', label: 'Resource Ledger' },
                { id: 'archive_protocol', label: 'Archive' },
             ].map((tab) => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveDecree(tab.id as DecreeType)}
                    className={`
                        py-3 px-2 text-[10px] sm:text-xs uppercase tracking-wider border transition-all 
                        flex items-center justify-center text-center leading-tight whitespace-normal h-full
                        ${tab.id === 'archive_protocol' ? 'col-span-2' : ''} 
                        ${activeDecree === tab.id
                        ? 'bg-soviet-red text-white border-red-500 shadow-[0_0_10px_rgba(208,0,0,0.3)] font-bold' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'}
                    `}
                >
                    {tab.label}
                </button>
             ))}
        </div>
        {/* ============================== */}
      </div>

      <div className="flex-1 p-2 relative overflow-y-auto">
         <div className="bg-zinc-900/30 border border-zinc-700/50 p-6 rounded-lg min-h-full flex flex-col">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-zinc-800 rounded border border-zinc-600">
                    <Landmark size={32} className="text-zinc-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                        {activeDecree === 'balance_transfer' && 'State Treasury Realignment'}
                        {activeDecree === 'attack_debt' && 'Sovereignty Restoration'}
                        {activeDecree === 'labor_standards' && 'Labor Value Calibration'}
                        {activeDecree === 'resource_baseline' && 'Manual Resource Audit'}
                        {activeDecree === 'archive_protocol' && 'State Archive & Backup'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        {activeDecree === 'balance_transfer' && "Authorize the immediate transfer of liquid assets (Cash) into the strategic national reserves."}
                        {activeDecree === 'attack_debt' && "Utilize strategic reserves to aggressively pay down national debt and reclaim sovereignty."}
                        {activeDecree === 'labor_standards' && "Redefine the fundamental constants of the Five-Year Plan."}
                        {activeDecree === 'resource_baseline' && "Capture the current financial reality directly from the Kremlin terminal."}
                        {activeDecree === 'archive_protocol' && (
                             <>
                                Encode current state into secure storage or restore from a previous epoch.
                                <br />
                                <span className="text-soviet-gold">All history and balances are preserved in the JSON artifacts.</span>
                             </>
                        )}
                    </p>
                </div>
            </div>

            <div className="border-t border-zinc-800 my-4"></div>

            <div className="flex-1 flex flex-col justify-center gap-8">
                {activeDecree === 'labor_standards' ? (
                     <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                     </div>
                ) : activeDecree === 'resource_baseline' ? (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {[
                            { key: 'debt', label: 'Total Debt (RUB)', icon: Scale, color: 'text-red-400', border: 'border-red-900' },
                            { key: 'cash', label: 'Cash on Hand (RUB)', icon: Wallet, color: 'text-emerald-400', border: 'border-emerald-900' },
                            { key: 'reserves', label: 'Strategic Reserves (RUB)', icon: Coins, color: 'text-amber-400', border: 'border-amber-900' },
                        ].map(({ key, label, icon: Icon, color, border }) => (
                            <div key={key} className="bg-black/20 border border-zinc-700 p-4 rounded group hover:border-soviet-gold transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon size={16} className={color} />
                                    <label className="text-xs uppercase tracking-widest text-zinc-500">{label}</label>
                                </div>
                                <div className={`flex items-center border-b-2 border-zinc-700 group-hover:border-soviet-gold pb-2 ${border}`}>
                                    <input
                                        type="text"
                                        value={baselineInputs[key as keyof typeof baselineInputs]}
                                        onChange={(e) => handleBaselineChange(key as keyof typeof baselineInputs, e.target.value)}
                                        className="bg-transparent w-full text-3xl font-bold font-mono text-white focus:outline-none placeholder-zinc-700"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        ))}
                        {canConfirmBaseline && (
                             <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                <button
                                    onClick={() => dispatch({ type: 'SET_RESOURCES', payload: baselineValues })}
                                    className="flex-1 py-3 bg-soviet-red hover:bg-red-600 text-white font-bold uppercase tracking-[0.2em] text-xs border border-red-700 transition-colors"
                                >
                                    APPROVED
                                </button>
                                <button
                                    onClick={handleBaselineThink}
                                    className="flex-1 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 font-bold uppercase tracking-[0.2em] text-xs transition-colors"
                                >
                                    I NEED TIME TO THINK
                                </button>
                            </div>
                        )}
                    </div>
                ) : activeDecree === 'archive_protocol' ? (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button 
                                onClick={handleExport}
                                className="group relative flex flex-col items-center justify-center p-8 bg-black/20 border-2 border-zinc-700 hover:border-soviet-gold hover:bg-zinc-900/50 transition-all rounded-lg"
                            >
                                <div className="p-4 rounded-full bg-zinc-800 group-hover:bg-soviet-gold group-hover:text-black mb-4 transition-colors">
                                    <Download size={32} />
                                </div>
                                <h4 className="text-lg font-bold uppercase tracking-widest mb-2">Encode State</h4>
                                <p className="text-xs text-center text-zinc-500 px-4">
                                    Serialize current resources and transaction history into a local JSON artifact.
                                </p>
                            </button>

                            <button 
                                onClick={handleImportClick}
                                className="group relative flex flex-col items-center justify-center p-8 bg-black/20 border-2 border-zinc-700 hover:border-soviet-red hover:bg-zinc-900/50 transition-all rounded-lg"
                            >
                                <div className="p-4 rounded-full bg-zinc-800 group-hover:bg-soviet-red group-hover:text-white mb-4 transition-colors">
                                    <Upload size={32} />
                                </div>
                                <h4 className="text-lg font-bold uppercase tracking-widest mb-2">Decode State</h4>
                                <p className="text-xs text-center text-zinc-500 px-4">
                                    Restore the Republic from a previously saved JSON artifact. (Overwrites current data)
                                </p>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".json"
                                    className="hidden"
                                />
                            </button>
                        </div>
                        
                        {/* КНОПКА СБРОСА */}
                        <button 
                            onClick={() => {
                                if (window.confirm("WARNING: This will wipe all local data and reset the Republic to zero. This action cannot be undone. Confirm?")) {
                                    // @ts-ignore
                                    dispatch({ type: 'RESET_GAME' });
                                    setStatusMessage("SYSTEM WIPED. REBOOTING...");
                                    setIsExecuted(true);
                                    setTimeout(() => setIsExecuted(false), 2000);
                                }
                            }}
                            className="w-full py-4 mt-2 border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 text-red-500 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
                        >
                            <Trash2 size={16} /> WIPE SYSTEM DATA (HARD RESET)
                        </button>

                        <div className="bg-zinc-900/60 p-4 border border-dashed border-zinc-800 rounded flex items-center justify-center gap-3 text-zinc-500 text-xs">
                             <FileJson size={16} />
                             <span>Protocol supports standard .JSON formatting only.</span>
                        </div>
                    </div>
                ) : (
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
            
            {activeDecree !== 'resource_baseline' && activeDecree !== 'archive_protocol' && (
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
                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12 pointer-events-none"></div>
                    </button>
                </div>
            )}

         </div>
      </div>

      <AnimatePresence>
        {isExecuted && (
             <motion.div 
                initial={{ opacity: 0, scale: 2, rotate: 10 }}
                animate={{ opacity: 1, scale: 1, rotate: -10 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-hard-light"
             >
                 <div className={`border-8 border-double p-6 text-xl sm:text-5xl font-black uppercase tracking-widest opacity-80 mask-image-grunge transform -rotate-12 bg-black/50 backdrop-blur-sm whitespace-nowrap
                     ${activeDecree === 'attack_debt' ? 'text-red-500 border-red-500' : 'text-soviet-gold border-soviet-gold'}
                     ${activeDecree === 'labor_standards' || activeDecree === 'archive_protocol' ? 'text-emerald-500 border-emerald-500' : ''}
                     ${activeDecree === 'resource_baseline' ? 'text-amber-400 border-amber-400' : ''}
                 `}>
                     {activeDecree === 'labor_standards'
                        ? "RATIFIED"
                        : activeDecree === 'attack_debt'
                            ? "LIQUIDATED"
                            : activeDecree === 'resource_baseline'
                                ? "RECORDED"
                                : activeDecree === 'archive_protocol'
                                    ? "PROCESSED"
                                    : "EXECUTED"}
                 </div>
             </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};