import React from 'react';
import './TopBar.css';

const AREAS = [
    'Operaciones', 'Sistemas', 'Recursos Humanos', 'Comercial',
    'PMO y Calidad', 'Juridico', 'Finanzas', 'Suscripción Daños',
    'Indemnización Daños', 'Suscripción Personas', 'Reaseguro',
    'Indemnización Personas', 'Gobierno Corporativo', 'Auditoria'
];

const TopBar = ({ selectedArea, setSelectedArea, searchTerm, setSearchTerm }) => {
    return (
        <header className="topbar">
            <div className="search-section">
                <div className="search-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Sabueso: Buscar en la evaluación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="filter-section">
                <label htmlFor="area-select">Área de Evaluación:</label>
                <select
                    id="area-select"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="area-dropdown"
                >
                    {AREAS.map(area => (
                        <option key={area} value={area}>{area}</option>
                    ))}
                </select>
            </div>

            <div className="user-profile">
                <div className="user-info">
                    <p className="user-name">Administrador</p>
                    <p className="user-role">Control Interno</p>
                </div>
                <div className="user-avatar">AD</div>
            </div>
        </header>
    );
};

export default TopBar;
