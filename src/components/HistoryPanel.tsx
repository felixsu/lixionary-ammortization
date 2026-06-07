import React, { useState } from 'react';
import { Bookmark, Trash2, Edit3, X, Save, ArrowRight } from 'lucide-react';
import type { KPRInput, KKBInput } from '../utils/calculations';
import { formatIDR } from '../utils/formatters';

export interface SavedCalculation {
  id: string;
  name: string;
  timestamp: number;
  loanType: 'KPR' | 'KKB';
  kprData?: KPRInput;
  kkbData?: KKBInput;
}

interface HistoryPanelProps {
  history: SavedCalculation[];
  onLoad: (calc: SavedCalculation) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onSaveCurrent: (name: string) => void;
  currentCalculatedDetails: {
    title: string;
    description: string;
    amount: number;
  };
  darkMode: boolean;
}

export default function HistoryPanel({
  history,
  onLoad,
  onDelete,
  onRename,
  onSaveCurrent,
  currentCalculatedDetails,
  darkMode,
}: HistoryPanelProps) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    onSaveCurrent(saveName.trim());
    setSaveName('');
    setIsSaveModalOpen(false);
  };

  const handleRenameSubmit = (id: string) => {
    if (!editName.trim()) return;
    onRename(id, editName.trim());
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className={`rounded-2xl p-6 ${darkMode ? 'glass' : 'glass-light shadow-sm'}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bookmark className={`w-5 h-5 ${darkMode ? 'text-primary' : 'text-primary'}`} />
          <span>Riwayat Kalkulasi</span>
        </h2>
        <button
          onClick={() => {
            // Suggest default name based on active calculation details
            setSaveName(currentCalculatedDetails.title);
            setIsSaveModalOpen(true);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            darkMode
              ? 'bg-primary hover:bg-primary/80 text-white shadow-glow-primary'
              : 'bg-primary hover:bg-primary/80 text-white shadow-sm'
          }`}
        >
          Simpan Kalkulasi
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Belum ada kalkulasi yang disimpan. Coba simpan kalkulasi aktif Anda!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {history.map((item) => {
            const isEditing = editingId === item.id;
            const isConfirmingDelete = confirmDeleteId === item.id;
            const assetPrice = item.loanType === 'KPR' ? item.kprData?.assetPrice : item.kkbData?.assetPrice;
            const tenor = item.loanType === 'KPR' ? item.kprData?.tenorYears : item.kkbData?.tenorYears;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  darkMode
                    ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`flex-1 px-3 py-1 text-sm rounded border focus:outline-none ${
                        darkMode
                          ? 'bg-slate-950 border-slate-800 text-white focus:border-primary'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-primary'
                      }`}
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameSubmit(item.id)}
                      className="p-1.5 rounded hover:bg-primary hover:text-white transition-colors cursor-pointer text-primary"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : isConfirmingDelete ? (
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="font-semibold text-rose-500">Yakin ingin menghapus?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onDelete(item.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-500 text-white hover:bg-rose-600 transition-colors font-medium cursor-pointer"
                      >
                        Hapus
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                          darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onLoad(item)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            item.loanType === 'KPR'
                              ? darkMode
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-primary/10 text-primary'
                              : darkMode
                              ? 'bg-secondary/15 text-secondary border border-secondary/20'
                              : 'bg-secondary/10 text-secondary'
                          }`}
                        >
                          {item.loanType}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <h3 className={`font-semibold text-sm mt-1.5 line-clamp-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {item.name}
                      </h3>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Plafond: {formatIDR(assetPrice || 0)} • Tenor: {tenor} Tahun
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditName(item.name);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onLoad(item)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          darkMode ? 'text-primary hover:bg-primary/10' : 'text-primary hover:bg-primary/5'
                        }`}
                        title="Load"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save Modal dialog */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Simpan Kalkulasi Ini</h3>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nama Kalkulasi
                </label>
                <input
                  type="text"
                  required
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g., KPR Rumah Bintaro, KKB Honda HR-V"
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 text-white focus:ring-primary focus:border-transparent'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-primary focus:border-transparent'
                  }`}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    darkMode
                      ? 'bg-primary hover:bg-primary/80 text-white shadow-glow-primary'
                      : 'bg-primary hover:bg-primary/80 text-white'
                  }`}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
