import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [monicaExpanded, setMonicaExpanded] = useState(true);

  const menuItems = [
    {
      id: 'monica',
      label: 'MONICA',
      icon: '📊',
      subItems: [
        { id: 'fepyc', label: 'FEPYC' },
        { id: 'eri', label: 'ERI' },
        { id: 'ieg', label: 'IEG' }
      ]
    },
    { id: 'calendarios', label: 'Calendarios', icon: '📅' },
    { id: 'historial', label: 'Historial', icon: '📂' },
  ];

  const handleItemClick = (item) => {
    if (item.subItems) {
      setMonicaExpanded(!monicaExpanded);
    } else {
      setActiveTab(item.id);
    }
  };

  const isMonicaActive = ['fepyc', 'eri', 'ieg'].includes(activeTab);

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
              className={`nav-item ${item.id === 'monica' && isMonicaActive ? 'active' : ''} ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.subItems && (
                <span className={`dropdown-arrow ${monicaExpanded ? 'open' : ''}`}>▼</span>
              )}
            </button>
            {item.subItems && monicaExpanded && (
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
