import React, { useState } from 'react';
import CalendarAlerts from './CalendarAlerts';
import QuarterlySchedule from './QuarterlySchedule';
import ReportsAlerts from './ReportsAlerts';
import './CalendarView.css';

const MONTHS = [
    { name: 'JANUARY', days: 31 }, { name: 'FEBRUARY', days: 28 }, { name: 'MARCH', days: 31 },
    { name: 'APRIL', days: 30 }, { name: 'MAY', days: 31 }, { name: 'JUNE', days: 30 },
    { name: 'JULY', days: 31 }, { name: 'AUGUST', days: 31 }, { name: 'SEPTEMBER', days: 30 },
    { name: 'OCTOBER', days: 31 }, { name: 'NOVEMBER', days: 30 }, { name: 'DECEMBER', days: 31 }
];

const getHighlightClass = (type, monthIdx, day) => {
    if (type === 'sci-anual') {
        if (monthIdx === 0) {
            if (day >= 1 && day <= 16) return 'highlight-blue';
            if (day >= 19 && day <= 20) return 'highlight-red';
        }
        if (monthIdx === 2 && day >= 16 && day <= 31) return 'highlight-green';
        if (monthIdx === 3 && day >= 1 && day <= 17) return 'highlight-red';
        if (monthIdx === 5 && day >= 15 && day <= 30) return 'highlight-green';
        if (monthIdx === 6) {
            if (day >= 1 && day <= 17) return 'highlight-blue';
            if (day >= 20 && day <= 21) return 'highlight-red';
        }
        if (monthIdx === 8 && day >= 14 && day <= 30) return 'highlight-green';
        if (monthIdx === 9 && day >= 1 && day <= 16) return 'highlight-red';
        if (monthIdx === 11 && day >= 14 && day <= 31) return 'highlight-green';
    } else if (type === 'reportes') {
        if (monthIdx === 2 && day === 25) return 'highlight-red-pol'; // Mar 25
        if (monthIdx >= 8 && monthIdx <= 9) { // Sep 1 - Oct 28
            if (monthIdx === 8) return 'highlight-org-man';
            if (monthIdx === 9 && day <= 28) return 'highlight-org-man';
        }
        if (monthIdx === 10 && day >= 25 && day <= 27) return 'highlight-purp-cap'; // Nov 25-27
        if (monthIdx === 11 && day === 30) return 'highlight-blue-inf'; // Dec 30
    }
    return '';
};

const generateCalendarData = (type) => {
    let currentDayOfWeek = 4; // Jan 1, 2026 is Thursday
    return MONTHS.map((m, idx) => {
        const daysArr = [];
        for (let i = 0; i < currentDayOfWeek; i++) daysArr.push(null);

        for (let d = 1; d <= m.days; d++) {
            const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6;
            daysArr.push({
                day: d,
                highlight: !isWeekend ? getHighlightClass(type, idx, d) : '',
                isWeekend
            });
            currentDayOfWeek = (currentDayOfWeek + 1) % 7;
        }
        return { ...m, daysArr };
    });
};


const CalendarView = () => {
    const [selectedCalendar, setSelectedCalendar] = useState('sci-anual');
    const calendarData = generateCalendarData(selectedCalendar);

    return (
        <div className="calendar-view-container">
            <div className="calendar-header-section">
                <h1>Calendarios</h1>
                <div className="calendar-selector">
                    <label>Seleccionar Calendario:</label>
                    <select
                        value={selectedCalendar}
                        onChange={(e) => setSelectedCalendar(e.target.value)}
                        className="calendar-dropdown"
                    >
                        <option value="sci-anual">SCI anual</option>
                        <option value="trimestral">Cronograma Trimestral</option>
                        <option value="otros">Próximamente...</option>
                    </select>
                </div>
            </div>

            <div className="calendar-display">
                {selectedCalendar === 'sci-anual' ? (
                    <div className="calendar-card">
                        <div className="quarterly-header" style={{ padding: '0 0 1.5rem 0', borderBottom: 'none', textAlign: 'center' }}>
                            <h2 className="q-main-title" style={{ fontSize: '2.5rem' }}>
                                {selectedCalendar === 'sci-anual' ? 'Calendario SCI' : 'Reportes y documentos'}
                            </h2>
                        </div>
                        <div className="dynamic-calendar-grid">
                            {calendarData.map((month, mIdx) => (
                                <div key={mIdx} className="calendar-month">
                                    <h3 className="month-title">{month.name}</h3>
                                    <div className="weekdays-row">
                                        <span>SUN</span><span>MON</span><span>TUE</span>
                                        <span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
                                    </div>
                                    <div className="days-grid">
                                        {month.daysArr.map((dayObj, dIdx) => (
                                            <div
                                                key={dIdx}
                                                className={`day-cell ${dayObj ? 'active' : 'empty'} ${dayObj?.isWeekend ? 'weekend' : ''} ${dayObj?.highlight || ''}`}
                                            >
                                                {dayObj ? dayObj.day : ''}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedCalendar === 'sci-anual' ? (
                            <div className="calendar-legend-container">
                                <div className="legend-item">
                                    <span className="legend-box semestral"></span>
                                    <span className="legend-label">Informe semestral</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-box evaluacion"></span>
                                    <span className="legend-label">Evaluación del SCI</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-box cierres"></span>
                                    <span className="legend-label">Cierres trimestral</span>
                                </div>
                            </div>
                        ) : (
                            <div className="calendar-legend-container">
                                <div className="legend-item">
                                    <span className="legend-box pol"></span>
                                    <span className="legend-label">Política de Control Interno</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-box man"></span>
                                    <span className="legend-label">Manuales y Código</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-box cap"></span>
                                    <span className="legend-label">Capacitación</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-box inf"></span>
                                    <span className="legend-label">Informe semestral</span>
                                </div>
                            </div>
                        )}

                        <div className="calendar-footer">
                            <p>Propuesta de Calendario - Latino Seguros 2026</p>
                            {selectedCalendar === 'sci-anual' ? <CalendarAlerts /> : <ReportsAlerts />}
                        </div>
                    </div>

                ) : selectedCalendar === 'trimestral' ? (
                    <QuarterlySchedule />
                ) : (
                    <div className="calendar-placeholder">
                        <p>Seleccione un calendario para visualizarlo.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarView;
