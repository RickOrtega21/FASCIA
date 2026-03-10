import React from 'react';
import QuarterlyAlerts from './QuarterlyAlerts';
import './QuarterlySchedule.css';

const QuarterlySchedule = () => {
    // 17 working days for the quarter
    const days = Array.from({ length: 17 }, (_, i) => i + 1);

    return (
        <div className="calendar-card quarterly-view">
            <div className="quarterly-header">
                <h2 className="q-main-title">Cronograma Trimestral de Reuniones</h2>

                <div className="q-legend-container">
                    <div className="q-legend-item"><span className="q-box duracion"></span> Duración de trimestre</div>
                    <div className="q-legend-item"><span className="q-box evaluacion"></span> Evaluación</div>
                    <div className="q-legend-item"><span className="q-box reunion"></span> Reunión</div>
                    <div className="q-legend-item"><span className="q-box entregas"></span> Entregas</div>
                    <div className="q-legend-item"><span className="q-box analisis"></span> Análisis</div>
                </div>
            </div>

            <div className="q-gantt-wrapper">
                <div className="q-gantt-table">

                    {/* Header Row */}
                    <div className="q-row q-row-header">
                        <div className="q-activity-col header-block">
                            <span className="q-act-title">ACTIVIDAD</span>
                            <div className="q-days-text">DÍAS HÁBILES</div>
                        </div>
                        {days.map(d => (
                            <div key={d} className="q-day-num">{d}</div>
                        ))}
                    </div>

                    {/* TRIMESTRE 1 */}
                    <div className="q-row">
                        <div className="q-activity-col font-bold">TRIMESTRE 1</div>
                        <div className="q-bar bar-duracion" style={{ gridColumn: '2 / span 12' }}></div>
                    </div>

                    {/* Entregas */}
                    <div className="q-row">
                        <div className="q-activity-col">Entrega a CI de informes por parte de RCA</div>
                        <div className="q-bar bar-entr" style={{ gridColumn: '2 / span 2' }}></div>
                    </div>

                    {/* Evaluacion */}
                    <div className="q-row">
                        <div className="q-activity-col">Evaluación del SCI en el área</div>
                        <div className="q-bar bar-eval" style={{ gridColumn: '3 / span 9' }}></div>
                    </div>

                    {/* Analisis */}
                    <div className="q-row">
                        <div className="q-activity-col">Análisis de los resultados del SCI</div>
                        <div className="q-bar bar-anal" style={{ gridColumn: '12 / span 2' }}></div>
                    </div>

                    {/* Reunion */}
                    <div className="q-row">
                        <div className="q-activity-col">Reunión de los EMCOR</div>
                        <div className="q-bar bar-reun" style={{ gridColumn: '13 / span 2' }}></div>
                    </div>

                    {/* Background grid lines for days (absolute positioned) */}
                    <div className="q-grid-lines">
                        <div className="q-activity-col-spacer"></div>
                        {days.map(d => <div key={d} className="q-grid-line"></div>)}
                    </div>
                </div>
            </div>

            <div className="calendar-footer">
                <p>Propuesta de Calendario - Latino Seguros 2026</p>
                <QuarterlyAlerts />
            </div>
        </div>
    );
};

export default QuarterlySchedule;
