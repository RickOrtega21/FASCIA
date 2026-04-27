import React, { useState, useEffect } from 'react';
import { TIERS } from '../../data/tiersData';
import TowerIcon from './TowerIcon';
import { supabase } from '../../supabaseClient';
import './DashboardView.css';

const DashboardView = () => {
  const [hoveredTier, setHoveredTier] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from('collaborators')
        .select('score')
        .order('score', { ascending: false });
      
      if (!error) {
        setCollaborators(data || []);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const totalCollabs = collaborators.length;

  const countCollabsInTier = (tier) => {
    // Assuming position is index + 1 in sorted list
    const startIndex = tier.minRank - 1;
    const endIndex = tier.maxRank >= 999 ? totalCollabs : tier.maxRank;
    
    // Safety check
    if (startIndex >= totalCollabs) return 0;
    
    // Range is [startIndex, Math.min(endIndex, totalCollabs))
    const actualEnd = Math.min(endIndex, totalCollabs);
    const count = actualEnd - startIndex;
    return Math.max(0, count);
  };

  const tiersWithCount = TIERS.map(tier => ({
    ...tier,
    count: countCollabsInTier(tier),
  }));

  const maxCount = Math.max(...tiersWithCount.map(t => t.count), 1);

  const withBonus = tiersWithCount.filter(t => t.bono).reduce((s, t) => s + t.count, 0);
  const withHO    = tiersWithCount.filter(t => t.homeOffice).reduce((s, t) => s + t.count, 0);

  if (loading) return <div className="dashboard-container"><p>Cargando estadísticas...</p></div>;

  return (
    <div className="dashboard-container animate-fade">
      <div className="dashboard-header">
        <h1>Dashboard — Distribución por Nivel</h1>
        <p className="dash-subtitle">
          Visualización de los {totalCollabs} colaboradores registrados.
        </p>
      </div>

      <div className="kpi-row">
        <div className="kpi-card glass-panel">
          <span className="kpi-label">Total Colaboradores</span>
          <span className="kpi-value">{totalCollabs}</span>
        </div>
        <div className="kpi-card glass-panel">
          <span className="kpi-label">Con Derecho a Bono</span>
          <span className="kpi-value" style={{ color: '#22c55e' }}>{withBonus}</span>
        </div>
        <div className="kpi-card glass-panel">
          <span className="kpi-label">Con Home Office</span>
          <span className="kpi-value" style={{ color: '#06b6d4' }}>{withHO}</span>
        </div>
        <div className="kpi-card glass-panel">
          <span className="kpi-label">Sin Bono</span>
          <span className="kpi-value" style={{ color: '#9ca3af' }}>{totalCollabs - withBonus}</span>
        </div>
      </div>

      <div className="chart-section glass-panel">
        <h2 className="chart-title">Clasificación por Nivel</h2>
        <div className="pillar-chart">
          {tiersWithCount.map(tier => {
            const isHovered = hoveredTier === tier.id;
            const barHeightPct = Math.max(8, Math.round((tier.count / maxCount) * 100));

            return (
              <div
                key={tier.id}
                className={`pillar-col ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredTier(tier.id)}
                onMouseLeave={() => setHoveredTier(null)}
              >
                {isHovered && (
                  <div className="pillar-tooltip" style={{ borderColor: tier.color }}>
                    <span className="tt-name" style={{ color: tier.color }}>{tier.name}</span>
                    <span className="tt-count">{tier.count} colaboradores</span>
                    <div className="tt-badges">
                      <span className={`tt-badge ${tier.bono ? 'yes' : 'no'}`}>Bono: {tier.bono ? 'Sí' : 'No'}</span>
                      <span className={`tt-badge ${tier.homeOffice ? 'yes' : 'no'}`}>HO: {tier.homeOffice ? 'Sí' : 'No'}</span>
                    </div>
                  </div>
                )}
                <span className="pillar-count" style={{ color: tier.color }}>{tier.count}</span>
                <div
                  className="pillar-badge"
                  style={{ boxShadow: isHovered ? `0 0 18px ${tier.color}88` : 'none' }}
                >
                  <TowerIcon color={tier.color} size={isHovered ? 28 : 22} id={`dash-${tier.id}`} />
                </div>
                <div
                  className="pillar-bar"
                  style={{
                    height: `${barHeightPct}%`,
                    background: `linear-gradient(to top, ${tier.color}cc, ${tier.color}44)`,
                    boxShadow: isHovered ? `0 0 20px ${tier.color}66` : `0 0 8px ${tier.color}22`,
                    borderTop: `2px solid ${tier.color}`,
                  }}
                />
                <span className="pillar-label" style={{ color: isHovered ? tier.color : 'var(--text-light)' }}>
                  {tier.name}
                </span>
              </div>
            );
          })}
        </div>
        <div className="chart-baseline" />
      </div>

      <div className="dist-table-wrap glass-panel">
        <h2 className="chart-title">Detalle por Nivel</h2>
        <table className="dist-table">
          <thead>
            <tr>
              <th>Nivel</th>
              <th>Rango de Posición</th>
              <th>Colaboradores</th>
              <th>% del Total</th>
              <th>Bono</th>
              <th>Home Office</th>
            </tr>
          </thead>
          <tbody>
            {[...tiersWithCount].reverse().map(tier => (
              <tr key={tier.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TowerIcon color={tier.color} size={18} id={`dash-tbl-${tier.id}`} />
                    <strong style={{ color: tier.color }}>{tier.name}</strong>
                  </div>
                </td>
                <td>#{tier.minRank} – #{tier.maxRank >= 999 ? '∞' : tier.maxRank}</td>
                <td><span className="dt-count" style={{ color: tier.color }}>{tier.count}</span></td>
                <td>{totalCollabs > 0 ? Math.round((tier.count / totalCollabs) * 100) : 0}%</td>
                <td><span className={`dt-badge ${tier.bono ? 'yes' : 'no'}`}>{tier.bono ? '✅ Sí' : '❌ No'}</span></td>
                <td><span className={`dt-badge ${tier.homeOffice ? 'yes' : 'no'}`}>{tier.homeOffice ? '✅ Sí' : '❌ No'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardView;
