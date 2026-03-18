import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell, LabelList, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import './IEGTool.css';
import questionsData from '../data/monica_questions.json';
import html2pdf from 'html2pdf.js';
import { supabase } from '../supabaseClient';
import { createRoot } from 'react-dom/client';
import ERITool from './ERITool';

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
    if (value <= 8) return '#ff4c4c';
    if (value < 15) return '#ffeb3b';
    return '#4caf50';
};

const getSmartObjective = (qText, componentName) => {
    const cleanQ = qText.replace('¿', '').replace('?', '').trim();

    if (componentName.includes('AMBIENTE DE CONTROL')) {
        return `Fortalecer la cultura organizacional y ética mediante la implementación de un programa de difusión estratégica sobre "${cleanQ}", asegurando que el 100% del personal comprenda su impacto en la integridad Institucional.`;
    }
    if (componentName.includes('ADMINISTRACIÓN DE RIESGOS')) {
        return `Mitigar vulnerabilidades operativas a través de la formalización de una metodología de gestión para "${cleanQ}", incrementando la capacidad de respuesta ante eventos de riesgo en un 25% anual.`;
    }
    if (componentName.includes('ACTIVIDADES DE CONTROL')) {
        return `Garantizar la continuidad operativa mediante el rediseño y documentación de los puntos de control asociados a "${cleanQ}", reduciendo errores de proceso en el corto plazo.`;
    }
    if (componentName.includes('INFORMACIÓN Y COMUNICACIÓN')) {
        return `Optimizar el flujo de información veraz y oportuna mediante la formalización de canales específicos para "${cleanQ}", facilitando la toma de decisiones gerenciales basada en datos de calidad.`;
    }
    if (componentName.includes('SUPERVISIÓN Y SEGUIMIENTO')) {
        return `Establecer un esquema de monitoreo continuo y evaluación periódica sobre las deficiencias detectadas en "${cleanQ}", garantizando el cierre de planes de acción en los tiempos normativos establecidos.`;
    }

    return `Establecer un plan de mejora continua para "${cleanQ}" con el fin de fortalecer los mecanismos de control interno y asegurar el cumplimiento normativo en el próximo periodo de revisión.`;
};

