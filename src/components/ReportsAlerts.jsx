import React, { useState } from 'react';
import './QuarterlyAlerts.css'; // Reusing the same popover styles from QuarterlyAlerts for consistency

const REPORTS_ALERTS = [
    { days: '25 Mar', message: 'Política de Control Interno', type: 'pol' },
    { days: '01 Sep - 28 Oct', message: 'Manual de Gobierno Corporativo, Código de Conducta, Auditoría Interna, Contratación con Terceros', type: 'man' },
    { days: '25 Nov - 27 Nov', message: 'Capacitación anual de Control Interno', type: 'cap' },
    { days: '30 Dic', message: 'Informe semestral de Control Interno', type: 'inf' }
];

const ReportsAlerts = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="quarterly-alerts-wrapper">
            <button className="alerts-toggle-btn" style={{ background: '#4caf50' }} onClick={() => setIsOpen(!isOpen)}>
                🔔 Entregables de Reportes
            </button>

            {isOpen && (
                <div className="alerts-popover">
                    <div className="alerts-popover-header">
                        <h4>Calendario de Entregas</h4>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                    </div>
                    <div className="alerts-popover-body">
                        {REPORTS_ALERTS.map((alert, i) => (
                            <div key={i} className={`alert-card r-${alert.type}`}>
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

export default ReportsAlerts;
