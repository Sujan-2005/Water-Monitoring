import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Cpu, MapPin, Wifi, RefreshCw, Layers, ShieldCheck, Heart } from 'lucide-react';

const Devices = () => {
  const { devices, setSelectedDevice, selectedDevice } = useApp();
  const [activeDeviceDetail, setActiveDeviceDetail] = useState('WQM-001');

  const currentDevice = devices.find(d => d.deviceId === activeDeviceDetail);

  const getStatusColor = (status) => {
    if (status === 'ONLINE') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25';
    if (status === 'WARNING') return 'text-amber-500 bg-amber-500/10 border-amber-500/25';
    if (status === 'OFFLINE') return 'text-gray-500 bg-gray-500/10 border-gray-500/25';
    return 'text-red-500 bg-red-500/10 border-red-500/25';
  };

  const selectForDashboard = (devId) => {
    setSelectedDevice(devId);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="flex justify-between items-center border-b border-navy-100 dark:border-navy-850 pb-4">
        <div>
          <h2 className="text-xl font-bold text-navy-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-5 h-5 text-aqua-400" />
            IoT Node Registry
          </h2>
          <p className="text-xs text-navy-450 dark:text-navy-550 mt-0.5">
            Monitor and manage physical on-site telemetry stations, coordinates, and firmware.
          </p>
        </div>
      </div>

      {/* Main split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table list */}
        <div className="lg:col-span-2 glass-card p-6 overflow-hidden flex flex-col justify-between min-h-[380px]">
          <div>
            <h3 className="font-semibold text-xs text-navy-850 dark:text-white uppercase tracking-wider mb-4">
              Registered Telemetry Hardware Nodes
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-navy-400 uppercase tracking-wider font-bold border-b border-navy-100 dark:border-navy-850">
                    <th className="py-2.5 px-3 font-semibold">Device ID</th>
                    <th className="py-2.5 px-3 font-semibold">Location</th>
                    <th className="py-2.5 px-3 font-semibold">Connection</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50 dark:divide-navy-850 font-medium">
                  {devices.map((device) => (
                    <tr
                      key={device.deviceId}
                      onClick={() => setActiveDeviceDetail(device.deviceId)}
                      className={`hover:bg-navy-50/50 dark:hover:bg-navy-850/50 transition-colors cursor-pointer ${
                        activeDeviceDetail === device.deviceId ? 'bg-navy-50/40 dark:bg-navy-850/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 font-bold text-navy-800 dark:text-white">
                        {device.deviceId}
                      </td>
                      <td className="py-3.5 px-3 text-navy-600 dark:text-navy-300">
                        {device.location}
                      </td>
                      <td className="py-3.5 px-3 text-navy-450 dark:text-navy-500 font-mono text-[10px]">
                        {device.connectionType} ({device.firmware})
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(device.status)}`}>
                          {device.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectForDashboard(device.deviceId);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[9px] font-bold transition-all shadow-sm border ${
                            selectedDevice === device.deviceId
                              ? 'bg-aqua-500 border-aqua-500 text-navy-950'
                              : 'bg-white hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-200'
                          }`}
                        >
                          {selectedDevice === device.deviceId ? 'Active Station' : 'Select Station'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 text-[10px] text-navy-400 bg-navy-50 dark:bg-navy-900/60 p-3.5 rounded-2xl border border-navy-100/50 dark:border-navy-800/40">
            <strong>Architecture Note:</strong> When physical hardware is deployed, ESP32 nodes report coordinates dynamically in the JSON telemetry header. This registry automatically indexes newly reporting MAC IDs.
          </div>
        </div>

        {/* Diagnostics details */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[380px]">
          {currentDevice ? (
            <div className="space-y-5">
              <div className="pb-3 border-b border-navy-100 dark:border-navy-850">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-aqua-400 uppercase tracking-wider">Hardware Diagnostics</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(currentDevice.status)}`}>
                    {currentDevice.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-navy-800 dark:text-white mt-1.5 uppercase">{currentDevice.name}</h3>
                <p className="text-[10px] text-navy-450 dark:text-navy-500 font-mono mt-0.5">Firmware version: {currentDevice.firmware}</p>
              </div>

              {/* Specs info */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-navy-450 dark:text-navy-500">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Coordinates</span>
                  <span className="font-mono">{currentDevice.latitude.toFixed(4)}, {currentDevice.longitude.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center text-navy-450 dark:text-navy-500">
                  <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /> Connection Type</span>
                  <span className="font-semibold">{currentDevice.connectionType}</span>
                </div>
                <div className="flex justify-between items-center text-navy-450 dark:text-navy-500">
                  <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Last Telemetry Tick</span>
                  <span className="font-mono text-[10px]">{new Date(currentDevice.lastSeen).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Active Sensors */}
              <div>
                <h4 className="text-[9px] font-bold text-navy-400 uppercase tracking-widest mb-2.5">Active Sensor Cluster</h4>
                <div className="space-y-2">
                  {currentDevice.sensors.map(s => {
                    const isError = s.status === 'ERROR';
                    return (
                      <div key={s.name} className="flex justify-between items-center p-2 rounded-xl bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/30 dark:border-navy-800/35">
                        <span className="text-xs font-semibold text-navy-700 dark:text-navy-300">{s.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-navy-400">({s.quality}% Qual)</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                            isError
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}>
                            {s.status}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-navy-400 flex items-center justify-center h-full">
              Select a hardware node to load diagnostics.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Devices;
