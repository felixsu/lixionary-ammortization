import type { ReactNode } from 'react';
import { DollarSign, Percent, TrendingUp, Wallet, ShieldAlert } from 'lucide-react';
import { formatIDR, formatCompactIDR, formatPercent } from '../utils/formatters';
import type { KPROutput, KKBOutput } from '../utils/calculations';

interface DashboardSummaryProps {
  loanType: 'KPR' | 'KKB';
  kprOutput?: KPROutput;
  kkbOutput?: KKBOutput;
  assetPrice: number;
  downPayment: number;
  darkMode: boolean;
}

export default function DashboardSummary({
  loanType,
  kprOutput,
  kkbOutput,
  assetPrice,
  downPayment,
  darkMode,
}: DashboardSummaryProps) {
  if (loanType === 'KPR' && !kprOutput) return null;
  if (loanType === 'KKB' && !kkbOutput) return null;

  const isKPR = loanType === 'KPR';
  const principal = isKPR ? kprOutput!.principal : kkbOutput!.principal;
  const totalInterest = isKPR ? kprOutput!.totalInterest : kkbOutput!.totalInterest;
  const totalCostOfOwnership = isKPR ? kprOutput!.totalCostOfOwnership : kkbOutput!.totalCostOfOwnership;
  const totalFees = isKPR ? kprOutput!.fees.totalFees : kkbOutput!.fees.totalFees;
  const totalCashRequired = isKPR ? kprOutput!.totalCashRequired : kkbOutput!.totalCashRequired;

  // Monthly Installment Info
  let mainInstallmentText = '';
  let subInstallments: ReactNode = null;

  if (isKPR && kprOutput) {
    const activeTiers = kprOutput.installmentsByTier;
    if (activeTiers.length > 0) {
      mainInstallmentText = formatIDR(activeTiers[0].monthlyInstallment);
      
      subInstallments = (
        <div className="mt-2 space-y-1">
          {activeTiers.map((t, index) => {
            const startYear = Math.ceil(t.startMonth / 12);
            const endYear = Math.ceil(t.endMonth / 12);
            return (
              <div key={index} className={`flex justify-between text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>
                  {t.tierName} (Thn {startYear}-{endYear}):
                </span>
                <span className="font-semibold text-primary">{formatIDR(t.monthlyInstallment)}/bln</span>
              </div>
            );
          })}
        </div>
      );
    }
  } else if (!isKPR && kkbOutput) {
    mainInstallmentText = formatIDR(kkbOutput.monthlyInstallment);
    subInstallments = (
      <div className={`mt-2 text-xs p-2.5 rounded-lg border ${
        darkMode 
          ? 'bg-primary/10 border-primary/20 text-slate-300' 
          : 'bg-primary/5 border-primary/10 text-slate-800'
      }`}>
        <div className="flex gap-2 items-start">
          <Percent className="w-4 h-4 mt-0.5 shrink-0 text-secondary" />
          <div>
            <p className="font-semibold text-secondary">Bunga Efektif Setara: {formatPercent(kkbOutput.equivalentEffectiveRate)}</p>
            <p className="text-[10px] mt-0.5 opacity-80 leading-relaxed">
              Cicilan mobil dihitung dengan bunga flat. Suku bunga anuitas (efektif) di atas menghasilkan cicilan bulanan yang sama persis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fees details for the expanded list
  const renderedFees = isKPR ? (
    <div className="mt-2 text-xs space-y-1">
      <div className="flex justify-between">
        <span>Provisi (1%):</span>
        <span>{formatIDR(kprOutput!.fees.provision)}</span>
      </div>
      <div className="flex justify-between">
        <span>Admin:</span>
        <span>{formatIDR(kprOutput!.fees.admin)}</span>
      </div>
      <div className="flex justify-between">
        <span>Notaris/Legal (1.5%):</span>
        <span>{formatIDR(kprOutput!.fees.notary)}</span>
      </div>
      <div className="flex justify-between">
        <span>Appraisal:</span>
        <span>{formatIDR(kprOutput!.fees.appraisal)}</span>
      </div>
      <div className="flex justify-between">
        <span>Asuransi (Life/Property, 1%):</span>
        <span>{formatIDR(kprOutput!.fees.insurance)}</span>
      </div>
    </div>
  ) : (
    <div className="mt-2 text-xs space-y-1">
      <div className="flex justify-between">
        <span>Admin Flat:</span>
        <span>{formatIDR(kkbOutput!.fees.admin)}</span>
      </div>
      <div className="flex justify-between">
        <span>Fidusia:</span>
        <span>{formatIDR(kkbOutput!.fees.fiduciary)}</span>
      </div>
      <div className="flex justify-between">
        <span>Asuransi Kendaraan (All Risk, 2.5%):</span>
        <span>{formatIDR(kkbOutput!.fees.insurance)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Plafond */}
        <div className={`rounded-2xl p-5 border transition-all ${
          darkMode 
            ? 'glass hover:border-primary/50 hover:shadow-glow-primary' 
            : 'glass-light shadow-sm hover:border-primary/30'
        }`}>
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Plafond Pinjaman
              </p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight glow-text-primary text-primary">
                {formatIDR(principal)}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${
              darkMode ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Harga Aset:</span>
            <span className="font-semibold">{formatCompactIDR(assetPrice)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Uang Muka (DP):</span>
            <span className="font-semibold">{formatCompactIDR(downPayment)}</span>
          </div>
        </div>

        {/* Card 2: Installment */}
        <div className={`rounded-2xl p-5 border transition-all ${
          darkMode 
            ? 'glass hover:border-secondary/50 hover:shadow-glow-secondary' 
            : 'glass-light shadow-sm hover:border-secondary/30'
        }`}>
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Angsuran per Bulan
              </p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight glow-text-secondary text-secondary">
                {mainInstallmentText}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${
              darkMode ? 'bg-secondary/10 text-secondary' : 'bg-secondary/10 text-secondary'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          {subInstallments}
        </div>

        {/* Card 3: Total Interest */}
        <div className={`rounded-2xl p-5 border transition-all ${
          darkMode 
            ? 'glass hover:border-accent/50 hover:shadow-glow-secondary' 
            : 'glass-light shadow-sm hover:border-accent/30'
        }`}>
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Total Bunga Dibayar
              </p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight glow-text-accent text-accent">
                {formatIDR(totalInterest)}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${
              darkMode ? 'bg-accent/10 text-accent' : 'bg-accent/10 text-accent'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Rasio Bunga:</span>
            <span className="font-semibold text-accent">
              {formatPercent(principal > 0 ? (totalInterest / principal) * 100 : 0, 1)} dari Plafond
            </span>
          </div>
        </div>

        {/* Card 4: Upfront Cash & Fees */}
        <div className={`rounded-2xl p-5 border transition-all ${
          darkMode 
            ? 'glass hover:border-primary/50 hover:shadow-glow-primary' 
            : 'glass-light shadow-sm hover:border-primary/30'
        }`}>
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Total Dana Awal (DP + Biaya)
              </p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight glow-text-primary text-primary">
                {formatIDR(totalCashRequired)}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${
              darkMode ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs flex justify-between">
            <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Total Biaya Tambahan:</span>
            <span className="font-semibold text-primary">{formatIDR(totalFees)}</span>
          </div>
          {totalFees > 0 && renderedFees}
        </div>
      </div>

      {/* Total Cost Alert / Insight Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        darkMode 
          ? 'bg-slate-900/40 border-slate-800' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex gap-3 items-center">
          <ShieldAlert className="w-5 h-5 text-accent shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Total Biaya Kepemilikan (Cost of Ownership)</h4>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Harga Aset + Total Bunga (Tidak termasuk Biaya Admin/Upfront)
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xl font-extrabold text-accent tracking-tight glow-text-accent">
            {formatIDR(totalCostOfOwnership)}
          </span>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            {((totalCostOfOwnership / assetPrice) * 100).toFixed(1)}% dari harga awal aset
          </p>
        </div>
      </div>
    </div>
  );
}
