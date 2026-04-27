// Shared tier data — ordered from LOWEST to HIGHEST (Soldado → General)
// minRank = mejor posición del tier | maxRank = peor posición del tier
export const TIERS = [
  {
    id: 'soldado',
    name: 'Soldado',
    icon: '⬜',
    color: '#9ca3af',        // gris
    colorName: 'Gris',
    reward: 'Plan de mejora personalizado',
    minRank: 71,
    maxRank: 999,
    homeOffice: false,
    bono: false,
    pillarHeight: 40,        // for the chart (relative %)
  },
  {
    id: 'cabo',
    name: 'Cabo',
    icon: '🟢',
    color: '#22c55e',        // verde
    colorName: 'Verde',
    reward: 'Reconocimiento mensual',
    minRank: 61,
    maxRank: 70,
    homeOffice: false,
    bono: false,
    pillarHeight: 50,
  },
  {
    id: 'sargento',
    name: 'Sargento',
    icon: '🔵',
    color: '#3b82f6',        // azul
    colorName: 'Azul',
    reward: 'Capacitación preferencial',
    minRank: 51,
    maxRank: 60,
    homeOffice: false,
    bono: false,
    pillarHeight: 58,
  },
  {
    id: 'teniente',
    name: 'Teniente',
    icon: '🟣',
    color: '#a855f7',        // morado
    colorName: 'Morado',
    reward: 'Home Office + Reconocimiento trimestral',
    minRank: 41,
    maxRank: 50,
    homeOffice: true,
    bono: false,
    pillarHeight: 65,
  },
  {
    id: 'capitan',
    name: 'Capitán',
    icon: '🟡',
    color: '#f59e0b',        // dorado
    colorName: 'Dorado',
    reward: 'Home Office + Gift card trimestral',
    minRank: 31,
    maxRank: 40,
    homeOffice: true,
    bono: false,
    pillarHeight: 73,
  },
  {
    id: 'mayor',
    name: 'Mayor',
    icon: '🔴',
    color: '#ef4444',        // rojo
    colorName: 'Rojo',
    reward: 'Bono semestral + Home Office',
    minRank: 21,
    maxRank: 30,
    homeOffice: true,
    bono: true,
    pillarHeight: 82,
  },
  {
    id: 'coronel',
    name: 'Coronel',
    icon: '⚫',
    color: '#475569',        // negro (dark slate)
    colorName: 'Negro',
    reward: 'Bono anual + Home Office + Día libre extra',
    minRank: 11,
    maxRank: 20,
    homeOffice: true,
    bono: true,
    pillarHeight: 91,
  },
  {
    id: 'general',
    name: 'General',
    icon: '🩵',
    color: '#06b6d4',        // celestial (cyan)
    colorName: 'Celestial',
    reward: 'Premio máximo + Día libre + Bono especial + Viaje',
    minRank: 1,
    maxRank: 10,
    homeOffice: true,
    bono: true,
    pillarHeight: 100,
  },
];

// Count how many of the 100 BASE_DATA collaborators fall in each tier
export const countCollabsInTier = (tier, totalCollabs = 100) => {
  if (tier.maxRank >= 999) {
    return Math.max(0, totalCollabs - (tier.minRank - 1));
  }
  return tier.maxRank - tier.minRank + 1;
};
