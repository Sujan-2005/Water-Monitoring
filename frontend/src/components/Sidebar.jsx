import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Activity,
  LineChart,
  Cpu,
  BellRing,
  FlaskConical,
  Sliders,
  HeartPulse,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Droplet,
  LogOut,
  User
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { systemStatus, simulatorStatus } = useApp();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Live Monitoring', path: '/live', icon: Activity },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Devices', path: '/devices', icon: Cpu },
    { name: 'Alert History', path: '/alerts', icon: BellRing },
    { name: 'Test Scenarios', path: '/scenarios', icon: FlaskConical },
    { name: 'Thresholds', path: '/thresholds', icon: Sliders },
    { name: 'Sensor Health', path: '/health', icon: HeartPulse },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  const getSystemStatusColor = (val) => {
    if (val === 'ONLINE' || val === 'CONNECTED' || val === 'RECEIVING' || val === 'RUNNING') return 'bg-emerald-500';
    if (val === 'PAUSED' || val === 'WARNING' || val === 'STANDBY') return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <aside
      className={`sidebar-glass bg-navy-900 border-r border-navy-800 text-navy-200 transition-all duration-300 flex flex-col h-screen sticky top-0 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-navy-800/60">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-2 rounded-lg bg-aqua-500/20 text-aqua-400 flex-shrink-0 animate-pulse">
            <Droplet className="w-5 h-5 fill-current" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg tracking-wide text-white whitespace-nowrap">
              Hydro<span className="text-aqua-400 font-normal">Monitor</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-navy-800 text-navy-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-4 select-none">
        {/* Nav Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm ${
                  isActive
                    ? 'bg-aqua-600 text-white font-medium shadow-md shadow-aqua-600/10'
                    : 'hover:bg-navy-800/50 hover:text-white text-navy-400'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* System Status Indicators (Only show when expanded) */}
        {!isCollapsed && (
          <div className="mx-4 p-3.5 rounded-xl bg-navy-950/80 border border-navy-800/50 text-xs">
            <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-navy-800/40">
              <span className="font-semibold text-navy-300 uppercase tracking-wider text-[10px]">System Diagnostics</span>
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getSystemStatusColor(systemStatus.backend)}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${getSystemStatusColor(systemStatus.backend)}`}></span>
              </span>
            </div>
            <div className="space-y-1.5 text-navy-400">
              <div className="flex justify-between items-center">
                <span>Backend API</span>
                <span className="font-mono flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${getSystemStatusColor(systemStatus.backend)}`}></span>
                  {systemStatus.backend}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Database</span>
                <span className="font-mono flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${getSystemStatusColor(systemStatus.database)}`}></span>
                  {systemStatus.database}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Telemetry</span>
                <span className="font-mono flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${getSystemStatusColor(systemStatus.telemetry)}`}></span>
                  {systemStatus.telemetry}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Simulator</span>
                <span className="font-mono flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${getSystemStatusColor(systemStatus.simulator)}`}></span>
                  {simulatorStatus.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-navy-800/60 mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-aqua-400 flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Administrator</p>
              <p className="text-xs text-navy-400 truncate">demo-operator@water.edu</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
