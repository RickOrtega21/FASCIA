import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MonicaTool from './components/MonicaTool';
import ERITool from './components/ERITool';
import IEGTool from './components/IEGTool';
import CalendarView from './components/CalendarView';
import ReportsHistory from './components/ReportsHistory';
import RankingView from './components/ranking/RankingView';
import ProfileView from './components/ranking/ProfileView';
import DashboardView from './components/ranking/DashboardView';
import AjusteView from './components/ranking/AjusteView';
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
            <MonicaTool key={selectedArea} area={selectedArea} searchTerm={searchTerm} />
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

          {activeTab === 'ranking_general' && (
            <RankingView searchTerm={searchTerm} areaFilter="Todas" />
          )}

          {activeTab === 'ranking_perfil' && (
            <ProfileView searchTerm={searchTerm} />
          )}

          {activeTab === 'ranking_stats' && (
            <DashboardView />
          )}

          {activeTab === 'ranking_config' && (
            <AjusteView searchTerm={searchTerm} />
          )}

          {!['fepyc', 'eri', 'ieg', 'calendarios', 'historial', 'ranking_general', 'ranking_perfil', 'ranking_stats', 'ranking_config', 'calidad_dev'].includes(activeTab) && (
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
