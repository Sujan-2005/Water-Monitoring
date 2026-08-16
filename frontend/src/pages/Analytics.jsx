import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie } from 'recharts';
import { LineChart, Line } from 'recharts';
import { Calendar, Cpu, Sliders, TrendingUp, AlertOctagon, BarChart2 } from 'lucide-react';

const Analytics = () => {
  const { selectedDevice, devices } = useApp();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scatterX, setScatterX] = useState('temperature');
  const [scatterY, setScatterY] = useState('ph');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/analytics/${selectedDevice === 'ALL' ? 'WQM-001' : selectedDevice}`);
      setAnalyticsData(res.data);
    } catch (e) {
      console.error('Error fetching analytics data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDevice]);

  if (loading || !analyticsData) {
    return (
      <div className="py-12 text-center text-navy-400">
        <p className="animate-pulse">Compiling statistical telemetry models...</p>
      </div>
    );
  }

  // Formatting pie chart data
  const pieData = [
    { name: 'Normal', value: analyticsData.timeDistribution.normal, color: '#10b981' },
    { name: 'Warning', value: analyticsData.timeDistribution.warning, color: '#f59e0b' },
    { name: 'Critical', value: analyticsData.timeDistribution.critical, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const parameters = ['ph', 'temperature', 'turbidity', 'tds', 'dissolvedOxygen'];
  
  const getParamLabel = (key) => {
    const labels = { ph: 'pH', temperature: 'Temperature', turbidity: 'Turbidity', tds: 'TDS', dissolvedOxygen: 'DO' };
    return labels[key] || key;
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-navy-100 dark:border-navy-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-aqua-400" />
            Exploratory Telemetry Analytics
          </h2>
          <p className="text-xs text-navy-450 dark:text-navy-550 mt-0.5">
            Aggregated diagnostics, parameter correlations, and operational state runtimes.
          </p>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {parameters.map(p => (
          <div key={p} className="glass-card p-5 space-y-3 font-mono">
            <h4 className="text-[10px] font-bold text-navy-450 uppercase tracking-widest border-b border-navy-100 dark:border-navy-850 pb-1.5">{getParamLabel(p)} Stats</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-navy-400">Average:</span>
                <span className="font-bold text-navy-800 dark:text-white">{analyticsData.average[p] ?? '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-400">Min / Max:</span>
                <span className="font-semibold text-navy-850 dark:text-navy-200">
                  {analyticsData.min[p] ?? '--'} / {analyticsData.max[p] ?? '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-400">Std Dev (σ):</span>
                <span className="text-navy-500">{analyticsData.stdDev[p] ?? '--'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Run state percentages Donut */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="font-semibold text-xs text-navy-850 dark:text-white uppercase tracking-wider mb-1">Runtime State Distribution</h3>
            <p className="text-[10px] text-navy-450 dark:text-navy-500 mb-4">Percentage of time device spent in normal, warning, and critical zones.</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-navy-400">No records found.</div>
            )}
            
            {/* Center score readout */}
            <div className="absolute text-center">
              <span className="text-[9px] font-bold text-navy-400 uppercase tracking-widest">Normal</span>
              <p className="text-2xl font-extrabold text-emerald-500 mt-0.5">{analyticsData.timeDistribution.normal}%</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 text-[10px] font-semibold font-mono mt-2">
            <span className="flex items-center gap-1 text-emerald-500"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Normal</span>
            <span className="flex items-center gap-1 text-amber-500"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Warning</span>
            <span className="flex items-center gap-1 text-red-500"><span className="h-2 w-2 rounded-full bg-red-500"></span> Critical</span>
          </div>
        </div>

        {/* Scatter relationship builder */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between min-h-[300px]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold text-xs text-navy-850 dark:text-white uppercase tracking-wider">Exploratory Relationship Modeler</h3>
              <p className="text-[10px] text-navy-450 dark:text-navy-500">Investigate mathematical relationships between two water quality metrics.</p>
            </div>
            
            <div className="flex gap-2 text-[10px] font-semibold">
              <select
                value={scatterX}
                onChange={(e) => setScatterX(e.target.value)}
                className="bg-navy-50 dark:bg-navy-850 border border-navy-200 dark:border-navy-750 px-2 py-1.5 rounded-lg text-navy-800 dark:text-navy-250 cursor-pointer"
              >
                {parameters.map(p => <option key={p} value={p}>X: {getParamLabel(p)}</option>)}
              </select>

              <select
                value={scatterY}
                onChange={(e) => setScatterY(e.target.value)}
                className="bg-navy-50 dark:bg-navy-850 border border-navy-200 dark:border-navy-750 px-2 py-1.5 rounded-lg text-navy-800 dark:text-navy-250 cursor-pointer"
              >
                {parameters.map(p => <option key={p} value={p}>Y: {getParamLabel(p)}</option>)}
              </select>
            </div>
          </div>

          <div className="h-44 w-full">
            <div className="h-full flex items-center justify-center text-xs text-navy-400 border border-dashed border-navy-200 dark:border-navy-850 rounded-2xl">
              Modeler active. In real deployments, this models chemical dependencies (e.g. Temperature vs Dissolved Oxygen holding capacities).
            </div>
          </div>
        </div>

      </div>

      {/* Correlation Matrix Table */}
      <div className="glass-card p-6 overflow-hidden">
        <div>
          <h3 className="font-semibold text-xs text-navy-850 dark:text-white uppercase tracking-wider mb-1">
            Parameter Correlation Matrix (Pearson Coefficient r)
          </h3>
          <p className="text-[10px] text-navy-450 dark:text-navy-500 mb-4">
            Exploratory mathematical correlations calculated dynamically from telemetry logs. Labeled as correlation, not proof of causation.
          </p>
        </div>
        
        <div className="overflow-x-auto border border-navy-100 dark:border-navy-850 rounded-2xl">
          <table className="w-full text-center text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-navy-50 dark:bg-navy-900 border-b border-navy-150 dark:border-navy-850 text-navy-400 uppercase font-semibold">
                <th className="py-3 px-4 text-left">Metric</th>
                {parameters.map(p => (
                  <th key={p} className="py-3 px-4">{getParamLabel(p)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50 dark:divide-navy-850">
              {parameters.map(pRow => (
                <tr key={pRow} className="hover:bg-navy-50/50 dark:hover:bg-navy-850/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-left text-navy-700 dark:text-navy-300">{getParamLabel(pRow)}</td>
                  {parameters.map(pCol => {
                    const corrKey = `${pRow}_${pCol}`;
                    const r = analyticsData.correlations ? analyticsData.correlations[corrKey] : 0;
                    
                    let bgCell = 'bg-transparent';
                    let textCell = 'text-navy-600 dark:text-navy-400';
                    
                    if (pRow === pCol) {
                      bgCell = 'bg-navy-100 dark:bg-navy-800';
                      textCell = 'text-navy-800 dark:text-white font-bold';
                    } else if (r > 0.5) {
                      bgCell = 'bg-emerald-500/10';
                      textCell = 'text-emerald-500 font-bold';
                    } else if (r < -0.5) {
                      bgCell = 'bg-rose-500/10';
                      textCell = 'text-rose-500 font-bold';
                    }

                    return (
                      <td key={pCol} className={`py-3 px-4 ${bgCell} ${textCell}`}>
                        {r === undefined ? '--' : r.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3.5 bg-navy-50 dark:bg-navy-900/60 p-3 rounded-xl border border-navy-100/50 dark:border-navy-800/40 text-[9px] text-navy-400 leading-normal">
          <strong>Exploratory Data Notice:</strong> Correlation values range from -1.00 (perfect negative relationship) to +1.00 (perfect positive relationship). Standard environmental parameters like Temperature vs Dissolved Oxygen show naturally negative coefficients because warmer water holds less dissolved gaseous oxygen.
        </div>
      </div>

    </div>
  );
};

export default Analytics;
