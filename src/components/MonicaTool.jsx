import React, { useState, useEffect } from 'react';
import './MonicaTool.css';
import questionsData from '../data/monica_questions.json';
import { supabase } from '../supabaseClient';

const MonicaTool = ({ area, searchTerm }) => {
    const [formData, setFormData] = useState({
        evaluador: '',
        evaluado: '',
        fecha: new Date().toISOString().split('T')[0],
        califActual: '',
        califAnterior: '',
        respuestas: {}
    });

    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Effect to load data when area changes
    useEffect(() => {
        let isCancelled = false;

        const loadArea = async () => {
            setIsInitialLoad(true);
            
            // 1. Prepare initial empty state for this area
            const initialState = {
                evaluador: '',
                evaluado: '',
                fecha: new Date().toISOString().split('T')[0],
                califActual: '',
                califAnterior: '',
                respuestas: {}
            };

            // 2. Clear state immediately to avoid showing data from the PREVIOUS area
            setFormData(initialState);

            try {
                // Try fetching from Supabase first
                const { data, error } = await supabase
                    .from('evaluations_state')
                    .select('data')
                    .eq('area_name', `monica_${area}`)
                    .single();

                if (isCancelled) return; // Don't apply if area changed while waiting

                if (data && data.data) {
                    setFormData(data.data);
                    localStorage.setItem(`monica_${area}`, JSON.stringify(data.data));
                } else {
                    // Fallback to local storage
                    const savedData = localStorage.getItem(`monica_${area}`);
                    if (savedData && !isCancelled) {
                        setFormData(JSON.parse(savedData));
                    }
                }
            } catch (err) {
                if (isCancelled) return;
                console.error("Error loading data:", err);
                const savedData = localStorage.getItem(`monica_${area}`);
                if (savedData) setFormData(JSON.parse(savedData));
            }

            // Small timeout to allow state to settle
            if (!isCancelled) {
                setTimeout(() => {
                    if (!isCancelled) setIsInitialLoad(false);
                }, 200);
            }
        };

        loadArea();

        return () => {
            isCancelled = true;
        };
    }, [area]);

    // Auto-save logic
    useEffect(() => {
        if (!isInitialLoad) {
            localStorage.setItem(`monica_${area}`, JSON.stringify(formData));

            // Backup to Supabase transparently
            const saveToSupabase = async () => {
                try {
                    await supabase
                        .from('evaluations_state')
                        .upsert({
                            area_name: `monica_${area}`,
                            data: formData,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'area_name' });
                } catch (e) {
                    console.error("Silent err saving to Supabase:", e);
                }
            };
            saveToSupabase();

            window.dispatchEvent(new Event('monicaDataUpdated'));
        }
    }, [formData, area, isInitialLoad]);

    const handleResponseChange = (questionId, value) => {
        setFormData(prev => ({
            ...prev,
            respuestas: {
                ...prev.respuestas,
                [questionId]: value
            }
        }));
    };

    // Multipliers for each component
    const multipliers = {
        1: 0.888,
        2: 1.333,
        3: 0.61538,
        4: 1.142857,
        5: 1.6
    };

    const getStatusColorClass = (value, isGrandTotal = false) => {
        if (isGrandTotal) {
            if (value <= 39) return 'status-red';
            if (value < 70) return 'status-yellow';
            return 'status-green';
        }
        if (value <= 8) return 'status-red';
        if (value < 15) return 'status-yellow';
        return 'status-green';
    };

    // Calculations
    const calculateTotals = () => {
        const totals = {
            siPts: 0,
            parcialPts: 0,
            noCount: 0,
            puntosFinal: 0,
            porComponente: {}
        };

        questionsData.forEach(comp => {
            let compSiPts = 0;
            let compParcialPts = 0;
            let compNoCount = 0;

            comp.questions.forEach(q => {
                const resp = formData.respuestas[q.n];
                if (resp === 'si') {
                    compSiPts += 2.5;
                } else if (resp === 'parcial') {
                    compParcialPts += 1.25;
                } else if (resp === 'no') {
                    compNoCount++;
                }
            });

            const rawTotal = compSiPts + compParcialPts;
            const weightedTotal = Math.round(rawTotal * (multipliers[comp.id] || 1));

            totals.siPts += compSiPts;
            totals.parcialPts += compParcialPts;
            totals.noCount += compNoCount;
            totals.puntosFinal += weightedTotal;

            totals.porComponente[comp.id] = {
                siPts: compSiPts,
                parcialPts: compParcialPts,
                noPts: 0, // Requirements say represent as 0 points
                total: weightedTotal,
                name: comp.shortName
            };
        });

        return totals;
    };

    const totals = calculateTotals();

    // Filter questions based on searchTerm
    const filteredData = questionsData.map(comp => ({
        ...comp,
        questions: comp.questions.filter(q =>
            q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            comp.component.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(comp => comp.questions.length > 0);

    return (
        <div className="monica-container">
            <div className="monica-header">
                <div className="header-left">
                    <h1>Formato de Evaluación de Principios y Componentes FEPYC</h1>
                    <div className="header-meta">
                        <div className="meta-row">
                            <div className="meta-item">
                                <label>Área:</label>
                                <input type="text" value={area} readOnly />
                            </div>                             <div className="meta-item">
                                <label>Evaluador:</label>
                                <input
                                    type="text"
                                    value={formData.evaluador}
                                    onChange={(e) => setFormData(p => ({ ...p, evaluador: e.target.value }))}
                                    placeholder="Nombre del evaluador"
                                />
                            </div>
                        </div>
                        <div className="meta-row">
                            <div className="meta-item">
                                <label>Fecha:</label>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData(p => ({ ...p, fecha: e.target.value }))}
                                />
                            </div>
                            <div className="meta-item">
                                <label>Evaluado:</label>
                                <input
                                    type="text"
                                    value={formData.evaluado}
                                    onChange={(e) => setFormData(p => ({ ...p, evaluado: e.target.value }))}
                                    placeholder="Nombre del evaluado"
                                />
                            </div>
                        </div>v>
                        <div className="meta-row">
                            <div className="meta-item">
                                <label>N.(NO):</label>
                                <input type="text" value={totals.noCount} readOnly className="no-counter" />
                            </div>
                            <div className="meta-item quarterly-rating">
                                <label>Calificación Trimestral:</label>
                                <div className="quarterly-inputs">
                                    <div className="q-input-group">
                                        <span>Actual</span>
                                        <input
                                            type="text"
                                            value={totals.puntosFinal}
                                            readOnly
                                        />
                                    </div>
                                     <div className="q-input-group">
                                        <span>Anterior</span>
                                        <input
                                            type="text"
                                            value={formData.califAnterior}
                                            onChange={(e) => setFormData(p => ({ ...p, califAnterior: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="resumen-panel">
                    <h3>Resumen de Principios</h3>
                    <table className="resumen-table">
                        <thead>
                            <tr>
                                <th>Componente</th>
                                <th>Si</th>
                                <th>Parcial</th>
                                <th>No</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questionsData.map(comp => {
                                const c = totals.porComponente[comp.id];
                                return (
                                    <tr key={comp.id}>
                                        <td className="comp-name">{c.name}</td>
                                        <td>{c.siPts.toFixed(1)}</td>
                                        <td>{c.parcialPts.toFixed(1)}</td>
                                        <td>{c.noPts}</td>
                                        <td className={`total-cell ${getStatusColorClass(c.total)}`}>
                                            {c.total}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="grand-total">
                                <td>CALIFICACIÓN</td>
                                <td colSpan="3">PUNTOS TOTALES:</td>
                                <td className={getStatusColorClass(totals.puntosFinal, true)}>
                                    {totals.puntosFinal}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="auto-save-indicator">
                        <span className="dot"></span> Cambios guardados automáticamente
                    </div>
                </div>
            </div>
            <div className="monica-content">
                {filteredData.map((comp) => (
                    <div key={comp.id} className="component-section">
                        <div className="component-title">
                            <h2>{comp.component}</h2>
                        </div>
                        <table className="questions-table">
                            <thead>
                                <tr>
                                    <th className="col-n">N</th>
                                    <th className="col-pregunta">Pregunta</th>
                                    <th className="col-si">Si</th>
                                    <th className="col-parcial">Si Parcial</th>
                                    <th className="col-no">No</th>
                                    <th className="col-soporte">Descripción Soporte / Mejora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comp.questions.map((q) => (
                                    <tr key={q.n}>
                                        <td>{q.n}</td>
                                        <td>{q.text}</td>
                                        <td className="center">
                                            <input
                                                type="checkbox"
                                                checked={formData.respuestas[q.n] === 'si'}
                                                onChange={() => handleResponseChange(q.n, 'si')}
                                            />
                                        </td>
                                        <td className="center">
                                            <input
                                                type="checkbox"
                                                checked={formData.respuestas[q.n] === 'parcial'}
                                                onChange={() => handleResponseChange(q.n, 'parcial')}
                                            />
                                        </td>
                                        <td className="center">
                                            <input
                                                type="checkbox"
                                                checked={formData.respuestas[q.n] === 'no'}
                                                onChange={() => handleResponseChange(q.n, 'no')}
                                            />
                                        </td>
                                        <td>
                                            <textarea placeholder="Documentación de soporte..."></textarea>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* Save button removed in favor of auto-save */}
        </div>
    );
};

export default MonicaTool;
