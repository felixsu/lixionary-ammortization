import React from 'react';
import type { KPRInput, KKBInput, KPRTier } from '../utils/calculations';
import { formatIDR } from '../utils/formatters';
import { Plus, Trash2, ShieldAlert, Settings, Info } from 'lucide-react';

interface CalculatorInputsProps {
  loanType: 'KPR' | 'KKB';
  setLoanType: (type: 'KPR' | 'KKB') => void;
  kprInput: KPRInput;
  setKprInput: React.Dispatch<React.SetStateAction<KPRInput>>;
  kkbInput: KKBInput;
  setKkbInput: React.Dispatch<React.SetStateAction<KKBInput>>;
  darkMode: boolean;
}

export default function CalculatorInputs({
  loanType,
  setLoanType,
  kprInput,
  setKprInput,
  kkbInput,
  setKkbInput,
  darkMode,
}: CalculatorInputsProps) {
  const isKPR = loanType === 'KPR';

  // DP warnings
  const dpPercentKPR = kprInput.assetPrice > 0 ? (kprInput.downPayment / kprInput.assetPrice) * 100 : 0;
  const dpPercentKKB = kkbInput.assetPrice > 0 ? (kkbInput.downPayment / kkbInput.assetPrice) * 100 : 0;

  const showKPRWarning = dpPercentKPR < 10 && dpPercentKPR > 0;
  const showKKBWarning = dpPercentKKB < 20 && dpPercentKKB > 0;

  // Handle number input changes with helper to strip formatting characters
  const handlePriceChange = (val: string, type: 'KPR' | 'KKB') => {
    const numericVal = Math.max(0, parseInt(val.replace(/[^0-9]/g, ''), 10) || 0);
    if (type === 'KPR') {
      setKprInput((prev) => {
        const ratio = prev.assetPrice > 0 ? prev.downPayment / prev.assetPrice : 0;
        const newDp = Math.min(numericVal, Math.round(numericVal * ratio));
        return { ...prev, assetPrice: numericVal, downPayment: newDp };
      });
    } else {
      setKkbInput((prev) => {
        const ratio = prev.assetPrice > 0 ? prev.downPayment / prev.assetPrice : 0;
        const newDp = Math.min(numericVal, Math.round(numericVal * ratio));
        return { ...prev, assetPrice: numericVal, downPayment: newDp };
      });
    }
  };

  const handleDpIdrChange = (val: string, type: 'KPR' | 'KKB') => {
    const numericVal = Math.max(0, parseInt(val.replace(/[^0-9]/g, ''), 10) || 0);
    if (type === 'KPR') {
      const cappedVal = Math.min(kprInput.assetPrice, numericVal);
      setKprInput((prev) => ({ ...prev, downPayment: cappedVal }));
    } else {
      const cappedVal = Math.min(kkbInput.assetPrice, numericVal);
      setKkbInput((prev) => ({ ...prev, downPayment: cappedVal }));
    }
  };

  const handleDpPercentChange = (val: string, type: 'KPR' | 'KKB') => {
    const pct = Math.max(0, Math.min(100, parseFloat(val) || 0));
    if (type === 'KPR') {
      const newDp = Math.round(kprInput.assetPrice * (pct / 100));
      setKprInput((prev) => ({ ...prev, downPayment: newDp }));
    } else {
      const newDp = Math.round(kkbInput.assetPrice * (pct / 100));
      setKkbInput((prev) => ({ ...prev, downPayment: newDp }));
    }
  };

  // KPR Tiers Helpers
  const totalTierYears = kprInput.tiers.reduce((sum, t) => sum + t.durationYears, 0);
  const tiersMatchTenor = totalTierYears === kprInput.tenorYears;

  const handleAddTier = () => {
    const remainingYears = Math.max(1, kprInput.tenorYears - totalTierYears);
    const newTier: KPRTier = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Suku Bunga Tier ${kprInput.tiers.length + 1}`,
      durationYears: remainingYears,
      rate: 10,
    };
    setKprInput((prev) => ({ ...prev, tiers: [...prev.tiers, newTier] }));
  };

  const handleRemoveTier = (id: string) => {
    if (kprInput.tiers.length <= 1) return; // Must have at least 1 tier
    setKprInput((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((t) => t.id !== id),
    }));
  };

  const handleUpdateTier = (id: string, updates: Partial<KPRTier>) => {
    setKprInput((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          if (updated.durationYears !== undefined) {
            updated.durationYears = Math.max(1, updated.durationYears);
          }
          if (updated.rate !== undefined) {
            updated.rate = Math.max(0, Math.min(100, updated.rate));
          }
          return updated;
        }
        return t;
      }),
    }));
  };

  const handleAutoAdjustTiers = () => {
    if (kprInput.tiers.length === 0) return;
    const allExceptLast = kprInput.tiers.slice(0, -1);
    const sumExceptLast = allExceptLast.reduce((sum, t) => sum + t.durationYears, 0);
    const remaining = kprInput.tenorYears - sumExceptLast;
    
    if (remaining > 0) {
      setKprInput((prev) => {
        const copy = [...prev.tiers];
        copy[copy.length - 1].durationYears = remaining;
        return { ...prev, tiers: copy };
      });
    } else {
      // If sum of all except last exceeds tenor, we reset all except last to 1 and last to remaining
      const resetTiers = kprInput.tiers.map((t, idx) => ({
        ...t,
        durationYears: idx === kprInput.tiers.length - 1 ? Math.max(1, kprInput.tenorYears - (kprInput.tiers.length - 1)) : 1,
      }));
      setKprInput((prev) => ({ ...prev, tiers: resetTiers }));
    }
  };

  return (
    <div className={`rounded-2xl p-6 border transition-all h-full ${
      darkMode ? 'glass' : 'glass-light shadow-sm'
    }`}>
      {/* Toggle Loan Type */}
      <div className={`flex rounded-xl p-1 mb-6 border ${
        darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => setLoanType('KPR')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            isKPR
              ? darkMode
                ? 'bg-slate-900 text-primary border border-slate-800 shadow-glow-primary'
                : 'bg-white text-primary border border-slate-200 shadow-sm'
              : darkMode
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          KPR (Properti)
        </button>
        <button
          onClick={() => setLoanType('KKB')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            !isKPR
              ? darkMode
                ? 'bg-slate-900 text-secondary border border-slate-800 shadow-glow-secondary'
                : 'bg-white text-secondary border border-slate-200 shadow-sm'
              : darkMode
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          KKB (Kendaraan)
        </button>
      </div>

      <div className="space-y-5">
        {/* Input: Price */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isKPR ? 'Harga Properti (Plafond)' : 'Harga Kendaraan'}
          </label>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Rp
            </span>
            <input
              type="text"
              value={isKPR ? kprInput.assetPrice.toLocaleString('id-ID') : kkbInput.assetPrice.toLocaleString('id-ID')}
              onChange={(e) => handlePriceChange(e.target.value, loanType)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border font-semibold focus:outline-none focus:ring-2 transition-all ${
                darkMode
                  ? 'bg-slate-950 border-slate-800 text-white focus:ring-primary focus:border-transparent'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-primary focus:border-transparent'
              }`}
            />
          </div>
          <span className={`text-[11px] block mt-1 ${darkMode ? 'text-primary/80 font-medium' : 'text-primary font-medium'}`}>
            Format: {formatIDR(isKPR ? kprInput.assetPrice : kkbInput.assetPrice)}
          </span>
        </div>

        {/* Input: Down Payment (DP) */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Uang Muka (Down Payment / DP)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Rp
              </span>
              <input
                type="text"
                value={isKPR ? kprInput.downPayment.toLocaleString('id-ID') : kkbInput.downPayment.toLocaleString('id-ID')}
                onChange={(e) => handleDpIdrChange(e.target.value, loanType)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border font-semibold focus:outline-none focus:ring-2 transition-all ${
                  darkMode
                    ? 'bg-slate-950 border-slate-800 text-white focus:ring-primary focus:border-transparent'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-primary focus:border-transparent'
                }`}
              />
            </div>
            <div className="col-span-1 relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={
                  isKPR
                    ? dpPercentKPR === 0 ? '' : Number(dpPercentKPR.toFixed(2))
                    : dpPercentKKB === 0 ? '' : Number(dpPercentKKB.toFixed(2))
                }
                onChange={(e) => handleDpPercentChange(e.target.value, loanType)}
                placeholder="%"
                className={`w-full px-4 py-3 rounded-xl border text-center font-semibold focus:outline-none focus:ring-2 transition-all ${
                  darkMode
                    ? 'bg-slate-950 border-slate-800 text-white focus:ring-primary focus:border-transparent'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-primary focus:border-transparent'
                }`}
              />
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                %
              </span>
            </div>
          </div>

          {/* Linked Hint */}
          <span className={`text-[11px] block mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Plafond Bersih (Pokok Pinjaman): {formatIDR(Math.max(0, (isKPR ? kprInput.assetPrice - kprInput.downPayment : kkbInput.assetPrice - kkbInput.downPayment)))}
          </span>

          {/* Soft warning messages */}
          {isKPR && showKPRWarning && (
            <div className="mt-2.5 p-3 rounded-xl border flex items-start gap-2 bg-amber-500/5 border-amber-500/25 text-amber-500">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                <strong>Catatan DP Rendah:</strong> DP properti di bawah 10%. Pastikan program bank yang diajukan mendukung promo DP rendah / 0% untuk menghindari penolakan.
              </p>
            </div>
          )}

          {!isKPR && showKKBWarning && (
            <div className="mt-2.5 p-3 rounded-xl border flex items-start gap-2 bg-amber-500/5 border-amber-500/25 text-amber-500">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                <strong>Peringatan OJK:</strong> Regulasi di Indonesia umumnya mensyaratkan minimum DP kendaraan bermotor sebesar 20% - 30% untuk menjaga solvabilitas pinjaman.
              </p>
            </div>
          )}
        </div>

        {/* Input: Tenor */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Tenor Pinjaman (Durasi)
          </label>
          <div className="flex items-center gap-3">
            <select
              value={isKPR ? kprInput.tenorYears : kkbInput.tenorYears}
              onChange={(e) => {
                const yr = parseInt(e.target.value, 10);
                if (isKPR) {
                  setKprInput((prev) => ({ ...prev, tenorYears: yr }));
                } else {
                  setKkbInput((prev) => ({ ...prev, tenorYears: yr }));
                }
              }}
              className={`w-full px-4 py-3 rounded-xl border font-semibold focus:outline-none focus:ring-2 transition-all ${
                darkMode
                  ? 'bg-slate-950 border-slate-800 text-white focus:ring-primary focus:border-transparent'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-primary focus:border-transparent'
              }`}
            >
              {Array.from({ length: isKPR ? 30 : 8 }, (_, i) => i + 1).map((y) => (
                <option key={y} value={y}>
                  {y} Tahun ({y * 12} Bulan)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section: Dynamic Interest Rate Input */}
        <div>
          {isKPR ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Skema Suku Bunga KPR (Annuity)
                </label>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Tier
                </button>
              </div>

              {/* Tiers Editor list */}
              <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                {kprInput.tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`flex items-center gap-2 p-3 rounded-xl border ${
                      darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => handleUpdateTier(tier.id, { name: e.target.value })}
                        className={`w-full bg-transparent border-b border-transparent focus:border-slate-700 text-xs font-bold px-1 py-0.5 focus:outline-none ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {/* Duration Input */}
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={tier.durationYears || ''}
                            onChange={(e) =>
                              handleUpdateTier(tier.id, { durationYears: parseInt(e.target.value, 10) })
                            }
                            className={`w-full px-2 py-1.5 rounded border text-center text-xs focus:outline-none ${
                              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-semibold">
                            Thn
                          </span>
                        </div>
                        {/* Rate Input */}
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={tier.rate || ''}
                            onChange={(e) =>
                              handleUpdateTier(tier.id, { rate: parseFloat(e.target.value) })
                            }
                            className={`w-full px-2.5 py-1.5 rounded border text-center text-xs focus:outline-none ${
                              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-semibold">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Tier button */}
                    <button
                      type="button"
                      disabled={kprInput.tiers.length <= 1}
                      onClick={() => handleRemoveTier(tier.id)}
                      className={`p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer`}
                      title="Hapus Tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Tiers Validation Warning */}
              {!tiersMatchTenor ? (
                <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-[11px] leading-relaxed">
                      Jumlah durasi tier ({totalTierYears} tahun) tidak sama dengan Tenor Pinjaman ({kprInput.tenorYears} tahun). Cicilan anuitas tidak dapat dihitung dengan tepat.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoAdjustTiers}
                    className="self-start text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    💡 Sesuaikan Otomatis Durasi Terakhir
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-primary flex items-center gap-2 text-xs">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Durasi suku bunga valid ({totalTierYears} Tahun).</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Suku Bunga Flat per Tahun (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={kkbInput.flatRate || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setKkbInput((prev) => ({ ...prev, flatRate: val }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl border font-semibold focus:outline-none focus:ring-2 transition-all ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 text-white focus:ring-primary focus:border-transparent'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-primary focus:border-transparent'
                  }`}
                />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  % Flat
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section: Additional Fees (Estimator) */}
        <div className={`rounded-xl border p-4 ${
          darkMode ? 'bg-slate-900/10 border-slate-800/80' : 'bg-slate-50/50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings className={`w-4 h-4 ${darkMode ? 'text-primary' : 'text-primary'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">Estimasi Biaya Tambahan</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isKPR ? kprInput.includeFees : kkbInput.includeFees}
                onChange={(e) => {
                  const check = e.target.checked;
                  if (isKPR) {
                    setKprInput((prev) => ({ ...prev, includeFees: check }));
                  } else {
                    setKkbInput((prev) => ({ ...prev, includeFees: check }));
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {((isKPR && kprInput.includeFees) || (!isKPR && kkbInput.includeFees)) && (
            <div className="space-y-3 pt-2 border-t border-slate-200/5 text-xs">
              {isKPR ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Provisi (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={kprInput.fees.provisionPercent}
                        onChange={(e) =>
                          setKprInput((p) => ({ ...p, fees: { ...p.fees, provisionPercent: parseFloat(e.target.value) || 0 } }))
                        }
                        className={`w-full px-2.5 py-1.5 rounded border ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Admin Flat (IDR)</label>
                      <input
                        type="text"
                        value={kprInput.fees.adminFlat.toLocaleString('id-ID')}
                        onChange={(e) =>
                          setKprInput((p) => ({ ...p, fees: { ...p.fees, adminFlat: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 } }))
                        }
                        className={`w-full px-2.5 py-1.5 rounded border ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Notaris (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={kprInput.fees.notaryPercent}
                        onChange={(e) =>
                          setKprInput((p) => ({ ...p, fees: { ...p.fees, notaryPercent: parseFloat(e.target.value) || 0 } }))
                        }
                        className={`w-full px-2.5 py-1.5 rounded border ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Asuransi (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={kprInput.fees.insurancePercent}
                        onChange={(e) =>
                          setKprInput((p) => ({ ...p, fees: { ...p.fees, insurancePercent: parseFloat(e.target.value) || 0 } }))
                        }
                        className={`w-full px-2.5 py-1.5 rounded border ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Appraisal Flat (IDR)</label>
                    <input
                      type="text"
                      value={kprInput.fees.appraisalFlat.toLocaleString('id-ID')}
                      onChange={(e) =>
                        setKprInput((p) => ({ ...p, fees: { ...p.fees, appraisalFlat: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 } }))
                      }
                      className={`w-full px-2.5 py-1.5 rounded border ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Admin Flat (IDR)</label>
                      <input
                        type="text"
                        value={kkbInput.fees.adminFlat.toLocaleString('id-ID')}
                        onChange={(e) =>
                          setKkbInput((p) => ({ ...p, fees: { ...p.fees, adminFlat: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 } }))
                        }
                        className={`w-full px-2.5 py-1.5 rounded border ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Fidusia Flat (IDR)</label>
                      <input
                        type="text"
                        value={kkbInput.fees.fiduciaryFlat.toLocaleString('id-ID')}
                        onChange={(e) =>
                          setKkbInput((p) => ({ ...p, fees: { ...p.fees, fiduciaryFlat: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 } }))
                        }
                        className={`w-full px-2.5 py-1.5 rounded border ${
                          darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Asuransi Kendaraan (% Harga Aset)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={kkbInput.fees.insurancePercent}
                      onChange={(e) =>
                        setKkbInput((p) => ({ ...p, fees: { ...p.fees, insurancePercent: parseFloat(e.target.value) || 0 } }))
                      }
                      className={`w-full px-2.5 py-1.5 rounded border ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
