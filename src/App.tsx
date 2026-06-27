import { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  calculateKPR,
  calculateKKB,
} from './utils/calculations';
import type {
  KPRInput,
  KKBInput,
} from './utils/calculations';
import CalculatorInputs from './components/CalculatorInputs';
import DashboardSummary from './components/DashboardSummary';
import Visualizations from './components/Visualizations';
import AmortizationTable from './components/AmortizationTable';
import HistoryPanel from './components/HistoryPanel';
import type { SavedCalculation } from './components/HistoryPanel';
import { Sun, Moon, Sliders, BarChart3 } from 'lucide-react';
import { trackLoanCalculation } from './utils/analytics';

const DEFAULT_KPR_INPUT: KPRInput = {
  assetPrice: 1200000000,
  downPayment: 200000000,
  tenorYears: 15,
  tiers: [
    { id: '1', name: 'Promo Fixed (Tahun 1-3)', durationYears: 3, rate: 5.0 },
    { id: '2', name: 'Floating (Tahun 4-15)', durationYears: 12, rate: 10.0 },
  ],
  includeFees: false,
  fees: {
    provisionPercent: 1.0,
    adminFlat: 1000000,
    appraisalFlat: 1500000,
    notaryPercent: 1.5,
    insurancePercent: 1.0,
  },
};

const DEFAULT_KKB_INPUT: KKBInput = {
  assetPrice: 300000000,
  downPayment: 60000000,
  tenorYears: 5,
  flatRate: 5.0,
  includeFees: false,
  fees: {
    adminFlat: 2000000,
    fiduciaryFlat: 500000,
    insurancePercent: 2.5,
  },
};

