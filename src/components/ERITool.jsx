import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell, LabelList } from 'recharts';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import './ERITool.css';
import questionsData from '../data/monica_questions.json';
import { supabase } from '../supabaseClient';

const AREAS = [
    'Operaciones', 'Sistemas', 'Recursos Humanos', 'Comercial',
    'PMO y Calidad', 'Juridico', 'Finanzas', 'Suscripción Daños',
    'Indemnización Daños', 'Suscripción Personas', 'Reaseguro',
    'Indemnización Personas', 'Gobierno Corporativo', 'Auditoria'
];

const multipliers = {
    1: 0.888,
    2: 1.333,
    3: 0.61538,
    4: 1.142857,
    5: 1.6
};

const getComponentColor = (value) => {
    if (value <= 8) return 'status-red';
    if (value < 15) return 'status-yellow';
    return 'status-green';
};

const getChartBarColor = (value) => {
    if (value <= 8) return '#ff4c4c'; // brighter red for charts
    if (value < 15) return '#ffeb3b'; // bright yellow for charts
    return '#4caf50'; // bright green for charts
};

const getGrandTotalColor = (value) => {
    if (value <= 39) return 'status-red';
    if (value < 70) return 'status-yellow';
    return 'status-green';
};

const ERITool = () => {
    const [areasData, setAreasData] = useState([]);
    const [globalTotals, setGlobalTotals] = useState({
        comp1: 0, comp2: 0, comp3: 0, comp4: 0, comp5: 0,
        calificacion: 0, noCount: 0, pctCumplimiento: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSharedData = async () => {
            setLoading(true);
            try {
                // Fetch all evaluation states from Supabase
                const { data: supabaseData, error } = await supabase
                    .from('evaluations_state')
                    .select('area_name, data');

                if (error) {
                    console.warn("Supabase fetch error, falling back to local data:", error);
                }

                // Create a map for quick lookup
                const remoteDataMap = {};
                supabaseData.forEach(item => {
                    remoteDataMap[item.area_name] = item.data;
                });

                const aggregatedData = [];
                let gtComp1 = 0, gtComp2 = 0, gtComp3 = 0, gtComp4 = 0, gtComp5 = 0;
                let gtCalificacion = 0, gtNoCount = 0, gtPctCumplimiento = 0;

                AREAS.forEach(area => {
                    const areaKey = `monica_${area}`;
                    // Prefer Supabase data over localStorage
                    let savedData = remoteDataMap[areaKey];
                    
                    if (!savedData) {
                        const localStr = localStorage.getItem(areaKey);
                        if (localStr) savedData = JSON.parse(localStr);
                    }

                    const respuestas = savedData ? savedData.respuestas : {};
                    const califActual = parseFloat(savedData?.califActual) || 0;
                    const califAnterior = parseFloat(savedData?.califAnterior) || 0;

                    let comp1Raw = 0, comp2Raw = 0, comp3Raw = 0, comp4Raw = 0, comp5Raw = 0;
                    let noCount = 0;

                    questionsData.forEach(comp => {
                        comp.questions.forEach(q => {
                            const resp = respuestas[q.n];
                            let pts = 0;
                            if (resp === 'si') pts = 2.5;
                            else if (resp === 'parcial') pts = 1.25;
                            else if (resp === 'no') noCount++;

                            if (comp.id === 1) comp1Raw += pts;
                            if (comp.id === 2) comp2Raw += pts;
                            if (comp.id === 3) comp3Raw += pts;
                            if (comp.id === 4) comp4Raw += pts;
                            if (comp.id === 5) comp5Raw += pts;
                        });
                    });

                    const comp1 = Math.round(comp1Raw * multipliers[1]);
                    const comp2 = Math.round(comp2Raw * multipliers[2]);
                    const comp3 = Math.round(comp3Raw * multipliers[3]);
                    const comp4 = Math.round(comp4Raw * multipliers[4]);
                    const comp5 = Math.round(comp5Raw * multipliers[5]);

                    const calificacion = comp1 + comp2 + comp3 + comp4 + comp5;
                    const pctCumplimiento = Math.round((1 - (noCount / 40)) * 100);

                    let pctMejora = '—';
                    const actual = parseFloat(califActual) || 0;
                    const anterior = parseFloat(califAnterior) || 0;

                    if (actual > 0 && anterior > 0) {
                        if (actual === anterior) {
                            pctMejora = '0%';
                        } else {
                            const growth = Math.round(((actual - anterior) / anterior) * 100);
                            pctMejora = (growth > 0 ? '+' : '') + growth + '%';
                        }
                    } else if (actual > 0 && anterior === 0) {
                        pctMejora = '100%';
                    } else if (actual === 0 && anterior > 0) {
                        pctMejora = '-100%';
                    }

                    aggregatedData.push({
                        area,
                        comp1, comp2, comp3, comp4, comp5,
                        calificacion, noCount, pctCumplimiento, pctMejora
                    });

                    gtCalificacion += calificacion;
                    gtNoCount += noCount;
                    gtPctCumplimiento += pctCumplimiento;
                });

                const filteredAreasCount = AREAS.filter(a => a !== 'Auditoria').length;
                setAreasData(aggregatedData);
                setGlobalTotals({
                    comp1: Math.round(gtComp1 / filteredAreasCount),
                    comp2: Math.round(gtComp2 / filteredAreasCount),
                    comp3: Math.round(gtComp3 / filteredAreasCount),
                    comp4: Math.round(gtComp4 / filteredAreasCount),
                    comp5: Math.round(gtComp5 / filteredAreasCount),
                    calificacion: Math.round(gtCalificacion / filteredAreasCount),
                    noCount: gtNoCount,
                    pctCumplimiento: Math.round(gtPctCumplimiento / filteredAreasCount)
                });
            } catch (err) {
                console.error("Error loading shared data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadSharedData();

        // Subscribe to ANY update in evaluations_state to refresh the dashboard
        const channel = supabase
            .channel('eri_realtime_sync')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'evaluations_state'
                },
                () => {
                    // Refresh all data when any area changes
                    loadSharedData();
                }
            )
            .subscribe();

        // Listen for local updates (MonicaTool in same window)
        window.addEventListener('storage', loadSharedData);
        window.addEventListener('monicaDataUpdated', loadSharedData);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('storage', loadSharedData);
            window.removeEventListener('monicaDataUpdated', loadSharedData);
        };
    }, []);

    const chartData = [
        { subject: 'Ambi Control', A: globalTotals.comp1, fullMark: 20 },
        { subject: 'Admi Riesgo', A: globalTotals.comp2, fullMark: 20 },
        { subject: 'Actv Control', A: globalTotals.comp3, fullMark: 20 },
        { subject: 'Infor y Comu', A: globalTotals.comp4, fullMark: 20 },
        { subject: 'Superv y Seg', A: globalTotals.comp5, fullMark: 20 },
    ];

    if (loading) {
        return (
            <div className="eri-container loading-state">
                <div className="loader"></div>
                <p>Cargando datos institucionales...</p>
            </div>
        );
    }

    return (
        <div className="eri-container">
            <div className="eri-header">
                <div className="eri-title-section-fepyc">
                    <h1>EVALUACIÓN DE RIESGOS INSTITUCIONALES ERI</h1>
                </div>

                <div className="eri-top-dashboard">
                    {/* TOP CHARTS ROW */}
                    <div className="eri-charts-section">
                        <div className="eri-chart-card">
                            <h3 className="chart-title">Nivel de cumplimiento del SCI a nivel institucional</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <YAxis domain={[0, 20]} tickCount={11} />
                                    <RechartsTooltip />
                                    <ReferenceLine y={8} stroke="#ff0000" strokeWidth={1.5} />
                                    <ReferenceLine y={14} stroke="#ffd700" strokeWidth={1.5} />
                                    <ReferenceLine y={20} stroke="#2ecc40" strokeWidth={1.5} />
                                    <Bar dataKey="A" barSize={35}>
                                        <LabelList dataKey="A" position="insideTop" fill="#111111" fontSize={11} fontWeight="bold" />
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getChartBarColor(entry.A)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="eri-chart-card">
                            <h3 className="chart-title">Relación de cumplimiento del SCI</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                    <PolarGrid gridType="polygon" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={90} tickCount={8} />
                                    <Radar name="Institucional" dataKey="A" stroke="#0088fe" strokeWidth={3} fill="#0088fe" fillOpacity={0.1} />
                                    <RechartsTooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* BOTTOM TABLES ROW */}
                    <div className="eri-tables-section">
                        <div className="eri-atributos-bottom">
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#002060', fontWeight: 'bold' }}>Resumen de Atributos</h3>
                            <table className="eri-styled-table">
                                <tbody>
                                    <tr><td className="row-header">N. Deficiencias</td><td className="status-red">{globalTotals.noCount}</td></tr>
                                    <tr><td className="row-header">% Cumplimiento</td><td style={{ fontWeight: 'bold' }}>{globalTotals.pctCumplimiento}%</td></tr>
                                    <tr><td className="row-header">% Mejora</td><td style={{ fontWeight: 'bold' }}>100%</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="eri-side-tables">
                            <div>
                                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#002060', fontWeight: 'bold' }}>Resumen de Principios</h3>
                                <table className="eri-styled-table resumen-principios">
                                    <thead>
                                        <tr>
                                            <th className="eri-table-light-header">Componente</th>
                                            <th className="eri-table-light-header">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td className="row-header">Ambi Control</td><td className={getComponentColor(globalTotals.comp1)}>{globalTotals.comp1}</td></tr>
                                        <tr><td className="row-header">Admi Riesgo</td><td className={getComponentColor(globalTotals.comp2)}>{globalTotals.comp2}</td></tr>
                                        <tr><td className="row-header">Actv Control</td><td className={getComponentColor(globalTotals.comp3)}>{globalTotals.comp3}</td></tr>
                                        <tr><td className="row-header">Infor y Comu</td><td className={getComponentColor(globalTotals.comp4)}>{globalTotals.comp4}</td></tr>
                                        <tr><td className="row-header">Superv y Seg</td><td className={getComponentColor(globalTotals.comp5)}>{globalTotals.comp5}</td></tr>
                                        <tr>
                                            <td className="eri-table-dark-header">Calificación</td>
                                            <td className={getGrandTotalColor(globalTotals.calificacion)}>{globalTotals.calificacion}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="eri-main-content">
                    <table className="eri-styled-table eri-main-table">
                        <thead>
                            <tr>
                                <th rowSpan="2">Area</th>
                                <th colSpan="6">Calificaciones por Componente</th>
                                <th colSpan="2">Calificaciones Semestrales</th>
                            </tr>
                            <tr>
                                <th className="eri-table-light-header">Ambi Contro</th>
                                <th className="eri-table-light-header">Admi Riesgo</th>
                                <th className="eri-table-light-header">Actv Control</th>
                                <th className="eri-table-light-header">Infor y Comu</th>
                                <th className="eri-table-light-header">Superv y Seg</th>
                                <th className="eri-table-light-header">Calificación</th>
                                <th className="eri-table-light-header">N.(NO)</th>
                                <th className="eri-table-light-header">% Cumplim</th>
                                <th className="eri-table-light-header">% Mejora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {areasData.filter(d => d.area !== 'Auditoria').map((data, idx) => (
                                <tr key={idx}>
                                    <td className="row-header">{data.area}</td>
                                    <td className={getComponentColor(data.comp1)}>{data.comp1}</td>
                                    <td className={getComponentColor(data.comp2)}>{data.comp2}</td>
                                    <td className={getComponentColor(data.comp3)}>{data.comp3}</td>
                                    <td className={getComponentColor(data.comp4)}>{data.comp4}</td>
                                    <td className={getComponentColor(data.comp5)}>{data.comp5}</td>
                                    <td className={getGrandTotalColor(data.calificacion)}>{data.calificacion}</td>
                                    <td>{data.noCount}</td>
                                    <td>{data.pctCumplimiento}%</td>
                                    <td>{data.pctMejora}</td>
                                </tr>
                            ))}
                            <tr>
                                <td className="eri-table-dark-header">Total</td>
                                <td className={getComponentColor(globalTotals.comp1)}>{globalTotals.comp1}</td>
                                <td className={getComponentColor(globalTotals.comp2)}>{globalTotals.comp2}</td>
                                <td className={getComponentColor(globalTotals.comp3)}>{globalTotals.comp3}</td>
                                <td className={getComponentColor(globalTotals.comp4)}>{globalTotals.comp4}</td>
                                <td className={getComponentColor(globalTotals.comp5)}>{globalTotals.comp5}</td>
                                <td className={getGrandTotalColor(globalTotals.calificacion)}>{globalTotals.calificacion}</td>
                                <td className="status-red">{globalTotals.noCount}</td>
                                <td>{globalTotals.pctCumplimiento}%</td>
                                <td>100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ERITool;
