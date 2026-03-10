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

    const [loading, setLoading] = useState(true);

    // Load data ONLY ONCE on mount for this specific area instance
    useEffect(() => {
        const loadInstanceData = async () => {
            try {
                const { data } = await supabase
                    .from('evaluations_state')
                    .select('data')
                    .eq('area_name', `monica_${area}`)
                    .single();

                if (data?.data) {
                    setFormData(data.data);
                } else {
                    const saved = localStorage.getItem(`monica_${area}`);
                    if (saved) setFormData(JSON.parse(saved));
                }
            } catch (err) {
                console.error("Load error:", err);
                const saved = localStorage.getItem(`monica_${area}`);
                if (saved) setFormData(JSON.parse(saved));
            } finally {
                setLoading(false);
            }
        };
        loadInstanceData();
    }, []); // Empty dependency = only on mount (remount happens via key change in App.jsx)

    // Auto-save logic
    useEffect(() => {
        if (!loading) {
            localStorage.setItem(`monica_${area}`, JSON.stringify(formData));
            
            const syncToSupabase = async () => {
                await supabase.from('evaluations_state').upsert({
                    area_name: `monica_${area}`,
                    data: formData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'area_name' });
            };
            syncToSupabase();
            window.dispatchEvent(new Event('monicaDataUpdated'));
        }
    }, [formData, loading]);

    const handleResponseChange = (questionId, value) => {
        setFormData(prev => ({
            ...prev,
            respuestas: {
                ...prev.respuestas,
                [questionId]: prev.respuestas[questionId] === value ? undefined : value
            }
        }));
    };

    const multipliers = { 1: 0.888, 2: 1.333, 3: 0.61538, 4: 1.142857, 5: 1.6 };

    const calculateTotals = () => {
        const totals = { siPts: 0, parcialPts: 0, noCount: 0, puntosFinal: 0, porComponente: {} };
        questionsData.forEach(comp => {
            let si = 0, pc = 0, no = 0;
            comp.questions.forEach(q => {
                const r = formData.respuestas[q.n];
                if (r === 'si') si += 2.5;
                else if (r === 'parcial') pc += 1.25;
                else if (r === 'no') no++;
            });
            const weighted = Math.round((si + pc) * (multipliers[comp.id] || 1));
            totals.siPts += si; totals.parcialPts += pc; totals.noCount += no; totals.puntosFinal += weighted;
            totals.porComponente[comp.id] = { siPts: si, parcialPts: pc, noPts: 0, total: weighted, name: comp.shortName };
        });
        return totals;
    };

    const totals = calculateTotals();
    const filteredData = questionsData.map(comp => ({
        ...comp,
        questions: comp.questions.filter(q => q.text.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(c => c.questions.length > 0);

    return (
        <div className="monica-container">
            <div className="monica-header">
                <div className="header-left">
                    <h1>Formato de Evaluación de Principios y Componentes FEPYC</h1>
                    <div className="header-meta">
                        <div className="meta-row">
                            <div className="meta-item"><label>Área:</label><input type="text" value={area} readOnly /></div>
                            <div className="meta-item"><label>Evaluador:</label><input type="text" value={formData.evaluador} onChange={e => setFormData(p=>({...p, evaluador: e.target.value}))} placeholder="Nombre del evaluador" /></div>
                        </div>
                        <div className="meta-row">
                            <div className="meta-item"><label>Fecha:</label><input type="date" value={formData.fecha} onChange={e => setFormData(p=>({...p, fecha: e.target.value}))} /></div>
                            <div className="meta-item"><label>Evaluado:</label><input type="text" value={formData.evaluado} onChange={e => setFormData(p=>({...p, evaluado: e.target.value}))} placeholder="Nombre del evaluado" /></div>
                        </div>
                        <div className="meta-row">
                            <div className="meta-item"><label>N.(NO):</label><input type="text" value={totals.noCount} readOnly className="no-counter" /></div>
                            <div className="meta-item quarterly-rating">
                                <label>Calificación Trimestral:</label>
                                <div className="quarterly-inputs">
                                    <div className="q-input-group"><span>Actual</span><input type="text" value={totals.puntosFinal} readOnly /></div>
                                    <div className="q-input-group"><span>Anterior</span><input type="text" value={formData.califAnterior} onChange={e => setFormData(p=>({...p, califAnterior: e.target.value}))} /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="resumen-panel">
                    <h3>Resumen de Principios</h3>
                    <table className="resumen-table">
                        <thead><tr><th>Componente</th><th>Si</th><th>Parcial</th><th>No</th><th>Total</th></tr></thead>
                        <tbody>
                            {questionsData.map(comp => {
                                const c = totals.porComponente[comp.id];
                                return (
                                    <tr key={comp.id}>
                                        <td className="comp-name">{c.name}</td>
                                        <td>{c.siPts.toFixed(1)}</td><td>{c.parcialPts.toFixed(1)}</td><td>{c.noPts}</td>
                                        <td className="total-cell">{c.total}</td>
                                    </tr>
                                );
                            })}
                            <tr className="grand-total"><td colSpan="4">PUNTOS TOTALES:</td><td>{totals.puntosFinal}</td></tr>
                        </tbody>
                    </table>
                    <div className="auto-save-indicator"><span className="dot"></span> Cambios guardados automáticamente</div>
                </div>
            </div>
            <div className="monica-content">
                {filteredData.map(comp => (
                    <div key={comp.id} className="component-section">
                        <div className="component-title"><h2>{comp.component}</h2></div>
                        <table className="questions-table">
                            <thead><tr><th className="col-n">N</th><th className="col-pregunta">Pregunta</th><th className="col-si">Si</th><th className="col-parcial">Parcial</th><th className="col-no">No</th><th>Soporte</th></tr></thead>
                            <tbody>
                                {comp.questions.map(q => (
                                    <tr key={q.n} className={formData.respuestas[q.n] ? 'row-selected' : ''}>
                                        <td>{q.n}</td><td>{q.text}</td>
                                        <td className={`center checkbox-cell ${formData.respuestas[q.n] === 'si' ? 'checked-box' : ''}`}>
                                            <input type="checkbox" checked={formData.respuestas[q.n] === 'si'} onChange={() => handleResponseChange(q.n, 'si')} />
                                        </td>
                                        <td className={`center checkbox-cell ${formData.respuestas[q.n] === 'parcial' ? 'checked-box' : ''}`}>
                                            <input type="checkbox" checked={formData.respuestas[q.n] === 'parcial'} onChange={() => handleResponseChange(q.n, 'parcial')} />
                                        </td>
                                        <td className={`center checkbox-cell ${formData.respuestas[q.n] === 'no' ? 'checked-box' : ''}`}>
                                            <input type="checkbox" checked={formData.respuestas[q.n] === 'no'} onChange={() => handleResponseChange(q.n, 'no')} />
                                        </td>
                                        <td><textarea placeholder="Soporte..." defaultValue={formData.respuestas[q.n+'_soporte'] || ''} onBlur={e => setFormData(p=>({...p, respuestas:{...p.respuestas, [q.n+'_soporte']: e.target.value}}))}></textarea></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MonicaTool;
