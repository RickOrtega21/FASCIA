import React, { useState, useEffect } from 'react';
import './ReportsHistory.css';
import { supabase } from '../supabaseClient';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const ReportsHistory = () => {
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        // Supabase query to get reports history
        const { data, error } = await supabase
            .from('reports_history')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reports:', error);
            // Si la base de datos no está conectada o la tabla no existe, mostramos datos vacíos
            setReports([]);
        } else {
            setReports(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReports();

        // Subscribe to NEW reports in the history
        const channel = supabase
            .channel('reports_realtime_sync')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reports_history'
                },
                () => {
                    // Refresh the report list when a new one is added
                    fetchReports();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredReports = reports.filter(report =>
        (report.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.period || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const downloadPdf = (base64Data, filename) => {
        if (!base64Data) {
            alert('El archivo PDF completo no se encuentra disponible para este reporte anterior.');
            return;
        }
        const link = document.createElement("a");
        link.href = base64Data;
        link.download = filename || 'Reporte_Institucional.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Chart data: chronological order, ascending
    const chartData = [...reports]
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(r => ({
            fecha: new Date(r.created_at).toLocaleDateString('es-MX'),
            calificacion: r.score
        }));

    return (
        <div className="history-container">
            <h1 className="history-title">Repositorio de Informes SCI</h1>

    {chartData.length > 0 && (() => {
                const lastPoint = chartData[chartData.length - 1];
                return (
                <div className="history-chart-container">
                    <h2 className="history-chart-title">Evolución de la Calificación por Periodo</h2>
                    <ResponsiveContainer width="100%" height={120}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2e7bbd" stopOpacity={0.55} />
                                    <stop offset="100%" stopColor="#5aaee8" stopOpacity={0.08} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 0" stroke="rgba(46,123,189,0.12)" vertical={false} />
                            <XAxis
                                dataKey="fecha"
                                tick={{ fill: '#2a5a8a', fontSize: 10 }}
                                axisLine={{ stroke: '#4a8bbf', strokeWidth: 1 }}
                                tickLine={false}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tick={{ fill: '#2a5a8a', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                width={30}
                            />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#e8f4fd', border: '1px solid #2e7bbd', borderRadius: '8px', color: '#1a3a5c', boxShadow: '0 2px 8px rgba(46,123,189,0.2)' }}
                                labelStyle={{ color: '#1a5a8a', fontWeight: 'bold', fontSize: '0.85rem' }}
                                formatter={(value) => [`${value}/100`, 'Calificación']}
                            />
                            {lastPoint && (
                                <ReferenceLine
                                    x={lastPoint.fecha}
                                    stroke="#2e7bbd"
                                    strokeDasharray="5 4"
                                    strokeWidth={1.5}
                                />
                            )}
                            <Area
                                type="monotoneX"
                                dataKey="calificacion"
                                stroke="#2e7bbd"
                                strokeWidth={2}
                                fill="url(#blueGrad)"
                                dot={(props) => {
                                    const { cx, cy, index } = props;
                                    const isLast = index === chartData.length - 1;
                                    return isLast ? (
                                        <g key={`dot-last-${index}`}>
                                            <circle cx={cx} cy={cy} r={10} fill="#1a4a7a" />
                                            <circle cx={cx} cy={cy} r={7} fill="#d0eaf8" />
                                            <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="#1a4a7a" fontWeight="bold">{chartData.length}</text>
                                        </g>
                                    ) : (
                                        <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill="#e8f4fd" stroke="#2e7bbd" strokeWidth={2} />
                                    );
                                }}
                                activeDot={{ r: 6, fill: '#2e7bbd', stroke: '#fff', strokeWidth: 2 }}
                                animationDuration={900}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                );
            })()}

            <div className="history-toolbar">
                <div className="history-search">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar informe por título o periodo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="history-refresh-btn" onClick={fetchReports}>
                    🔄 Actualizar
                </button>
            </div>

            {loading ? (
                <div className="history-loading">Cargando informes...</div>
            ) : filteredReports.length > 0 ? (
                <div className="history-table-container">
                    <table className="history-styled-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Periodo</th>
                                <th>Nombre</th>
                                <th style={{ textAlign: 'center' }}>Calificación</th>
                                <th style={{ textAlign: 'center' }}>Archivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map(report => (
                                <tr key={report.id}>
                                    <td>{new Date(report.created_at).toLocaleDateString('es-MX')}</td>
                                    <td>{report.period}</td>
                                    <td>
                                        <strong>{report.title}</strong><br/>
                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>Evaluador: {report.evaluator_name || 'Admin'}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`history-score ${report.score >= 80 ? 'good' : report.score >= 50 ? 'warning' : 'danger'}`}>
                                            {report.score}/100
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            className={`history-download-btn ${report.pdf_base64 ? '' : 'disabled'}`}
                                            onClick={() => downloadPdf(report.pdf_base64, `${report.title.replace(/ /g, '_')}.pdf`)}
                                        >
                                            📄 Descargar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="history-empty">
                    <p>No se encontraron informes guardados en el repositorio.</p>
                </div>
            )}
        </div>
    );
};

export default ReportsHistory;
