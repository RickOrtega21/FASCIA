import React, { useState, useEffect, useRef } from 'react';
import { TIERS } from '../../data/tiersData';
import { supabase } from '../../supabaseClient';
import TowerIcon from './TowerIcon';
import './AjusteView.css';

const DEFAULT_SKILLS = {
  trabajo_equipo: { adaptabilidad: 0, resolucion: 0, objetividad: 0, integracion: 0 },
  disciplina: { responsabilidad: 0, compromiso: 0, autogestion: 0 },
  servicio: { colaboracion: 0, negociacion: 0, comunicacion: 0, respeto: 0 },
  participacion: { creatividad: 0, actitud: 0, iniciativa: 0 }
};

const AjusteView = ({ searchTerm }) => {
  const [tiers, setTiers] = useState(TIERS);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCollab, setNewCollab] = useState({ name: '', area: '', achievements: 0 });
  const [saving, setSaving] = useState(false);

  // Import state
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const fetchCollaborators = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('collaborators')
      .select('*')
      .order('name');
    if (!error) setCollaborators(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  // Only show results when there is a search term; list all matches dynamically
  const filteredCollaborators = searchTerm.trim()
    ? collaborators.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.area.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // ── Add Collaborator via Modal ──────────────────────────────────
  const handleSaveNew = async () => {
    if (!newCollab.name.trim() || !newCollab.area.trim()) {
      alert('El nombre y el área son obligatorios.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('collaborators').insert([{
      name: newCollab.name.trim(),
      area: newCollab.area.trim(),
      achievements: parseInt(newCollab.achievements) || 0,
      score: 0,
      skills_data: DEFAULT_SKILLS
    }]);
    setSaving(false);
    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      setShowAddModal(false);
      setNewCollab({ name: '', area: '', achievements: 0 });
      fetchCollaborators();
    }
  };

  // ── Import from Excel ───────────────────────────────────────────
  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Dynamic import of SheetJS (xlsx)
    setImporting(true);
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) {
        alert('El archivo Excel está vacío o no tiene el formato correcto.');
        setImporting(false);
        return;
      }

      // Map Excel columns: Nombre, Area, Logros (optional)
      const records = rows.map(row => {
        const skills_data = {
          trabajo_equipo: {
            adaptabilidad:  parseInt(row['adaptabilidad']  || row['Adaptabilidad']  || 0) || 0,
            resolucion:     parseInt(row['resolucion']     || row['Resolución']     || row['Resolucion'] || 0) || 0,
            objetividad:    parseInt(row['objetividad']    || row['Objetividad']    || 0) || 0,
            integracion:    parseInt(row['integracion']    || row['Integración']    || row['Integracion'] || 0) || 0
          },
          disciplina: {
            responsabilidad: parseInt(row['responsabilidad'] || row['Responsabilidad'] || 0) || 0,
            compromiso:      parseInt(row['compromiso']      || row['Compromiso']      || 0) || 0,
            autogestion:     parseInt(row['autogestion']     || row['Autogestión']     || row['Autogestion'] || 0) || 0
          },
          servicio: {
            colaboracion: parseInt(row['colaboracion'] || row['Colaboración'] || row['Colaboracion'] || 0) || 0,
            negociacion:  parseInt(row['negociacion']  || row['Negociación']  || row['Negociacion']  || 0) || 0,
            comunicacion: parseInt(row['comunicacion'] || row['Comunicación'] || row['Comunicacion'] || 0) || 0,
            respeto:      parseInt(row['respeto']      || row['Respeto']      || 0) || 0
          },
          participacion: {
            creatividad: parseInt(row['creatividad'] || row['Creatividad'] || 0) || 0,
            actitud:     parseInt(row['actitud']     || row['Actitud']     || 0) || 0,
            iniciativa:  parseInt(row['iniciativa']  || row['Iniciativa']  || 0) || 0
          }
        };
        return {
          name:         String(row['Nombre'] || row['nombre'] || row['Name'] || '').trim(),
          area:         String(row['Area']   || row['Área']   || row['area'] || '').trim(),
          achievements: parseInt(row['Logros'] || row['logros'] || 0) || 0,
          score:        parseInt(row['Puntaje'] || row['puntaje'] || row['Score'] || 0) || 0,
          skills_data
        };
      }).filter(r => r.name && r.area);

      if (records.length === 0) {
        alert('No se encontraron filas válidas. Asegúrate de tener columnas: Nombre, Area (y opcionalmente Logros).');
        setImporting(false);
        return;
      }

      const { error } = await supabase.from('collaborators').insert(records);
      if (error) {
        alert('Error al importar: ' + error.message);
      } else {
        alert(`✅ ${records.length} colaboradores importados correctamente.`);
        fetchCollaborators();
      }
    } catch (err) {
      alert('Error al procesar el archivo: ' + err.message);
    }
    setImporting(false);
    e.target.value = '';
  };

  // ── Delete ──────────────────────────────────────────────────────
  const deleteCollaborator = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este colaborador?')) return;
    const { error } = await supabase.from('collaborators').delete().eq('id', id);
    if (!error) fetchCollaborators();
  };

  const updateTier = (id, field, value) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const displayTiers = [...tiers].reverse();

  return (
    <div className="ajuste-container animate-fade">
      <div className="ajuste-header">
        <h1>Ajustes del Sistema de Ranking</h1>
        <p className="ajuste-subtitle">
          Administra los niveles jerárquicos y la lista del personal.
        </p>
      </div>

      {/* ── Gestión de Colaboradores ── */}
      <div className="ajuste-section glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>👥 Gestión de Colaboradores</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleImportClick}
              disabled={importing}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: '2px solid var(--accent)',
                background: 'transparent',
                color: 'var(--accent)',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              📤 {importing ? 'Importando...' : 'Importar'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="save-btn"
              style={{ padding: '10px 22px' }}
            >
              ➕ Agregar
            </button>
          </div>
        </div>

        {/* Table — only shows results when searching, otherwise shows placeholder */}
        <div className="collab-list" style={{ minHeight: '80px' }}>
          {!searchTerm.trim() ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              fontStyle: 'italic',
              border: '2px dashed var(--border)',
              borderRadius: '12px'
            }}>
              🔍 Usa el buscador "Sabueso" para encontrar un colaborador
            </div>
          ) : filteredCollaborators.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              fontStyle: 'italic',
              border: '2px dashed var(--border)',
              borderRadius: '12px'
            }}>
              😕 Sin resultados para "<strong>{searchTerm}</strong>"
            </div>
          ) : (
            <table className="ranking-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Área</th>
                  <th>Puntaje</th>
                  <th>Logros</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollaborators.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{c.name}</td>
                    <td style={{ color: 'var(--accent)' }}>{c.area}</td>
                    <td>{c.score}</td>
                    <td>{c.achievements}</td>
                    <td>
                      <button
                        onClick={() => deleteCollaborator(c.id)}
                        title="Eliminar colaborador"
                        style={{ background: 'none', border: 'none', color: 'var(--danger, #e53e3e)', cursor: 'pointer', fontSize: '1.2rem' }}
                      >🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Configuración de Niveles ── */}
      <div className="ajuste-section glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>🏆 Configuración de Niveles</h2>
        <div className="tiers-grid">
          {displayTiers.map((tier) => (
            <div key={tier.id} className="tier-card" style={{ borderTop: `3px solid ${tier.color}`, padding: '15px', marginBottom: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div className="tier-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TowerIcon color={tier.color} size={18} id={`ajuste-card-${tier.id}`} />
                <span className="tier-card-name" style={{ color: tier.color, fontWeight: 'bold' }}>{tier.name}</span>
              </div>
              <div className="tier-rank-range" style={{ fontSize: '0.8rem', margin: '10px 0', color: 'var(--text-muted)' }}>
                Posición #{tier.minRank} → #{tier.maxRank >= 999 ? '∞' : tier.maxRank}
              </div>
              <div className="tier-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="tier-toggle">
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Home Office</span>
                  <button className={`toggle-btn ${tier.homeOffice ? 'on' : 'off'}`} onClick={() => updateTier(tier.id, 'homeOffice', !tier.homeOffice)}>
                    {tier.homeOffice ? '✅' : '❌'}
                  </button>
                </div>
                <div className="tier-toggle">
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bono</span>
                  <button className={`toggle-btn ${tier.bono ? 'on' : 'off'}`} onClick={() => updateTier(tier.id, 'bono', !tier.bono)}>
                    {tier.bono ? '✅' : '❌'}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>🏅 Reconocimiento</label>
                <textarea
                  rows={3}
                  placeholder="Describe el reconocimiento o beneficio para este nivel…"
                  value={tier.recognition || ''}
                  onChange={e => updateTier(tier.id, 'recognition', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${tier.color}55`,
                    background: `${tier.color}08`,
                    color: 'inherit',
                    fontSize: '0.82rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal: Agregar Colaborador ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--card-bg, #fff)',
            borderRadius: '20px',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            border: '1px solid var(--border)',
            animation: 'fadeIn .2s ease'
          }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '1.8rem', fontSize: '1.3rem' }}>
              ➕ Nuevo Colaborador
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej. Ana Martínez"
                  value={newCollab.name}
                  onChange={e => setNewCollab({ ...newCollab, name: e.target.value })}
                  className="tier-input"
                  style={{ marginTop: '6px', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Área *</label>
                <input
                  type="text"
                  placeholder="Ej. Operaciones"
                  value={newCollab.area}
                  onChange={e => setNewCollab({ ...newCollab, area: e.target.value })}
                  className="tier-input"
                  style={{ marginTop: '6px', width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Número de Logros</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newCollab.achievements}
                  onChange={e => setNewCollab({ ...newCollab, achievements: e.target.value })}
                  className="tier-input"
                  style={{ marginTop: '6px', width: '100%' }}
                />
              </div>

              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(6,182,212,0.08)',
                border: '1px solid rgba(6,182,212,0.25)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}>
                💡 Las habilidades se inicializarán en <strong>0</strong> y podrás editarlas desde el Perfil Personal.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowAddModal(false); setNewCollab({ name: '', area: '', achievements: 0 }); }}
                style={{
                  padding: '10px 24px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'transparent',
                  cursor: 'pointer', fontWeight: '600'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNew}
                disabled={saving}
                className="save-btn"
                style={{ padding: '10px 28px' }}
              >
                {saving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AjusteView;
