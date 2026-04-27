// Local mock of the user state to sync between Profile and Ranking
// In a real app, this would come from a Global State (Context/Redux) or a DB.

export const MOCK_USER = {
  id: 3, 
  name: "Juan Pérez",
  area: "Sistemas",
  currentRank: 3,
  achievements: 12,
  skills: [
    {
      title: 'Trabajo en equipo',
      items: [
        { name: 'Adaptabilidad', value: 85 },
        { name: 'Resolución de problemas', value: 92 },
        { name: 'Objetividad', value: 78 },
        { name: 'Integración', value: 88 }
      ]
    },
    {
      title: 'Disciplina',
      items: [
        { name: 'Responsabilidad', value: 95 },
        { name: 'Compromiso', value: 90 },
        { name: 'Autogestión', value: 82 }
      ]
    },
    {
      title: 'Servicio al cliente',
      items: [
        { name: 'Colaboración', value: 100 },
        { name: 'Negociación', value: 75 },
        { name: 'Comunicación', value: 92 },
        { name: 'Respeto', value: 100 }
      ]
    },
    {
      title: 'Participación',
      items: [
        { name: 'Creatividad', value: 80 },
        { name: 'Actitud positiva', value: 95 },
        { name: 'Iniciativa', value: 85 }
      ]
    }
  ]
};

// Logic to calculate overall total based on skills and achievements
export const calculateSkillsBase = (user) => {
  const groupAverages = user.skills.map(group => {
    const sum = group.items.reduce((acc, curr) => acc + curr.value, 0);
    return sum / group.items.length;
  });
  return groupAverages.reduce((acc, curr) => acc + curr, 0) / groupAverages.length;
};

export const calculateTotalScore = (user) => {
  const base = calculateSkillsBase(user);
  return Math.round(base) + (user.achievements * 5);
};
