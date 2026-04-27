import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TIERS } from '../../data/tiersData';
import { calculateSkillsBase } from '../../data/userState';
import { supabase } from '../../supabaseClient';
import './ProfileView.css';

// Helper: rebuild skills_data JSONB from UI skillGroups array
const groupsToSkillsData = (groups) => {
  const g = (title) => groups.find(g => g.title === title)?.items || [];
  const val = (arr, idx) => arr[idx]?.value ?? 0;
  const te = g('Trabajo en equipo');
  const di = g('Disciplina');
  const se = g('Servicio al cliente');
  const pa = g('Participación');
  return {
    trabajo_equipo: { adaptabilidad: val(te,0), resolucion: val(te,1), objetividad: val(te,2), integracion: val(te,3) },
    disciplina:     { responsabilidad: val(di,0), compromiso: val(di,1), autogestion: val(di,2) },
    servicio:       { colaboracion: val(se,0), negociacion: val(se,1), comunicacion: val(se,2), respeto: val(se,3) },
    participacion:  { creatividad: val(pa,0), actitud: val(pa,1), iniciativa: val(pa,2) }
  };
};

const ProfileView = ({ searchTerm }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [skillGroups, setSkillGroups] = useState([]);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Debounce timer ref so we don't spam Supabase on every +/- click
  const saveTimer = useRef(null);

  // ── Fetch all collaborators ────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase.from('collaborators').select('*').order('name');
      if (!error && data.length > 0) setCollaborators(data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // ── Auto-select from global searchTerm ────────────────────────
  useEffect(() => {
    if (collaborators.length > 0) {
      if (!searchTerm) {
        setSelectedId(collaborators[0].id);
      } else {
        const match = collaborators.find(c =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (match) setSelectedId(match.id);
      }
    }
  }, [searchTerm, collaborators]);

  // ── Load selected collaborator's data into UI ────────────────
  useEffect(() => {
    if (!selectedId) return;
    const user = collaborators.find(c => c.id === selectedId);
    if (!user) return;

    setCurrentUser(user);
    setAchievementsCount(user.achievements || 0);

    const sd = user.skills_data || {};
    setSkillGroups([
      {
        title: 'Trabajo en equipo',
        items: [
          { name: 'Adaptabilidad',         value: sd.trabajo_equipo?.adaptabilidad || 0 },
          { name: 'Resolución de problemas', value: sd.trabajo_equipo?.resolucion   || 0 },
          { name: 'Objetividad',            value: sd.trabajo_equipo?.objetividad   || 0 },
          { name: 'Integración',            value: sd.trabajo_equipo?.integracion   || 0 }
        ]
      },
      {
        title: 'Disciplina',
        items: [
          { name: 'Responsabilidad', value: sd.disciplina?.responsabilidad || 0 },
          { name: 'Compromiso',      value: sd.disciplina?.compromiso      || 0 },
          { name: 'Autogestión',     value: sd.disciplina?.autogestion     || 0 }
        ]
      },
      {
        title: 'Servicio al cliente',
        items: [
          { name: 'Colaboración', value: sd.servicio?.colaboracion || 0 },
          { name: 'Negociación',  value: sd.servicio?.negociacion  || 0 },
          { name: 'Comunicación', value: sd.servicio?.comunicacion || 0 },
          { name: 'Respeto',      value: sd.servicio?.respeto      || 0 }
        ]
      },
      {
        title: 'Participación',
        items: [
          { name: 'Creatividad',    value: sd.participacion?.creatividad || 0 },
          { name: 'Actitud positiva', value: sd.participacion?.actitud   || 0 },
          { name: 'Iniciativa',     value: sd.participacion?.iniciativa  || 0 }
        ]
      }
    ]);
  }, [selectedId, collaborators]);

  // ── Persist score + skills_data + achievements to Supabase ────
  const persistToSupabase = useCallback((groups, ach) => {
    if (!selectedId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const skillsBase = Math.round(calculateSkillsBase({ skills: groups }));
      const newScore = skillsBase + ach * 5;
      const skills_data = groupsToSkillsData(groups);

      const { error } = await supabase
        .from('collaborators')
        .update({ score: newScore, achievements: ach, skills_data })
        .eq('id', selectedId);

      if (!error) {
        // Silently refresh local list so Ranking picks up the new score
        setCollaborators(prev =>
          prev.map(c => c.id === selectedId ? { ...c, score: newScore, achievements: ach, skills_data } : c)
        );
      }
      setSaving(false);
    }, 800); // 800 ms debounce
  }, [selectedId]);

  // ── Update a skill value and trigger save ─────────────────────
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
    persistToSupabase(newGroups, achievementsCount);
  };

  // ── Update achievements and trigger save ──────────────────────
  const incrementAchievements = () => {
    const next = achievementsCount + 1;
    setAchievementsCount(next);
    persistToSupabase(skillGroups, next);
  };

  // ── Render ────────────────────────────────────────────────────
  if (loading || !currentUser) return (
    <div className="profile-container">
      <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Cargando perfil...
      </p>
    </div>
  );

  const skillsBaseRaw   = calculateSkillsBase({ skills: skillGroups });
  const skillsBaseScore = Math.round(skillsBaseRaw);
  const overallTotal    = skillsBaseScore + achievementsCount * 5;

  const currentRank = currentUser.rank_position || 1;
  const currentTier = TIERS.find(t => currentRank >= t.minRank && currentRank <= (t.maxRank || 999)) || TIERS[0];
  const tierColor   = currentTier.color;

  return (
    <div className="profile-container animate-fade">

      {/* Saving indicator */}
      {saving && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 999,
          background: 'var(--primary)', color: '#fff',
          padding: '8px 18px', borderRadius: '20px',
          fontSize: '0.82rem', fontWeight: '600', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          animation: 'fadeIn .2s ease'
        }}>
          💾 Guardando en Ranking...
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-left-col">
          <section className="profile-sidebar glass-panel">
            <div
              className="photo-placeholder"
              style={{ borderColor: tierColor, boxShadow: `0 0 20px ${tierColor}66` }}
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
              <div className="total-fill" style={{ width: `${Math.min(overallTotal, 100)}%` }} />
            </div>
            <span className="total-hint">Base {skillsBaseScore} + {achievementsCount} logros × 5 pts</span>
          </div>

          <div className="achievements-box glass-panel">
            <span className="summary-label">N. Logros</span>
            <div className="achievements-indicator">
              <span className="bracket">&lt;</span>
              <span className="number">{achievementsCount}</span>
              <span className="bracket">&gt;</span>
              <div className="ach-badge-btn" onClick={incrementAchievements}>+</div>
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
                  <span className="group-avg-badge">
                    {Math.round(group.items.reduce((a, b) => a + b.value, 0) / group.items.length)}
                  </span>
                </div>
                <div className="skills-list">
                  {group.items.map((skill, sIdx) => (
                    <div key={sIdx} className="skill-item-interactive">
                      <div className="skill-controls-row">
                        <button className="control-btn" onClick={() => updateSkill(gIdx, sIdx, -1)}>-</button>
                        <button className="control-btn" onClick={() => updateSkill(gIdx, sIdx,  1)}>+</button>
                      </div>
                      <div className="skill-content">
                        <div className="skill-info">
                          <span className="skill-name">{skill.name}</span>
                          <span className="skill-value-int">{skill.value}</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${skill.value}%` }} />
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
