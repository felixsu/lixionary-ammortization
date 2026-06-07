import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { AmortizationRow } from '../utils/calculations';
import { formatIDR, formatCompactIDR } from '../utils/formatters';
import { BarChart3, LineChart as LineIcon } from 'lucide-react';

interface VisualizationsProps {
  schedule: AmortizationRow[];
  darkMode: boolean;
}

export default function Visualizations({ schedule, darkMode }: VisualizationsProps) {
  const [activeChart, setActiveChart] = useState<'balance' | 'composition'>('balance');

  if (schedule.length === 0) return null;

  // Aggregate monthly data to yearly for the payment composition chart
  const yearlyDataMap: {
    [key: number]: { principal: number; interest: number; endingBalance: number; rate: number };
  } = {};

  schedule.forEach((row) => {
    if (!yearlyDataMap[row.year]) {
      yearlyDataMap[row.year] = { principal: 0, interest: 0, endingBalance: 0, rate: row.rate };
    }
    yearlyDataMap[row.year].principal += row.principalPayment;
    yearlyDataMap[row.year].interest += row.interestPayment;
    yearlyDataMap[row.year].endingBalance = row.endingBalance; // tracks ending balance of the year
  });

  const yearlyData = Object.keys(yearlyDataMap).map((yr) => {
    const y = parseInt(yr);
    return {
      year: y,
      name: `Thn ${y}`,
      'Pokok (Principal)': Math.round(yearlyDataMap[y].principal),
      'Bunga (Interest)': Math.round(yearlyDataMap[y].interest),
      'Sisa Saldo': Math.round(yearlyDataMap[y].endingBalance),
    };
  });

  // Prepare detailed data for the line chart (using yearly points + start point to keep rendering extremely light and clean)
  const balanceData = [
    {
      name: 'Awal',
      label: 'Saldo Awal',
      'Sisa Pinjaman': Math.round(schedule[0].beginningBalance),
    },
    ...yearlyData.map((d) => ({
      name: d.name,
      label: `Akhir Tahun ${d.year}`,
      'Sisa Pinjaman': d['Sisa Saldo'],
    })),
  ];

  // Tooltip Formatter
  const tooltipFormatter = (value: string | number | readonly (string | number)[] | undefined) => {
    const numValue = Array.isArray(value) ? Number(value[0]) : Number(value || 0);
    return [formatIDR(numValue), ''];
  };

  const axisTickFormatter = (value: number | string) => {
    return formatCompactIDR(Number(value)).replace('Rp ', '');
  };

  const chartThemeColors = {
    grid: darkMode ? '#1e293b' : '#e2e8f0', // slate-800 / slate-200
    text: darkMode ? '#94a3b8' : '#64748b', // slate-400 / slate-500
    tooltipBg: darkMode ? '#0f172a' : '#ffffff', // slate-900 / white
    tooltipBorder: darkMode ? '#334155' : '#cbd5e1', // slate-700 / slate-300
    principal: '#00bcd4', // Material Cyan
    interest: '#ffc107', // Material Amber
    balance: '#3f51b5', // Material Indigo
    balanceGradient: 'url(#balanceGlow)',
  };

  return (
    <div className={`rounded-2xl p-6 border transition-all ${
      darkMode ? 'glass' : 'glass-light shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Visualisasi Keuangan</h2>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Analisis grafis perjalanan pelunasan pinjaman Anda.
          </p>
        </div>
        
        {/* Toggle Buttons */}
        <div className={`flex rounded-xl p-1 self-start sm:self-center border ${
          darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveChart('balance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeChart === 'balance'
                ? darkMode
                  ? 'bg-slate-900 text-primary border border-slate-800 shadow-glow-primary'
                  : 'bg-white text-primary border border-slate-200 shadow-sm'
                : darkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            Sisa Pinjaman
          </button>
          <button
            onClick={() => setActiveChart('composition')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeChart === 'composition'
                ? darkMode
                  ? 'bg-slate-900 text-secondary border border-slate-800 shadow-glow-secondary'
                  : 'bg-white text-secondary border border-slate-200 shadow-sm'
                : darkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Komposisi Angsuran
          </button>
        </div>
      </div>

      <div className="h-[320px] w-full">
        {activeChart === 'balance' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartThemeColors.balance} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartThemeColors.balance} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartThemeColors.grid} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={chartThemeColors.text}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={chartThemeColors.text}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={axisTickFormatter}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartThemeColors.tooltipBg,
                  borderColor: chartThemeColors.tooltipBorder,
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: darkMode ? '#fff' : '#000',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                formatter={tooltipFormatter}
                labelFormatter={(label) => label}
              />
              <Area
                type="monotone"
                dataKey="Sisa Pinjaman"
                stroke={chartThemeColors.balance}
                strokeWidth={3}
                fillOpacity={1}
                fill={chartThemeColors.balanceGradient}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartThemeColors.grid} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={chartThemeColors.text}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={chartThemeColors.text}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={axisTickFormatter}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartThemeColors.tooltipBg,
                  borderColor: chartThemeColors.tooltipBorder,
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: darkMode ? '#fff' : '#000',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                formatter={tooltipFormatter}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
              <Bar
                dataKey="Pokok (Principal)"
                stackId="a"
                fill={chartThemeColors.principal}
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="Bunga (Interest)"
                stackId="a"
                fill={chartThemeColors.interest}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
