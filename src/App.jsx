import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MonicaTool from './components/MonicaTool';
import ERITool from './components/ERITool';
import IEGTool from './components/IEGTool';
import CalendarView from './components/CalendarView';
import ReportsHistory from './components/ReportsHistory';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('fepyc');
  const [selectedArea, setSelectedArea] = useState('Operaciones');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className={`main-content ${activeTab === 'calendarios' ? 'has-right-sidebar' : ''}`}>
        <TopBar
          selectedArea={selectedArea}
          setSelectedArea={setSelectedArea}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <div className="content-wrapper">
          {activeTab === 'fepyc' && (
            <MonicaTool area={selectedArea} searchTerm={searchTerm} />
          )}

          {activeTab === 'eri' && (
            <ERITool />
          )}

          {activeTab === 'ieg' && (
            <IEGTool />
          )}

          {activeTab === 'calendarios' && (
            <CalendarView />
          )}

          {activeTab === 'historial' && (
            <ReportsHistory />
          )}

          {!['fepyc', 'eri', 'ieg', 'calendarios', 'historial'].includes(activeTab) && (
            <div className="placeholder-view">
              <h2>Módulo en Desarrollo</h2>
              <p>Esta función estará disponible próximamente.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