const IEGTool = () => {
    const [dataState, setDataState] = useState({
        areasData: [],
        globalTotals: { comp1: 0, comp2: 0, comp3: 0, comp4: 0, comp5: 0, calificacion: 0, noCount: 0, pctCumplimiento: 0 },
        noAnalysis: [],
        approvedObjectives: {},
        allEvaluations: {}
    });
    const [loading, setLoading] = useState(true);

    const [manualInputs, setManualInputs] = useState({});
    const [period, setPeriod] = useState('Enero a Junio');

    const loadAllData = async () => {
        setLoading(true);
        try {
            // Fetch all evaluation states from Supabase
            const { data: supabaseData, error } = await supabase
                .from('evaluations_state')
                .select('area_name, data');

            if (error) {
                console.warn("Supabase fetch error, falling back to local data:", error);
            }

            const remoteDataMap = {};
            supabaseData.forEach(item => {
                remoteDataMap[item.area_name] = item.data;
            });

            const aggregatedAreas = [];
            let gtComp1 = 0, gtComp2 = 0, gtComp3 = 0, gtComp4 = 0, gtComp5 = 0;
            let gtCalificacion = 0, gtNoCount = 0, gtPctCumplimiento = 0;
            let gtCalificacionAnterior = 0;

            const globalNoCounts = {};
            const allEvaluationsData = {};

            AREAS.forEach(area => {
                const areaKey = `monica_${area}`;
                let savedData = remoteDataMap[areaKey];
                
                if (!savedData) {
                    const localStr = localStorage.getItem(areaKey);
                    if (localStr) savedData = JSON.parse(localStr);
                }
                allEvaluationsData[area] = savedData || {};

                const respuestas = savedData?.respuestas || {};
                const califAnterior = parseFloat(savedData?.califAnterior) || 0;

                let c1Raw = 0, c2Raw = 0, c3Raw = 0, c4Raw = 0, c5Raw = 0;
                let areaNoCount = 0;

                questionsData.forEach(comp => {
                    comp.questions.forEach(q => {
                        const resp = respuestas[q.n];
                        let pts = 0;
                        if (resp === 'si') pts = 2.5;
                        else if (resp === 'parcial') pts = 1.25;
                        else if (resp === 'no') {
                            areaNoCount++;
                            globalNoCounts[q.n] = (globalNoCounts[q.n] || 0) + 1;
                        }

                        if (comp.id === 1) c1Raw += pts;
                        if (comp.id === 2) c2Raw += pts;
                        if (comp.id === 3) c3Raw += pts;
                        if (comp.id === 4) c4Raw += pts;
                        if (comp.id === 5) c5Raw += pts;
                    });
                });

                const comp1 = Math.round(c1Raw * multipliers[1]);
                const comp2 = Math.round(c2Raw * multipliers[2]);
                const comp3 = Math.round(c3Raw * multipliers[3]);
                const comp4 = Math.round(c4Raw * multipliers[4]);
                const comp5 = Math.round(c5Raw * multipliers[5]);

                const calificacion = comp1 + comp2 + comp3 + comp4 + comp5;
                const pctCumplimiento = Math.round((1 - (areaNoCount / 40)) * 100);

                aggregatedAreas.push({ area, calificacion, noCount: areaNoCount, pctCumplimiento });

                gtComp1 += comp1; gtComp2 += comp2; gtComp3 += comp3; gtComp4 += comp4; gtComp5 += comp5;
                gtCalificacion += calificacion;
                gtCalificacionAnterior += califAnterior;
                gtNoCount += areaNoCount;
                gtPctCumplimiento += pctCumplimiento;
            });

            const filteredAreasCount = AREAS.length;
            const instActual = Math.round(gtCalificacion / filteredAreasCount);
            const instAnterior = Math.round(gtCalificacionAnterior / filteredAreasCount);

            let institutionalMejora = '0%';
            if (instActual > 0 && instAnterior > 0) {
                if (instActual === instAnterior) institutionalMejora = '0%';
                else {
                    const growth = Math.round(((instActual - instAnterior) / instAnterior) * 100);
                    institutionalMejora = (growth > 0 ? '+' : '') + growth + '%';
                }
            } else if (instActual > 0 && instAnterior === 0) {
                institutionalMejora = '100%';
            } else if (instActual === 0 && instAnterior > 0) {
                institutionalMejora = '-100%';
            }
            
            const globalTotals = {
                comp1: Math.round(gtComp1 / filteredAreasCount),
                comp2: Math.round(gtComp2 / filteredAreasCount),
                comp3: Math.round(gtComp3 / filteredAreasCount),
                comp4: Math.round(gtComp4 / filteredAreasCount),
                comp5: Math.round(gtComp5 / filteredAreasCount),
                calificacion: instActual,
                noCount: gtNoCount,
                pctCumplimiento: Math.round(gtPctCumplimiento / filteredAreasCount)
            };

            const analysis = [];
            questionsData.forEach(comp => {
                comp.questions.forEach(q => {
                    if (globalNoCounts[q.n]) {
                        analysis.push({
                            n: q.n,
                            text: q.text,
                            component: comp.component,
                            noCount: globalNoCounts[q.n],
                            smart: getSmartObjective(q.text, comp.component)
                        });
                    }
                });
            });

            setDataState({
                areasData: aggregatedAreas,
                globalTotals,
                noAnalysis: analysis,
                approvedObjectives: {},
                allEvaluations: allEvaluationsData
            });
        } catch (err) {
            console.error("IEG Load Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
        
        // Subscribe to ANY update in evaluations_state to refresh the report
        const channel = supabase
            .channel('ieg_realtime_sync')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'evaluations_state'
                },
                () => {
                    // Refresh data when any area changes
                    loadAllData();
                }
            )
            .subscribe();

        // Listen for local updates (MonicaTool in same window)
        window.addEventListener('storage', loadAllData);
        window.addEventListener('monicaDataUpdated', loadAllData);
        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('storage', loadAllData);
            window.removeEventListener('monicaDataUpdated', loadAllData);
        };
    }, []);

    const chartData = useMemo(() => [
        { subject: 'Ambi Control', A: dataState.globalTotals.comp1, fullMark: 20 },
        { subject: 'Admi Riesgo', A: dataState.globalTotals.comp2, fullMark: 20 },
        { subject: 'Actv Control', A: dataState.globalTotals.comp3, fullMark: 20 },
        { subject: 'Infor y Comu', A: dataState.globalTotals.comp4, fullMark: 20 },
        { subject: 'Superv y Seg', A: dataState.globalTotals.comp5, fullMark: 20 },
    ], [dataState.globalTotals]);

    if (loading) {
        return (
            <div className="ieg-container loading-state">
                <div className="loader"></div>
                <p>Generando Informes Ejecutivos...</p>
            </div>
        );
    }


    const toggleApprove = (n) => {
        setDataState(prev => ({
            ...prev,
            approvedObjectives: {
                ...prev.approvedObjectives,
                [n]: !prev.approvedObjectives[n]
            }
        }));
    };

    const handleManualChange = (n, val) => {
        setManualInputs(prev => ({ ...prev, [n]: val }));
    };

    const today = new Date();
    const formattedDate = `${today.getDate()} de ${today.toLocaleString('es-ES', { month: 'long' })} de ${today.getFullYear()}`;

    // Filtered areas for the report table
    const filteredAreas = dataState.areasData;

    const exportToWord = () => {
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
            "xmlns:w='urn:schemas-microsoft-com:office:word' " +
            "xmlns='http://www.w3.org/TR/REC-html40'>" +
            "<head><meta charset='utf-8'></head><body>";
        const footer = "</body></html>";
        
        const sourceHTML = header + document.querySelector('.ieg-report').innerHTML + footer;
        
        const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Informe_Evaluacion_General_SCI_${period.replace(/ /g, '_')}_${today.getFullYear()}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSaveFullReport = async () => {
        try {
            alert("Generando y guardando documento (ERI + IEG). Por favor espere unos segundos...");
            const reportContainer = document.querySelector('.ieg-report');
            
            // Ocultamos controles temporalmente para el snapshot
            const controls = document.querySelector('.ieg-export-controls');
            if (controls) controls.style.display = 'none';

            // Ocultar sección Análisis de Deficiencias y más abajo
            const noPrintSections = document.querySelectorAll('.no-print');
            noPrintSections.forEach(el => el.style.display = 'none');

            // Agregamos la seccion ERI al inicio del DOM en vivo
            const eriSectionId = 'temp-eri-section';
            let eriSection = document.getElementById(eriSectionId);
            if (!eriSection) {
                eriSection = document.createElement('div');
                eriSection.id = eriSectionId;
                eriSection.style.pageBreakAfter = 'always';
                eriSection.style.paddingBottom = '40px';
                eriSection.style.width = '100%';
                
                reportContainer.insertBefore(eriSection, reportContainer.firstChild);

                // Renderizamos ERI Tool estatico real
                const root = createRoot(eriSection);
                root.render(<ERITool isPrintMode={true} />);
            }

            // Pausa necesaria para que React y Recharts dibujen las graficas completas en el ERI inyectado
            await new Promise(r => setTimeout(r, 1200));

            const opt = {
                margin: 0.5,
                filename: `Reporte_Institucional_${period.replace(/ /g, '_')}_${today.getFullYear()}.pdf`,
                image: { type: 'jpeg', quality: 0.90 }, 
                html2canvas: { scale: 1.5, useCORS: true, letterRendering: true, windowWidth: reportContainer.scrollWidth }, 
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            const pdfBase64 = await html2pdf().from(reportContainer).set(opt).output('datauristring');
            
            // Restaurar la vista
            if (controls) controls.style.display = 'flex';
            noPrintSections.forEach(el => el.style.display = '');
            if (eriSection) {
                const root = createRoot(eriSection);
                root.unmount();
                eriSection.remove();
            }

            const historyData = {
                title: `Reporte Institucional IEG - ${period} ${today.getFullYear()}`,
                evaluator_name: 'Sistema Automático IEG',
                period: period,
                score: dataState.globalTotals.calificacion,
                report_data: dataState.globalTotals,
                pdf_base64: pdfBase64
            };

            const { error } = await supabase.from('reports_history').insert([historyData]);
            if (error) throw error;

            alert("¡Documento guardado con éxito en el Historial!");
        } catch (e) {
            console.error("Save Report Error:", e);
            if (document.querySelector('.ieg-export-controls')) document.querySelector('.ieg-export-controls').style.display = 'flex';
            document.querySelectorAll('.no-print').forEach(el => el.style.display = '');
            if (document.getElementById('temp-eri-section')) document.getElementById('temp-eri-section').remove();
            alert(`Error al guardar el reporte: ${e.message}`);
        }
    };

    return (
        <div className="ieg-container">
            <div className="ieg-report">
                <header className="ieg-report-header">
                    <div className="ieg-logo-section">
                        <div className="ieg-logo">La Latino</div>
                        <div className="ieg-logo-sub">Seguros</div>
                    </div>
                </header>

                <h1 className="ieg-main-title">Informe de Evaluación General del SCI</h1>
                <p className="ieg-subtitle">Ciudad de México a {formattedDate}</p>

                <div className="ieg-report-body">
                    <div className="ieg-paragraph ieg-period-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <div className="ieg-period-box">
                            <strong>Periodo de revisión:</strong>
                            <select value={period} onChange={e => setPeriod(e.target.value)} className="ieg-select">
                                <option value="Enero a Junio">Enero a Junio</option>
                                <option value="Julio a Diciembre">Julio a Diciembre</option>
                            </select>
                            del {today.getFullYear()}
                        </div>
                    </div>
                    <p className="ieg-paragraph">
                        El objetivo del documento es informar al Director General sobre la operación y el estado actual del Sistema de Contraloría Interna en La Latinoamericana Seguros, S. A. (La Institución) en cumplimiento con la Circular Única de Seguros y Fianzas (CUSF) en su Título 3, capítulo 3.3, disposición 3.3.4. Informando el nivel de cumplimiento de los principios y componentes del SCI y las acciones a tomar para la mejora continua de las operaciones de la Institución con base en los Mecanismos Operacionales del Nivel de Control en las Áreas.
                    </p>
                    <p className="ieg-paragraph">
                        En este periodo el desempeño de las actividades refleja que el cumplimiento a las políticas y procedimientos registrados consta del <strong>{dataState.globalTotals.pctCumplimiento}%</strong>, dado a que se encontraron una cantidad de <strong>{dataState.globalTotals.noCount}</strong> de deficiencias en las actividades de todas las áreas durante el periodo de evaluación, así mismo la tasa de mejora en el sistema para este semestre es de <strong>{dataState.institutionalMejora || '0%'}</strong> como resultado de un seguimiento trimestral.
                    </p>
                    <p className="ieg-paragraph">
                        Por lo anterior, la eficiencia del Sistema de Contraloría Interna obtiene una calificación de <strong>{dataState.globalTotals.calificacion}</strong> puntos de 100 en el cumplimiento de sus principios y componentes a nivel institucional representados en la siguiente tabla.
                    </p>

                    <div style={{ width: '40%', margin: '0 auto' }}>
                        <table className="ieg-report-table ieg-compact-table">
                            <thead>
                                <tr>
                                    <th className="ieg-table-header-dark">Resumen de Principios</th>
                                    <th className="ieg-table-header-dark" style={{ textAlign: 'center' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td className="row-header" style={{ fontSize: '0.75rem' }}>Ambiente de Control</td><td className={getComponentColor(dataState.globalTotals.comp1)}>{dataState.globalTotals.comp1}</td></tr>
                                <tr><td className="row-header" style={{ fontSize: '0.75rem' }}>Administración del Riesgo</td><td className={getComponentColor(dataState.globalTotals.comp2)}>{dataState.globalTotals.comp2}</td></tr>
                                <tr><td className="row-header" style={{ fontSize: '0.75rem' }}>Actividades de Control</td><td className={getComponentColor(dataState.globalTotals.comp3)}>{dataState.globalTotals.comp3}</td></tr>
                                <tr><td className="row-header" style={{ fontSize: '0.75rem' }}>Información y Comunicación</td><td className={getComponentColor(dataState.globalTotals.comp4)}>{dataState.globalTotals.comp4}</td></tr>
                                <tr><td className="row-header" style={{ fontSize: '0.75rem' }}>Supervisión y Seguimiento</td><td className={getComponentColor(dataState.globalTotals.comp5)}>{dataState.globalTotals.comp5}</td></tr>
                                <tr style={{ borderTop: '2px solid #002060' }}>
                                    <td className="row-header" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Calificación</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>{dataState.globalTotals.calificacion}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="ieg-paragraph" style={{ marginTop: '2rem' }}>
                        La eficiencia del Sistema de Contraloría Interna obtiene una calificación para las áreas entre los rangos de <strong>{filteredAreas.length > 0 ? Math.min(...filteredAreas.map(d => d.calificacion)) : 0} a {filteredAreas.length > 0 ? Math.max(...filteredAreas.map(d => d.calificacion)) : 0}</strong> puntos de 100 en el cumplimiento de sus principios y componentes a nivel gerencial representados en la siguiente tabla.
                    </p>

                    <div style={{ width: '40%', margin: '0 auto' }}>
                        <table className="ieg-report-table ieg-compact-table">
                            <thead>
                                <tr>
                                    <th className="ieg-table-header-dark">Área</th>
                                    <th className="ieg-table-header-dark" style={{ textAlign: 'center' }}>Calificación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAreas.map((d, i) => (
                                    <tr key={i}>
                                        <td className="row-header" style={{ fontSize: '0.75rem' }}>{d.area}</td>
                                        <td style={{ textAlign: 'center' }}>{d.calificacion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="ieg-analysis-section">
                        <h2 className="ieg-analysis-title">Acciones en el SCI</h2>
                        <p className="ieg-paragraph">
                            Los objetivos integrales por parte del área de Control Interno para cada componente se basan a los resultados de la puntuación del sistema demostrados en la interrelación de los mismos componentes en los siguientes gráficos.
                        </p>

                        <div className="ieg-charts-row">
                            <div className="ieg-chart-container">
                                <h3 className="ieg-chart-title">Nivel de cumplimiento del SCI a nivel institucional</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="subject" interval={0} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                                        <YAxis domain={[0, 20]} tickCount={11} tick={{ fontSize: 10 }} />
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
                            <div className="ieg-chart-container">
                                <h3 className="ieg-chart-title">Relación de cumplimiento del SCI</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                        <PolarGrid gridType="polygon" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={90} tick={{ fontSize: 10 }} />
                                        <Radar name="Institucional" dataKey="A" stroke="#0088fe" strokeWidth={3} fill="#0088fe" fillOpacity={0.1} />
                                        <RechartsTooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="ieg-analysis-section">
                        <h2 className="ieg-analysis-title">Objetivos</h2>
                        <div className="approved-actions-list">
                            {Object.entries(dataState.approvedObjectives).filter(([_, approved]) => approved).length > 0 ? (
                                Object.entries(
                                    dataState.noAnalysis
                                        .filter(item => dataState.approvedObjectives[item.n])
                                        .reduce((acc, item) => {
                                            if (!acc[item.component]) acc[item.component] = [];
                                            acc[item.component].push(item);
                                            return acc;
                                        }, {})
                                ).map(([compTitle, items]) => (
                                    <div key={compTitle} className="approved-comp-group" style={{ marginBottom: '2rem' }}>
                                        <div className="approved-action-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', borderLeft: '5px solid #002060', paddingLeft: '1rem' }}>
                                            <p style={{ fontWeight: 'bold', fontSize: '1.2rem', margin: 0, color: '#002060', textTransform: 'uppercase' }}>{compTitle}</p>
                                        </div>
                                        {items.map(item => (
                                            <div key={item.n} className="approved-action-body" style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                                                <p style={{ fontSize: '1rem', color: '#333', margin: 0, lineHeight: '1.4' }}>{manualInputs[item.n] || item.smart}</p>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            ) : (
                                <p className="ieg-paragraph" style={{ fontStyle: 'italic', color: '#666' }}>No hay objetivos aprobados actualmente.</p>
                            )}
                        </div>
                    </div>

                    <div className="ieg-analysis-section no-print">
                        <h2 className="ieg-analysis-title">Análisis de Deficiencias y Objetivos SMART</h2>
                        <p className="ieg-paragraph">
                            Basado en el análisis de todas las evaluaciones, a continuación se presentan las preguntas que obtuvieron respuesta "No" de forma recurrente, sugiriendo objetivos SMART para su mitigación.
                        </p>

                        <table className="ieg-analysis-table">
                            <thead>
                                <tr>
                                    <th># Preg.</th>
                                    <th>Pregunta</th>
                                    <th>Frec. "No"</th>
                                    <th style={{ width: '40%' }}>Objetivo</th>
                                    <th>Aprobar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataState.noAnalysis.map((item) => (
                                    <tr key={item.n}>
                                        <td style={{ textAlign: 'center' }}>{item.n}</td>
                                        <td style={{ fontSize: '0.8rem' }}>{item.text}</td>
                                        <td style={{ textAlign: 'center', color: 'red', fontWeight: 'bold' }}>{item.noCount}</td>
                                        <td>
                                            <textarea
                                                className="ieg-objective-input"
                                                rows="4"
                                                placeholder={item.smart}
                                                value={manualInputs[item.n] !== undefined ? manualInputs[item.n] : item.smart}
                                                onChange={(e) => handleManualChange(item.n, e.target.value)}
                                                style={{ border: '1px solid #002060', backgroundColor: '#f9f9ff', width: '100%', padding: '8px', fontSize: '0.85rem' }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className={`ieg-btn-approve ${dataState.approvedObjectives[item.n] ? 'approved' : ''}`}
                                                onClick={() => toggleApprove(item.n)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '4px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    backgroundColor: dataState.approvedObjectives[item.n] ? '#4caf50' : '#002060',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                {dataState.approvedObjectives[item.n] ? '✓ Aprobado' : 'Aprobar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {dataState.noAnalysis.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic', color: '#999' }}>
                                            No se detectaron deficiencias recurrentes en las evaluaciones actuales.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <footer style={{ marginTop: '4rem', borderTop: '1px solid #eee', paddingTop: '1rem', fontSize: '0.8rem', textAlign: 'center', color: '#888' }}>
                    <p>La Latinoamericana Seguros, S.A.</p>
                    <p>El presente documento es de uso confidencial.</p>
                    <p>Queda estrictamente prohibida la distribución de ejemplares a personas o Instituciones públicas o privadas ajenas a La Latino en México.</p>
                </footer>

                <div className="ieg-export-controls no-print" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', paddingBottom: '3rem', flexWrap: 'wrap' }}>
                    <button className="ieg-export-btn pdf" onClick={() => window.print()}>
                        <span style={{ marginRight: '8px' }}>📄</span> Exportar a PDF
                    </button>
                    <button className="ieg-export-btn word-btn" onClick={exportToWord} style={{ backgroundColor: '#2b579a', color: 'white' }}>
                        <span style={{ marginRight: '8px' }}>📝</span> Exportar a Word
                    </button>
                    <button className="ieg-export-btn save" onClick={handleSaveFullReport} style={{ backgroundColor: '#28a745', color: 'white' }}>
                        <span style={{ marginRight: '8px' }}>💾</span> Guardar
                    </button>
                    <button className="ieg-export-btn email" onClick={async () => {
                        try {
                            alert("Generando PDF y preparando correo. Esto puede tardar unos segundos...");
                            const element = document.querySelector('.ieg-report');
                            const opt = {
                                margin: 0.5,
                                filename: `evaluacion_sci_${today.getFullYear()}.pdf`,
                                image: { type: 'jpeg', quality: 0.98 },
                                html2canvas: { scale: 2, useCORS: true },
                                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                            };

                            const pdfBase64 = await html2pdf().from(element).set(opt).output('datauristring');

                            const historyData = {
                                title: `Reporte Institucional IEG - ${period} ${today.getFullYear()}`,
                                evaluator_name: 'Sistema Automático IEG',
                                period: period,
                                score: dataState.globalTotals.calificacion,
                                report_data: dataState.globalTotals
                            };
                            await supabase.from('reports_history').insert([historyData]).catch(console.error);

                            const response = await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: 'ricardoortega341@gmail.com, rgalicia@latinoseguros.com.mx',
                                    subject: `Evaluación SCI Semestre ${period === 'Enero a Junio' ? '1' : '2'} - ${today.getFullYear()}`,
                                    message: 'Adjunto el informe de evaluación general generado por el sistema FASCIA.',
                                    pdfBase64: pdfBase64,
                                    filename: `evaluacion_sci_${period.replace(/ /g, '_')}_${today.getFullYear()}.pdf`
                                })
                            });

                            if (response.ok) {
                                alert("¡Informe enviado con éxito!");
                            } else {
                                const errData = await response.json();
                                console.error("Error en servidor:", errData);
                                alert(`Error al enviar correo: ${errData.details || 'Error desconocido'}`);
                            }
                        } catch (e) {
                            console.error("Fetch Error:", e);
                            alert(`Error crítico al procesar el documento: ${e.message}`);
                        }
                    }}>
                        <span style={{ marginRight: '8px' }}>📧</span> Exportar en PDF y Enviarlo por Correo
                    </button>
                </div>

                {/* SE ELIMINÓ EL TEMPLATE OCULTO PARA ERI PUES AHORA RENDEREA COMPONENTE VIA ROOT INYECTADO */}
            </div>
        </div>
    );
};

export default IEGTool;
