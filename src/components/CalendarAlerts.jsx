import React, { useState } from 'react';
import './CalendarAlerts.css';

const ALERTS_DATA = [
    { dates: 'Enero 01-15', message: 'Informe semestral', type: 'info' },
    { dates: 'Enero 01-30', message: 'Cierre Anual', type: 'urgent' },
    { dates: 'Marzo 15-30', message: 'Evaluación del SCI', type: 'eval' },
    { dates: 'Abril 01-30', message: 'Cierre trimestral', type: 'urgent' },
    { dates: 'Junio 15-30', message: 'Evaluación del SCI', type: 'eval' },
    { dates: 'Julio 01-15', message: 'Informe semestral', type: 'info' },
    { dates: 'Julio 01-15', message: 'Cierre trimestral', type: 'urgent' },
    { dates: 'Septiembre 15-30', message: 'Evaluación del SCI', type: 'eval' },
    { dates: 'Octubre 01-30', message: 'Cierre trimestral', type: 'urgent' },
    { dates: 'Diciembre 15-30', message: 'Evaluación del SCI', type: 'eval' }
];

const CalendarAlerts = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="calendar-alerts-wrapper">
            <button className="alerts-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                🔔 Alertas de Trabajo
            </button>

            {isOpen && (
                <div className="alerts-popover">
                    <div className="alerts-popover-header">
                        <h4>Fechas Críticas 2026</h4>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                    </div>
                    <div className="alerts-popover-body">
                        {ALERTS_DATA.map((alert, i) => (
                            <div key={i} className={`alert-card ${alert.type}`}>
                                <div className="alert-dates">{alert.dates}</div>
                                <div className="alert-msg">{alert.message}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarAlerts;
