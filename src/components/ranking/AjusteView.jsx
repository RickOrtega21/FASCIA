import React, { useState, useEffect } from 'react';
import { TIERS } from '../../data/tiersData';
import { supabase } from '../../supabaseClient';
import TowerIcon from './TowerIcon';
import './AjusteView.css';

const AjusteView = ({ searchTerm }) => {
  const [tiers, setTiers] = useState(TIERS);
  const [collaborators, setCollaborators] = useState([]);
  const [newCollab, setNewCollab] = useState({ name: '', area: '', score: 0, achievements: 0 });
  const [loading, setLoading] = useState(true);

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

  const filteredCollaborators = collaborators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addCollaborator = async () => {
    if (!newCollab.name || !newCollab.area) return alert('Por favor ingresa nombre y área');
    const { error } = await supabase
      .from('collaborators')
      .insert([newCollab]);
    
    if (error) alert('Error al agregar: ' + error.message);
    else {
      setNewCollab({ name: '', area: '', score: 0, achievements: 0 });
      fetchCollaborators();
    }
  };

  const deleteCollaborator = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este colaborador?')) return;
    const { error } = await supabase
      .from('collaborators')
      .delete()
      .eq('id', id);
    if (!error) fetchCollaborators();
  };

  const updateTier = (id, field, value) => {
    setTiers(prev =>
      prev.map(t => t.id === id ? { ...t, [field]: value } : t)
    );
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

      <div className="ajuste-section glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>👥 Gestión de Colaboradores</h2>
        
        <div className="add-collab-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px auto', gap: '10px', marginBottom: '2rem' }}>
          <input 
            type="text" 
            placeholder="Nombre" 
            value={newCollab.name} 
            onChange={e => setNewCollab({...newCollab, name: e.target.value})}
            className="tier-input"
          />
          <input 
            type="text" 
            placeholder="Área" 
            value={newCollab.area} 
            onChange={e => setNewCollab({...newCollab, area: e.target.value})}
            className="tier-input"
          />
          <input 
            type="number" 
            placeholder="Puntaje" 
            value={newCollab.score} 
            onChange={e => setNewCollab({...newCollab, score: parseInt(e.target.value) || 0})}
            className="tier-input"
          />
          <input 
            type="number" 
            placeholder="Logros" 
            value={newCollab.achievements} 
            onChange={e => setNewCollab({...newCollab, achievements: parseInt(e.target.value) || 0})}
            className="tier-input"
          />
          <button onClick={addCollaborator} className="save-btn" style={{ padding: '8px 20px' }}>Agregar</button>
        </div>

        <div className="collab-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                  <td>{c.name}</td>
                  <td>{c.area}</td>
                  <td>{c.score}</td>
                  <td>{c.achievements}</td>
                  <td>
                    <button onClick={() => deleteCollaborator(c.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ajuste-section glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>🏆 Configuración de Niveles</h2>
        <div className="tiers-grid">
          {displayTiers.map((tier) => (
            <div key={tier.id} className="tier-card" style={{ borderTop: `3px solid ${tier.color}`, padding: '15px', marginBottom: '10px', background: '#f9fafb', borderRadius: '12px' }}>
              <div className="tier-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TowerIcon color={tier.color} size={18} id={`ajuste-card-${tier.id}`} />
                <span className="tier-card-name" style={{ color: tier.color, fontWeight: 'bold' }}>{tier.name}</span>
              </div>
              <div className="tier-rank-range" style={{ fontSize: '0.8rem', margin: '10px 0' }}>
                Posición #{tier.minRank} → #{tier.maxRank >= 999 ? '∞' : tier.maxRank}
              </div>
              <div className="tier-row" style={{ display: 'flex', gap: '10px' }}>
                <div className="tier-toggle">
                  <span style={{ fontSize: '0.7rem' }}>HO</span>
                  <button className={`toggle-btn ${tier.homeOffice ? 'on' : 'off'}`} onClick={() => updateTier(tier.id, 'homeOffice', !tier.homeOffice)}> {tier.homeOffice ? '✅' : '❌'}</button>
                </div>
                <div className="tier-toggle">
                  <span style={{ fontSize: '0.7rem' }}>Bono</span>
                  <button className={`toggle-btn ${tier.bono ? 'on' : 'off'}`} onClick={() => updateTier(tier.id, 'bono', !tier.bono)}> {tier.bono ? '✅' : '❌'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AjusteView;
