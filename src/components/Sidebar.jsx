import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [controlExpanded, setControlExpanded] = useState(true);
  const [calidadExpanded, setCalidadExpanded] = useState(false);
  const [rankingExpanded, setRankingExpanded] = useState(false);

  const menuItems = [
    {
      id: 'control',
      label: 'CONTROL',
      icon: '📊',
      subItems: [
        { id: 'fepyc', label: 'FEPYC' },
        { id: 'eri', label: 'ERI' },
        { id: 'ieg', label: 'IEG' },
        { id: 'historial', label: 'Historial' }
      ]
    },
    {
      id: 'calidad',
      label: 'CALIDAD',
      icon: '✨',
      subItems: [
        { id: 'calidad_dev', label: 'En desarrollo...' }
      ]
    },
    {
      id: 'ranking_group',
      label: 'RANKING',
      icon: '🏆',
      subItems: [
        { id: 'ranking_general', label: 'Vista General' },
        { id: 'ranking_perfil', label: 'Perfil Personal' },
        { id: 'ranking_stats', label: 'Dashboard' },
        { id: 'ranking_config', label: 'Ajustes' }
      ]
    },
    { id: 'calendarios', label: 'Calendarios', icon: '📅' },
  ];

  const handleItemClick = (item) => {
    if (item.subItems) {
      if (item.id === 'control') setControlExpanded(!controlExpanded);
      if (item.id === 'calidad') setCalidadExpanded(!calidadExpanded);
      if (item.id === 'ranking_group') setRankingExpanded(!rankingExpanded);
    } else {
      setActiveTab(item.id);
    }
  };

  const isControlActive = ['fepyc', 'eri', 'ieg', 'historial'].includes(activeTab);
  const isCalidadActive = ['calidad_dev'].includes(activeTab);
  const isRankingActive = ['ranking_general', 'ranking_perfil', 'ranking_stats', 'ranking_config'].includes(activeTab);

  const getExpanded = (id) => {
    if (id === 'control') return controlExpanded;
    if (id === 'calidad') return calidadExpanded;
    if (id === 'ranking_group') return rankingExpanded;
    return false;
  };

  const getIsActive = (id) => {
    if (id === 'control') return isControlActive;
    if (id === 'calidad') return isCalidadActive;
    if (id === 'ranking_group') return isRankingActive;
    return activeTab === id;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">✨</span>
          <div className="logo-text">
            <h2>FASCIA</h2>
            <p className="logo-subtitle">Fabuloso Asistente del Sistema de Control Interno y sus Alcances</p>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div key={item.id} className="nav-item-group">
            <button
              className={`nav-item ${getIsActive(item.id) ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.subItems && (
                <span className={`dropdown-arrow ${getExpanded(item.id) ? 'open' : ''}`}>▼</span>
              )}
            </button>
            {item.subItems && getExpanded(item.id) && (
              <div className="sub-nav-list">
                {item.subItems.map(sub => (
                  <button
                    key={sub.id}
                    className={`sub-nav-item ${activeTab === sub.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(sub.id)}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>© 2026 FASCIA</p>
      </div>
    </aside>
  );
};

export default Sidebar;
