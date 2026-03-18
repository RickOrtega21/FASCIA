import React, { useState, useEffect } from 'react';
import './ReportsHistory.css';
import { supabase } from '../supabaseClient';

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

    return (
        <div className="history-container">
            <h1 className="history-title">Repositorio de Informes SCI</h1>

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
