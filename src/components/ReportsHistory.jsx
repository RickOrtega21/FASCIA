import React, { useState, useEffect } from 'react';
import './ReportsHistory.css';
import { supabase } from '../supabaseClient';

const ReportsHistory = () => {
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

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

    const filteredReports = reports.filter(report =>
        (report.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.period || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <div className="history-grid">
                    {filteredReports.map(report => (
                        <div key={report.id} className="history-card">
                            <div className="history-card-header">
                                <h3>{report.title}</h3>
                                <span className={`history-score ${report.score >= 80 ? 'good' : report.score >= 50 ? 'warning' : 'danger'}`}>
                                    {report.score}/100
                                </span>
                            </div>
                            <div className="history-card-body">
                                <p><strong>Evaluador:</strong> {report.evaluator_name || 'Admin'}</p>
                                <p><strong>Periodo:</strong> {report.period}</p>
                                <p><strong>Fecha:</strong> {new Date(report.created_at).toLocaleDateString('es-MX')}</p>
                            </div>
                            <div className="history-card-footer">
                                <button className="history-view-btn">Ver Detalle</button>
                            </div>
                        </div>
                    ))}
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
