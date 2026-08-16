import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import DemoControlBar from './components/DemoControlBar';

// Pages
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import Analytics from './pages/Analytics';
import Devices from './pages/Devices';
import Alerts from './pages/Alerts';
import TestScenarios from './pages/TestScenarios';
import Thresholds from './pages/Thresholds';
import SensorHealth from './pages/SensorHealth';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ParameterDetail from './pages/ParameterDetail';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Run initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden bg-navy-50 dark:bg-navy-950 text-navy-800 dark:text-navy-100 transition-colors duration-300">
          
          {/* Sidebar Navigation */}
          <div className="no-print flex-shrink-0">
            <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            
            {/* Top Status Header */}
            <div className="no-print">
              <TopHeader />
            </div>

            {/* Scrollable Viewport */}
            <main className="flex-1 overflow-y-auto p-6 pb-20 print:p-0 print:overflow-visible">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/live" element={<LiveMonitoring />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/scenarios" element={<TestScenarios />} />
                <Route path="/thresholds" element={<Thresholds />} />
                <Route path="/health" element={<SensorHealth />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/parameter/:paramCode" element={<ParameterDetail />} />
              </Routes>
            </main>

            {/* Presentation controls dock */}
            <DemoControlBar />

          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
