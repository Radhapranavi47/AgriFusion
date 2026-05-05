const calculateGrowthStage = (sowingDate) => {
  if (!sowingDate) {
    throw new Error('sowingDate is required');
  }

  const sowing = new Date(sowingDate);
  if (Number.isNaN(sowing.getTime())) {
    throw new Error('Invalid sowingDate');
  }

  const now = new Date();
  const diffInMs = now - sowing;
  const daysSinceSowing = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (daysSinceSowing < 30) return 1;
  if (daysSinceSowing < 60) return 2;
  if (daysSinceSowing < 90) return 3;
  return 4;
};

module.exports = {
  calculateGrowthStage,
};


