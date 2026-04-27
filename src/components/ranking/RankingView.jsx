import React, { useMemo, useState, useEffect } from 'react';
import { calculateTotalScore } from '../../data/userState';
import { supabase } from '../../supabaseClient';
import './RankingView.css';

const PAGE_SIZE = 25;

const RankingView = ({ searchTerm, areaFilter }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [viewMode, setViewMode] = useState('colaborador'); // 'colaborador' | 'area'
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCollaborators = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('collaborators')
      .select('*')
      .order('score', { ascending: false });

    if (error) {
      console.error('Error fetching collaborators:', error);
    } else {
      setCollaborators(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const baseData = useMemo(() => {
    return collaborators.map((c, idx) => ({ ...c, globalRank: idx + 1 }));
  }, [collaborators]);

  // ── View: by Area  ─────────────────────────────────────────────
  const areaRanking = useMemo(() => {
    const map = {};
    baseData.forEach(c => {
      if (!map[c.area]) map[c.area] = { area: c.area, totalScore: 0, count: 0, achievements: 0 };
      map[c.area].totalScore += (c.score || 0);
      map[c.area].count += 1;
      map[c.area].achievements += (c.achievements || 0);
    });
    return Object.values(map)
      .map(a => ({ ...a, avgScore: Math.round(a.totalScore / a.count) }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((a, idx) => ({ ...a, rank: idx + 1 }));
  }, [baseData]);

  // ── View: by Collaborator (filtered, position preserved) ────────
  const filteredWithRealRank = useMemo(() => {
    return baseData.filter(c => {
      const matchesName = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArea = areaFilter === 'Todas' || c.area === areaFilter;
      return matchesName && matchesArea;
    });
  }, [baseData, searchTerm, areaFilter]);

  // Pagination
  const totalItems = viewMode === 'area' ? areaRanking.length : filteredWithRealRank.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageSlice = (arr) => arr.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const visibleCollabs = pageSlice(filteredWithRealRank);
  const visibleAreas = pageSlice(areaRanking);

  const goFirst = () => setPage(1);
  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(totalPages, p + 1));
  const goLast = () => setPage(totalPages);

  // reset page when filters change
  useEffect(() => { setPage(1); }, [searchTerm, areaFilter, viewMode]);

  if (loading) return <div className="ranking-container"><p>Cargando ranking...</p></div>;

  return (
    <div className="ranking-container animate-fade">
      {/* ── Header ── */}
      <div className="ranking-header">
        <div className="ranking-title-group">
          <h1>Ranking General</h1>
          <div className="view-toggle-btns">
            <button
              className={`view-btn ${viewMode === 'colaborador' ? 'active' : ''}`}
              onClick={() => setViewMode('colaborador')}
            >👤 Ver por Colaborador</button>
            <button
              className={`view-btn ${viewMode === 'area' ? 'active' : ''}`}
              onClick={() => setViewMode('area')}
            >🏢 Ver por Área</button>
          </div>
        </div>
        <div className="ranking-stats glass-panel">
          <div className="stat-item">
            <span className="stat-label">Resultados</span>
            <span className="stat-value">{totalItems}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Página</span>
            <span className="stat-value">{safePage}/{totalPages}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Área Filtrada</span>
            <span className="stat-value" style={{ fontSize: '1rem', color: 'var(--accent)' }}>{areaFilter}</span>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="table-container glass-panel">
        {viewMode === 'colaborador' ? (
          <table className="ranking-table">
            <thead>
              <tr>
                <th>N</th>
                <th>Colaborador</th>
                <th>Área</th>
                <th>Puntaje</th>
                <th>N. Logros</th>
              </tr>
            </thead>
            <tbody>
              {visibleCollabs.map((collab) => (
                <tr key={collab.id} className={
                  collab.globalRank === 1 ? 'top-1' :
                  collab.globalRank === 2 ? 'top-2' :
                  collab.globalRank === 3 ? 'top-3' : ''
                }>
                  <td className="rank-col"># {collab.globalRank}</td>
                  <td className="name-col">{collab.name}</td>
                  <td className="area-col">
                    <span className="area-tag">{collab.area}</span>
                  </td>
                  <td className="score-col">
                    <div className="score-bar-container">
                      <div className="score-bar" style={{ width: `${collab.score}%` }}></div>
                      <span className="score-text">{collab.score}</span>
                    </div>
                  </td>
                  <td className="achievements-col">
                    <span className="badge">{collab.achievements}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="ranking-table">
            <thead>
              <tr>
                <th>N</th>
                <th>Área</th>
                <th>Colaboradores</th>
                <th>Puntaje Promedio</th>
                <th>Logros Total</th>
              </tr>
            </thead>
            <tbody>
              {visibleAreas.map((area) => (
                <tr key={area.area} className={
                  area.rank === 1 ? 'top-1' : area.rank === 2 ? 'top-2' : area.rank === 3 ? 'top-3' : ''
                }>
                  <td className="rank-col"># {area.rank}</td>
                  <td className="name-col">
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{area.area}</span>
                  </td>
                  <td className="achievements-col">
                    <span className="badge">{area.count}</span>
                  </td>
                  <td className="score-col">
                    <div className="score-bar-container">
                      <div className="score-bar" style={{ width: `${area.avgScore}%` }}></div>
                      <span className="score-text">{area.avgScore}</span>
                    </div>
                  </td>
                  <td className="achievements-col">
                    <span className="badge">{area.achievements}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalItems === 0 && (
          <div className="no-results-msg">
            No se encontraron resultados para "{searchTerm}" en {areaFilter}.
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      <div className="pagination-bar glass-panel">
        <span className="pagination-info">{totalItems} resultados</span>
        <div className="pagination-controls">
          <button className="pag-btn" onClick={goFirst} title="Primera página">⏮</button>
          <button className="pag-btn" onClick={goPrev} title="Anterior">◀</button>
          <span className="pag-indicator">{safePage} / {totalPages}</span>
          <button className="pag-btn" onClick={goNext} title="Siguiente">▶</button>
          <button className="pag-btn" onClick={goLast} title="Última página">⏭</button>
        </div>
      </div>
    </div>
  );
};

export default RankingView;