export default function App() {
  const [loanType, setLoanType] = useLocalStorage<'KPR' | 'KKB'>('lixionary_loan_type', 'KPR');
  const [kprInput, setKprInput] = useLocalStorage<KPRInput>('lixionary_kpr_input', DEFAULT_KPR_INPUT);
  const [kkbInput, setKkbInput] = useLocalStorage<KKBInput>('lixionary_kkb_input', DEFAULT_KKB_INPUT);
  const [history, setHistory] = useLocalStorage<SavedCalculation[]>('lixionary_history', []);
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('lixionary_dark_mode', true);
  const [activeMobileTab, setActiveMobileTab] = useState<'input' | 'results'>('input');

  // Perform Calculations
  const kprOutput = useMemo(() => {
    try {
      return calculateKPR(kprInput);
    } catch (e) {
      console.error('KPR Calculation failed:', e);
      return undefined;
    }
  }, [kprInput]);

  const kkbOutput = useMemo(() => {
    try {
      return calculateKKB(kkbInput);
    } catch (e) {
      console.error('KKB Calculation failed:', e);
      return undefined;
    }
  }, [kkbInput]);

  // History Operations
  const handleSaveCurrent = (name: string) => {
    const newSaved: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      timestamp: Date.now(),
      loanType,
      kprData: loanType === 'KPR' ? { ...kprInput } : undefined,
      kkbData: loanType === 'KKB' ? { ...kkbInput } : undefined,
    };
    setHistory((prev) => [newSaved, ...prev]);
  };

  const handleLoadSaved = (calc: SavedCalculation) => {
    setLoanType(calc.loanType);
    if (calc.loanType === 'KPR' && calc.kprData) {
      setKprInput(calc.kprData);
    } else if (calc.loanType === 'KKB' && calc.kkbData) {
      setKkbInput(calc.kkbData);
    }
    setActiveMobileTab('results'); // Auto-switch to results tab on load
  };

  const handleDeleteSaved = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRenameSaved = (id: string, newName: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const kprAssetPrice = kprInput.assetPrice;
  const kprDownPayment = kprInput.downPayment;
  const kprTenorYears = kprInput.tenorYears;
  const kkbAssetPrice = kkbInput.assetPrice;
  const kkbDownPayment = kkbInput.downPayment;
  const kkbTenorYears = kkbInput.tenorYears;

  // Google Analytics Debounced Tracking
  useEffect(() => {
    const isKPR = loanType === 'KPR';
    const assetPrice = isKPR ? kprAssetPrice : kkbAssetPrice;
    const downPayment = isKPR ? kprDownPayment : kkbDownPayment;
    const tenorYears = isKPR ? kprTenorYears : kkbTenorYears;
    const loanAmount = Math.max(0, assetPrice - downPayment);

    const timer = setTimeout(() => {
      trackLoanCalculation({
        loan_type: loanType,
        asset_price: assetPrice,
        down_payment: downPayment,
        loan_amount: loanAmount,
        tenor_years: tenorYears,
      });
    }, 3000); // 3-second debounce

    return () => clearTimeout(timer);
  }, [
    loanType,
    kprAssetPrice,
    kprDownPayment,
    kprTenorYears,
    kkbAssetPrice,
    kkbDownPayment,
    kkbTenorYears,
  ]);

  // Active details to suggest naming in HistoryPanel
  const activeDetails = {
    title:
      loanType === 'KPR'
        ? `KPR Rp ${(kprInput.assetPrice / 1e6).toFixed(0)}Jt - ${kprInput.tenorYears}th`
        : `KKB Rp ${(kkbInput.assetPrice / 1e6).toFixed(0)}Jt - ${kkbInput.tenorYears}th`,
    description: loanType === 'KPR' ? 'Kredit Pemilikan Rumah' : 'Kredit Kendaraan Bermotor',
    amount: loanType === 'KPR' ? kprInput.assetPrice : kkbInput.assetPrice,
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? 'dark text-slate-100 bg-slate-950' : 'text-slate-900 bg-slate-50'
      }`}
    >
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-slate-200/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-primary to-secondary rounded-xl shadow-md text-white font-extrabold text-lg">
              LX
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Lixionary Amortization
              </h1>
              <p className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                KPR & KKB Offline Amortization Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Tab Selector */}
        <div className={`flex lg:hidden rounded-xl p-1 border mb-4 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200 shadow-sm'
        }`}>
          <button
            onClick={() => setActiveMobileTab('input')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeMobileTab === 'input'
                ? 'bg-primary text-white shadow-glow-primary'
                : darkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Parameter Input
          </button>
          <button
            onClick={() => setActiveMobileTab('results')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeMobileTab === 'results'
                ? 'bg-secondary text-white shadow-glow-secondary'
                : darkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Hasil & Grafik
          </button>
        </div>

        {/* Dashboard Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Inputs & History */}
          <div className={`lg:col-span-4 space-y-6 ${activeMobileTab === 'input' ? 'block' : 'hidden lg:block'}`}>
            <CalculatorInputs
              loanType={loanType}
              setLoanType={setLoanType}
              kprInput={kprInput}
              setKprInput={setKprInput}
              kkbInput={kkbInput}
              setKkbInput={setKkbInput}
              darkMode={darkMode}
            />

            <HistoryPanel
              history={history}
              onLoad={handleLoadSaved}
              onDelete={handleDeleteSaved}
              onRename={handleRenameSaved}
              onSaveCurrent={handleSaveCurrent}
              currentCalculatedDetails={activeDetails}
              darkMode={darkMode}
            />
          </div>

          {/* Right Panel: Metrics, Visuals, and Schedule */}
          <div className={`lg:col-span-8 space-y-6 ${activeMobileTab === 'results' ? 'block' : 'hidden lg:block'}`}>
            <DashboardSummary
              loanType={loanType}
              kprOutput={kprOutput}
              kkbOutput={kkbOutput}
              assetPrice={loanType === 'KPR' ? kprInput.assetPrice : kkbInput.assetPrice}
              downPayment={loanType === 'KPR' ? kprInput.downPayment : kkbInput.downPayment}
              darkMode={darkMode}
            />

            {/* Visualizations */}
            <Visualizations
              schedule={
                loanType === 'KPR'
                  ? kprOutput?.schedule || []
                  : kkbOutput?.schedule || []
              }
              darkMode={darkMode}
            />

            {/* Amortization Table */}
            <AmortizationTable
              schedule={
                loanType === 'KPR'
                  ? kprOutput?.schedule || []
                  : kkbOutput?.schedule || []
              }
              darkMode={darkMode}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
