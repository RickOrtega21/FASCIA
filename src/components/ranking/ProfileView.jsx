import React, { useState, useEffect } from 'react';
import { TIERS } from '../../data/tiersData';
import { calculateSkillsBase } from '../../data/userState';
import { supabase } from '../../supabaseClient';
import './ProfileView.css';

const ProfileView = () => {
  const [collaborators, setCollaborators] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [skillGroups, setSkillGroups] = useState([]);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase.from('collaborators').select('*').order('name');
      if (!error && data.length > 0) {
        setCollaborators(data);
        setSelectedId(data[0].id);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const user = collaborators.find(c => c.id === selectedId);
      if (user) {
        setCurrentUser(user);
        setAchievementsCount(user.achievements || 0);
        
        // Map skills_data from DB to our internal UI structure
        const sd = user.skills_data || {};
        const groups = [
          {
            title: 'Trabajo en equipo',
            items: [
              { name: 'Adaptabilidad', value: sd.trabajo_equipo?.adaptabilidad || 0 },
              { name: 'Resolución de problemas', value: sd.trabajo_equipo?.resolucion || 0 },
              { name: 'Objetividad', value: sd.trabajo_equipo?.objetividad || 0 },
              { name: 'Integración', value: sd.trabajo_equipo?.integracion || 0 }
            ]
          },
          {
            title: 'Disciplina',
            items: [
              { name: 'Responsabilidad', value: sd.disciplina?.responsabilidad || 0 },
              { name: 'Compromiso', value: sd.disciplina?.compromiso || 0 },
              { name: 'Autogestión', value: sd.disciplina?.autogestion || 0 }
            ]
          },
          {
            title: 'Servicio al cliente',
            items: [
              { name: 'Colaboración', value: sd.servicio?.colaboracion || 0 },
              { name: 'Negociación', value: sd.servicio?.negociacion || 0 },
              { name: 'Comunicación', value: sd.servicio?.comunicacion || 0 },
              { name: 'Respeto', value: sd.servicio?.respeto || 0 }
            ]
          },
          {
            title: 'Participación',
            items: [
              { name: 'Creatividad', value: sd.participacion?.creatividad || 0 },
              { name: 'Actitud positiva', value: sd.participacion?.actitud || 0 },
              { name: 'Iniciativa', value: sd.participacion?.iniciativa || 0 }
            ]
          }
        ];
        setSkillGroups(groups);
      }
    }
  }, [selectedId, collaborators]);

  const updateSkill = (groupIndex, skillIndex, delta) => {
    const newGroups = skillGroups.map((g, gi) =>
      gi !== groupIndex ? g : {
        ...g,
        items: g.items.map((s, si) =>
          si !== skillIndex ? s : { ...s, value: Math.min(100, Math.max(0, s.value + delta)) }
        )
      }
    );
    setSkillGroups(newGroups);
  };

  if (loading || !currentUser) return <div className="profile-container"><p>Cargando perfil...</p></div>;

  const skillsBaseRaw = calculateSkillsBase({ skills: skillGroups });
  const skillsBaseScore = Math.round(skillsBaseRaw);
  const overallTotal = skillsBaseScore + achievementsCount * 5;
  
  const currentRank = currentUser.rank_position || 1; // Simulated rank
  const currentTier = TIERS.find(t => currentRank >= t.minRank && currentRank <= (t.maxRank || 999)) || TIERS[0];
  const tierColor = currentTier.color;

  return (
    <div className="profile-container animate-fade">
      <div className="profile-selector glass-panel" style={{ marginBottom: '20px', padding: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Seleccionar Colaborador:</span>
        <select 
          value={selectedId} 
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', flex: 1, maxWidth: '300px' }}
        >
          {collaborators.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.area})</option>
          ))}
        </select>
      </div>

      <div className="profile-layout">
        <div className="profile-left-col">
          <section className="profile-sidebar glass-panel">
            <div 
              className="photo-placeholder"
              style={{ 
                borderColor: tierColor,
                boxShadow: `0 0 20px ${tierColor}66`
              }}
            >
              <span className="icon-user">👤</span>
            </div>
            <div className="profile-info-tags">
              <div className="info-item">
                <span className="label">NOMBRE:</span>
                <span className="value">{currentUser.name}</span>
              </div>
              <div className="info-item">
                <span className="label">ÁREA:</span>
                <span className="value area-accent">{currentUser.area}</span>
              </div>
            </div>
            <div className="profile-tagline">
              "Comprometido con la excelencia operativa y el crecimiento colaborativo."
            </div>
          </section>

          <div className="total-main glass-panel">
            <span className="summary-label">Puntaje Total</span>
            <span className="summary-value">{overallTotal}</span>
            <div className="total-bar">
              <div
                className="total-fill"
                style={{ width: `${Math.min(overallTotal, 100)}%` }}
              ></div>
            </div>
            <span className="total-hint">Base {skillsBaseScore} + {achievementsCount} logros × 5 pts</span>
          </div>

          <div className="achievements-box glass-panel">
            <span className="summary-label">N. Logros</span>
            <div className="achievements-indicator">
              <span className="bracket">&lt;</span>
              <span className="number">{achievementsCount}</span>
              <span className="bracket">&gt;</span>
              <div
                className="ach-badge-btn"
                onClick={() => setAchievementsCount(prev => prev + 1)}
              >+</div>
            </div>
            <span className="logros-hint">+5 pts al total por logro</span>
          </div>
        </div>

        <section className="skills-main glass-panel">
          <header className="skills-header">
            <h2>Gestión de Habilidades</h2>
          </header>

          <div className="groups-container">
            {skillGroups.map((group, gIdx) => (
              <div key={gIdx} className="skill-group">
                <div className="group-title-row">
                  <h3 className="group-title">{group.title}</h3>
                  <span className="group-avg-badge">{Math.round(group.items.reduce((a,b)=>a+b.value,0)/group.items.length)}</span>
                </div>
                <div className="skills-list">
                  {group.items.map((skill, sIdx) => (
                    <div key={sIdx} className="skill-item-interactive">
                      <div className="skill-controls-row">
                        <button className="control-btn" onClick={() => updateSkill(gIdx, sIdx, -1)}>-</button>
                        <button className="control-btn" onClick={() => updateSkill(gIdx, sIdx, 1)}>+</button>
                      </div>
                      <div className="skill-content">
                        <div className="skill-info">
                          <span className="skill-name">{skill.name}</span>
                          <span className="skill-value-int">{skill.value}</span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${skill.value}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfileView;
