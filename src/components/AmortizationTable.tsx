import { useState } from 'react';
import { ChevronDown, ChevronUp, Download, Eye, EyeOff, FileText, FileSpreadsheet } from 'lucide-react';
import type { AmortizationRow } from '../utils/calculations';
import { formatIDR, formatPercent } from '../utils/formatters';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  darkMode: boolean;
}

export default function AmortizationTable({ schedule, darkMode }: AmortizationTableProps) {
  const [expandedYears, setExpandedYears] = useState<{ [key: number]: boolean }>({ 1: true }); // Expand Year 1 by default
  
  if (schedule.length === 0) return null;

  // Group rows by year
  const yearlyData: { [key: number]: AmortizationRow[] } = {};
  schedule.forEach((row) => {
    if (!yearlyData[row.year]) {
      yearlyData[row.year] = [];
    }
    yearlyData[row.year].push(row);
  });

  const years = Object.keys(yearlyData).map(Number).sort((a, b) => a - b);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const expandAll = () => {
    const allExpanded: { [key: number]: boolean } = {};
    years.forEach((y) => {
      allExpanded[y] = true;
    });
    setExpandedYears(allExpanded);
  };

  const collapseAll = () => {
    setExpandedYears({});
  };

  // CSV Exporter
  const exportToCSV = () => {
    const headers = [
      'Bulan',
      'Tahun',
      'Bulan Ke- (di Tahun)',
      'Suku Bunga (%)',
      'Saldo Awal (IDR)',
      'Angsuran Bulanan (IDR)',
      'Angsuran Pokok (IDR)',
      'Angsuran Bunga (IDR)',
      'Saldo Akhir (IDR)',
    ];

    const rows = schedule.map((r) => [
      r.month,
      r.year,
      r.monthInYear,
      r.rate.toFixed(2),
      Math.round(r.beginningBalance),
      Math.round(r.installment),
      Math.round(r.principalPayment),
      Math.round(r.interestPayment),
      Math.round(r.endingBalance),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lixionary_amortization_schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Exporter (.xlsx)
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const totalPrincipal = schedule[0].beginningBalance;
    const totalInterest = schedule.reduce((sum, r) => sum + r.interestPayment, 0);

    const headerInfo = [
      ['Tabel Amortisasi Pinjaman - Lixionary'],
      [`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`],
      [],
      ['Ringkasan Kredit'],
      ['Plafond / Pokok', totalPrincipal],
      ['Total Bunga Dibayar', Math.round(totalInterest)],
      ['Total Biaya Kepemilikan', Math.round(totalPrincipal + totalInterest)],
      ['Tenor (Bulan)', schedule.length],
      [],
      ['Tabel Amortisasi Detail'],
      ['Bulan', 'Tahun', 'Bulan Ke- (di Tahun)', 'Suku Bunga (%)', 'Saldo Awal (IDR)', 'Angsuran Bulanan (IDR)', 'Angsuran Pokok (IDR)', 'Angsuran Bunga (IDR)', 'Saldo Akhir (IDR)']
    ];

    const dataRows = schedule.map(r => [
      r.month,
      r.year,
      r.monthInYear,
      r.rate,
      Math.round(r.beginningBalance),
      Math.round(r.installment),
      Math.round(r.principalPayment),
      Math.round(r.interestPayment),
      Math.round(r.endingBalance)
    ]);

    const finalSheetData = [...headerInfo, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(finalSheetData);

    ws['!cols'] = [
      { wch: 10 }, // Bulan
      { wch: 10 }, // Tahun
      { wch: 15 }, // Bulan ke-
      { wch: 15 }, // Suku Bunga
      { wch: 20 }, // Saldo Awal
      { wch: 20 }, // Angsuran
      { wch: 20 }, // Pokok
      { wch: 20 }, // Bunga
      { wch: 20 }  // Saldo Akhir
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Amortisasi');
    XLSX.writeFile(wb, 'lixionary_amortization_schedule.xlsx');
  };

  // PDF Exporter (.pdf)
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(63, 81, 181); // Material Indigo
    doc.text('Tabel Amortisasi Pinjaman (Lixionary)', 14, 20);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 26);

    const firstRow = schedule[0];
    const totalPrincipal = firstRow.beginningBalance;
    const totalInterest = schedule.reduce((sum, r) => sum + r.interestPayment, 0);
    const totalPayments = totalPrincipal + totalInterest;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Ringkasan Kredit:', 14, 35);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`• Pokok Pinjaman (Plafond): ${formatIDR(totalPrincipal)}`, 14, 41);
    doc.text(`• Total Bunga Dibayar: ${formatIDR(totalInterest)}`, 14, 46);
    doc.text(`• Total Pembayaran: ${formatIDR(totalPayments)}`, 14, 51);
    doc.text(`• Tenor Pinjaman: ${schedule.length} Bulan (${Math.round(schedule.length / 12)} Tahun)`, 14, 56);

    const tableHeaders = [
      ['Bulan', 'Bunga (%)', 'Saldo Awal', 'Cicilan', 'Bayar Pokok', 'Bayar Bunga', 'Saldo Akhir']
    ];

    const tableData = schedule.map(r => [
      r.month.toString(),
      `${r.rate.toFixed(2)}%`,
      formatIDR(r.beginningBalance),
      formatIDR(r.installment),
      formatIDR(r.principalPayment),
      formatIDR(r.interestPayment),
      formatIDR(r.endingBalance)
    ]);

    autoTable(doc, {
      startY: 62,
      head: tableHeaders,
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [63, 81, 181], // Material Indigo
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      },
      margin: { top: 15, left: 14, right: 14, bottom: 15 }
    });

    doc.save('lixionary_amortization_schedule.pdf');
  };

  return (
    <div className="space-y-4">
      {/* Table Header / Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Tabel Amortisasi</h2>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Detail cicilan dan saldo outstanding dari bulan ke bulan.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={expandAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Buka Semua
          </button>
          <button
            onClick={collapseAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            Tutup Semua
          </button>
          <button
            onClick={exportToCSV}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={exportToExcel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              darkMode
              ? 'bg-primary hover:bg-primary/80 text-white shadow-glow-primary'
              : 'bg-primary hover:bg-primary/80 text-white shadow-sm'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel (XLSX)
          </button>
          <button
            onClick={exportToPDF}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              darkMode
              ? 'bg-secondary hover:bg-secondary/80 text-white shadow-glow-secondary'
              : 'bg-secondary hover:bg-secondary/80 text-white shadow-sm'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {years.map((year) => {
          const yearRows = yearlyData[year];
          const isExpanded = !!expandedYears[year];
          
          // Calculate annual aggregates
          const annualPrincipalPaid = yearRows.reduce((sum, r) => sum + r.principalPayment, 0);
          const annualInterestPaid = yearRows.reduce((sum, r) => sum + r.interestPayment, 0);
          const averageRate = yearRows.reduce((sum, r) => sum + r.rate, 0) / yearRows.length;
          const endingBalanceOfYear = yearRows[yearRows.length - 1].endingBalance;

          return (
            <div
              key={year}
              className={`rounded-xl border overflow-hidden transition-all ${
                darkMode ? 'border-slate-800/80 bg-slate-900/10' : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {/* Year Accordion Header */}
              <button
                onClick={() => toggleYear(year)}
                className={`w-full flex flex-col md:flex-row md:items-center justify-between p-4 text-left gap-3 hover:bg-slate-500/5 transition-colors cursor-pointer focus:outline-none`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Tahun {year}</h3>
                    <p className={`text-[10px] uppercase font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Bulan {yearRows[0].month} - {yearRows[yearRows.length - 1].month}
                    </p>
                  </div>
                </div>

                {/* Annual Highlights Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 max-w-3xl ml-0 md:ml-6 mt-2 md:mt-0 text-xs">
                  <div>
                    <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Bunga Rata-Rata:</span>
                    <p className="font-semibold">{formatPercent(averageRate, 2)}</p>
                  </div>
                  <div>
                    <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Total Pokok Tahunan:</span>
                    <p className="font-semibold text-secondary">+{formatIDR(annualPrincipalPaid)}</p>
                  </div>
                  <div>
                    <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Total Bunga Tahunan:</span>
                    <p className="font-semibold text-amber-500">-{formatIDR(annualInterestPaid)}</p>
                  </div>
                  <div>
                    <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>Saldo Sisa:</span>
                    <p className="font-semibold">{formatIDR(endingBalanceOfYear)}</p>
                  </div>
                </div>
              </button>

              {/* Year Accordion Content */}
              {isExpanded && (
                <div className="border-t border-slate-200/5 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <th className="p-3 font-semibold text-center w-16">Bulan</th>
                        <th className="p-3 font-semibold">Bunga (%)</th>
                        <th className="p-3 font-semibold text-secondary">Saldo Awal</th>
                        <th className="p-3 font-semibold">Angsuran (Cicilan)</th>
                        <th className="p-3 font-semibold text-secondary">Bayar Pokok</th>
                        <th className="p-3 font-semibold text-amber-500">Bayar Bunga</th>
                        <th className="p-3 font-semibold">Saldo Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/5">
                      {yearRows.map((row) => (
                        <tr
                          key={row.month}
                          className={`hover:bg-slate-500/5 transition-colors ${
                            darkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          <td className="p-3 text-center font-bold">{row.month}</td>
                          <td className="p-3 font-semibold">{formatPercent(row.rate, 2)}</td>
                          <td className="p-3">{formatIDR(row.beginningBalance, true)}</td>
                          <td className="p-3 font-bold">{formatIDR(row.installment, true)}</td>
                          <td className="p-3 text-secondary font-semibold">
                            {formatIDR(row.principalPayment, true)}
                          </td>
                          <td className="p-3 text-amber-500 font-semibold">
                            {formatIDR(row.interestPayment, true)}
                          </td>
                          <td className="p-3 font-semibold">{formatIDR(row.endingBalance, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
