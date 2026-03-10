import React, { useState } from 'react';
import './QuarterlyAlerts.css';

const QUARTERLY_ALERTS = [
    { days: 'Días 1-2', message: 'Entrega a CI de informes por parte de RCA', type: 'entr' },
    { days: 'Días 2-10', message: 'Evaluación del SCI en el área', type: 'eval' },
    { days: 'Días 11-12', message: 'Análisis de los resultados del SCI', type: 'anal' },
    { days: 'Días 12-13', message: 'Reunión de los EMCOR', type: 'reun' }
];

const QuarterlyAlerts = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="quarterly-alerts-wrapper">
            <button className="alerts-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                🔔 Alertas del Trimestre
            </button>

            {isOpen && (
                <div className="alerts-popover">
                    <div className="alerts-popover-header">
                        <h4>Actividades por Día Hábil</h4>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                    </div>
                    <div className="alerts-popover-body">
                        {QUARTERLY_ALERTS.map((alert, i) => (
                            <div key={i} className={`alert-card q-${alert.type}`}>
                                <div className="alert-dates">{alert.days}</div>
                                <div className="alert-msg">{alert.message}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuarterlyAlerts;
