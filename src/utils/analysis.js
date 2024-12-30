import _ from 'lodash';

// Convert boulder grades to numerical values for comparison
export const boulderGradeToNumber = (grade) => {
  if (!grade || typeof grade !== 'string') return null;
  const match = grade.match(/V(\d+)/);
  return match ? parseInt(match[1]) : null;
};

// Convert lead grades to numerical values
export const leadGradeToNumber = (grade) => {
  if (!grade || typeof grade !== 'string') return null;
  const match = grade.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

// Calculate progression rate between assessments
export const calculateProgressionRate = (assessments) => {
  if (!assessments || assessments.length < 2) return null;

  const sortedAssessments = [...assessments].sort(
    (a, b) => new Date(a['Assessment Date']) - new Date(b['Assessment Date'])
  );

  const first = sortedAssessments[0];
  const last = sortedAssessments[sortedAssessments.length - 1];
  
  const firstBoulderGrade = boulderGradeToNumber(first['Boulder 80% Grade']);
  const lastBoulderGrade = boulderGradeToNumber(last['Boulder 80% Grade']);
  
  if (firstBoulderGrade === null || lastBoulderGrade === null) return null;
  
  const monthsDiff = (new Date(last['Assessment Date']) - new Date(first['Assessment Date'])) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsDiff === 0) return 0;
  
  return (lastBoulderGrade - firstBoulderGrade) / monthsDiff;
};

// Generate insights based on assessment history
export const generateInsights = (assessments) => {
  if (!assessments || assessments.length === 0) return [];

  const insights = [];
  const latest = assessments[assessments.length - 1];
  const progressionRate = calculateProgressionRate(assessments);

  // Boulder grade insights
  const latestBoulderGrade = boulderGradeToNumber(latest['Boulder 80% Grade']);
  if (latestBoulderGrade !== null) {
    if (latestBoulderGrade >= 7) {
      insights.push({
        type: 'positive',
        message: 'Your boulder grade is impressive! Consider focusing on specific weaknesses to break through plateaus.'
      });
    } else if (latestBoulderGrade <= 3) {
      insights.push({
        type: 'info',
        message: 'Focus on technique and movement patterns to build a strong foundation for harder grades.'
      });
    }
  }

  // Progression rate insights
  if (progressionRate !== null) {
    if (progressionRate > 0.5) {
      insights.push({
        type: 'positive',
        message: 'Great progress! Your climbing grade is improving at an impressive rate.'
      });
    } else if (progressionRate < 0.1 && assessments.length > 2) {
      insights.push({
        type: 'warning',
        message: 'Your progression has slowed. Consider varying your training routine or seeking coaching.'
      });
    }
  }

  // Finger strength insights
  const bodyWeight = parseFloat(latest['Personal Info']['Weight']);
  const addedWeight = parseFloat(latest['Finger Strength Weight']);
  const fingerStrength = (addedWeight + bodyWeight) / bodyWeight * 100;
  
  if (!isNaN(fingerStrength)) {
    if (fingerStrength > 150) {
      insights.push({
        type: 'positive',
        message: `Your finger strength is well-developed at ${fingerStrength.toFixed(1)}% of your body weight (${addedWeight}kg added to ${bodyWeight}kg). Remember to maintain proper rest and recovery.`
      });
    } else if (fingerStrength < 120) {
      insights.push({
        type: 'info',
        message: `Your current finger strength is ${fingerStrength.toFixed(1)}% of your body weight (${addedWeight}kg added to ${bodyWeight}kg). Consider incorporating more structured hangboard training to improve finger strength, aiming for at least 150% of your body weight.`
      });
    }
  }

  // Pull-ups insights
  const pullUps = parseInt(latest['Pull Up Repetitions']);
  if (!isNaN(pullUps)) {
    if (pullUps > 15) {
      insights.push({
        type: 'positive',
        message: 'Strong pull-up performance! Consider adding weight or trying one-arm variations.'
      });
    } else if (pullUps < 5) {
      insights.push({
        type: 'info',
        message: 'Work on building pull-up strength with assisted variations or negatives.'
      });
    }
  }

  return insights;
};

export const calculateStrengthRatios = (assessment) => {
  const ratios = {};
  
  const pullUps = parseInt(assessment['Pull Up Repetitions']) || 0;
  const pushUps = parseInt(assessment['Push Up Repetitions']) || 0;
  
  if (pullUps > 0) {
    ratios.pushToPull = pushUps / pullUps;
  }
  
  return ratios;
};

export const findPlateaus = (assessments, metric) => {
  if (!assessments || assessments.length < 3) return [];
  
  const sorted = _.sortBy(assessments, 'Assessment Date');
  const plateaus = [];
  let plateauStart = null;
  let previousValue = sorted[0][metric];
  let plateauCount = 1;
  
  for (let i = 1; i < sorted.length; i++) {
    const currentValue = sorted[i][metric];
    if (currentValue === null || previousValue === null) continue;
    
    const diff = Math.abs(currentValue - previousValue);
    const threshold = previousValue * 0.05;
    
    if (diff < threshold) {
      if (!plateauStart) {
        plateauStart = sorted[i-1]['Assessment Date'];
      }
      plateauCount++;
    } else {
      if (plateauCount >= 3) {
        plateaus.push({
          metric,
          start: plateauStart,
          end: sorted[i-1]['Assessment Date'],
          value: previousValue,
          duration: plateauCount
        });
      }
      plateauStart = null;
      plateauCount = 1;
    }
    previousValue = currentValue;
  }
  
  if (plateauCount >= 3) {
    plateaus.push({
      metric,
      start: plateauStart,
      end: sorted[sorted.length-1]['Assessment Date'],
      value: previousValue,
      duration: plateauCount
    });
  }
  
  return plateaus;
};

// Normalize metrics according to specified formulas
const normalizeMetrics = (assessment) => {
  const metrics = {
    fingerStrength: 0,
    pullUps: 0,
    pushUps: 0,
    coreStrength: 0,
    flexibility: 0
  };

  if (!assessment) return metrics;

  // Get basic measurements
  const bodyWeight = Number(assessment.Personal_Info?.Weight) || 70;
  const height = Number(assessment.Personal_Info?.Height) || 170;

  console.log('Basic measurements:', {
    bodyWeight,
    height,
    rawWeight: assessment.Personal_Info?.Weight,
    rawHeight: assessment.Personal_Info?.Height
  });

  // Normalize finger strength: (added_weight + body_weight) / body_weight
  const fingerWeight = Number(assessment['Finger Strength Weight']) || 0;
  if (bodyWeight > 0) {
    metrics.fingerStrength = (fingerWeight + bodyWeight) / bodyWeight;
    console.log('Finger strength calculation:', {
      fingerWeight,
      bodyWeight,
      normalized: metrics.fingerStrength
    });
  }

  // Normalize strength metrics relative to body weight
  const pullUps = Number(assessment['Pull Up Repetitions']) || 0;
  metrics.pullUps = pullUps / bodyWeight;

  const pushUps = Number(assessment['Push Up Repetitions']) || 0;
  metrics.pushUps = pushUps / bodyWeight;

  const toeToBar = Number(assessment['Toe To bar Repetitions']) || 0;
  metrics.coreStrength = toeToBar / bodyWeight;

  // Normalize flexibility: leg_spread_distance / height
  const legSpread = Number(assessment['Leg Spread']) || 0;
  console.log('Leg spread raw value:', {
    raw: assessment['Leg Spread'],
    converted: legSpread
  });
  
  if (height > 0) {
    metrics.flexibility = legSpread / height;
    console.log('Flexibility calculation:', {
      legSpread,
      height,
      normalized: metrics.flexibility
    });
  }

  console.log('Final normalized metrics:', metrics);
  return metrics;
};

// Calculate composite score with specified weights
const calculateCompositeScore = (metrics) => {
  const weightedScores = {
    fingerStrength: 0.45 * metrics.fingerStrength,
    pullUps: 0.15 * metrics.pullUps,
    pushUps: 0.10 * metrics.pushUps,
    coreStrength: 0.20 * metrics.coreStrength,
    flexibility: 0.10 * metrics.flexibility
  };

  console.log('Weighted scores:', weightedScores);

  const totalScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
  console.log('Total composite score:', totalScore);

  return totalScore;
};

// Calculate performance metrics and recommendations
export const analyzePerformance = (assessment) => {
  if (!assessment) return null;

  const metrics = normalizeMetrics(assessment);
  const compositeScore = calculateCompositeScore(metrics);

  // Find strongest and weakest areas
  const areas = [
    { name: 'Finger Strength', value: metrics.fingerStrength, weight: 0.45 },
    { name: 'Pull-ups', value: metrics.pullUps, weight: 0.15 },
    { name: 'Core Strength', value: metrics.coreStrength, weight: 0.20 },
    { name: 'Push-ups', value: metrics.pushUps, weight: 0.10 },
    { name: 'Flexibility', value: metrics.flexibility, weight: 0.10 }
  ];

  const sortedAreas = [...areas].sort((a, b) => b.value - a.value);
  const strongestArea = sortedAreas[0];
  const weakestArea = sortedAreas[sortedAreas.length - 1];

  // Calculate confidence score (0-100)
  const confidenceScore = Math.round((compositeScore / 1.45) * 100);

  // Generate training recommendations
  const primaryFocus = weakestArea.name;
  const secondaryFocus = sortedAreas[sortedAreas.length - 2].name;

  // Training recommendations based on weakest areas
  const trainingRecommendations = {
    'Finger Strength': 'Focus on hangboard training with proper rest periods',
    'Pull-ups': 'Incorporate weighted pull-ups and lock-off exercises',
    'Core Strength': 'Add front lever progressions and toe-to-bar variations',
    'Push-ups': 'Include antagonist training and shoulder stability work',
    'Flexibility': 'Regular stretching sessions focusing on hip mobility'
  };

  return {
    strongestArea: strongestArea.name,
    weakestArea: weakestArea.name,
    confidenceScore,
    primaryFocus: trainingRecommendations[primaryFocus],
    secondaryFocus: trainingRecommendations[secondaryFocus]
  };
};

// Convert boulder grade to French grade
const boulderToFrench = {
  'V0': '6a',
  'V1': '6b+',
  'V2': '6c',
  'V3': '6c+',
  'V4': '7a',
  'V5': '7a+',
  'V6': '7b',
  'V7': '7b+',
  'V8': '7c',
  'V9': '7c+',
  'V10': '8a',
  'V11': '8a+',
  'V12': '8b',
  'V13': '8b+',
  'V14': '8c',
  'V15': '8c+'
};

// Predict climbing grade based on composite score
export const predictGrade = (assessment) => {
  if (!assessment) return { boulder: null, lead: null, analysis: null };

  const metrics = normalizeMetrics(assessment);
  const compositeScore = calculateCompositeScore(metrics);
  const analysis = analyzePerformance(assessment);

  // Boulder grade thresholds
  let boulderGrade;
  if (compositeScore > 1.45) boulderGrade = 'V12';
  else if (compositeScore >= 1.30) boulderGrade = 'V11';
  else if (compositeScore >= 1.15) boulderGrade = 'V10';
  else if (compositeScore >= 1.05) boulderGrade = 'V9';
  else if (compositeScore >= 0.95) boulderGrade = 'V8';
  else if (compositeScore >= 0.85) boulderGrade = 'V7';
  else if (compositeScore >= 0.75) boulderGrade = 'V6';
  else if (compositeScore >= 0.65) boulderGrade = 'V5';
  else boulderGrade = 'V4';

  // Convert to French grade for lead
  const leadGrade = boulderToFrench[boulderGrade];

  return {
    boulder: boulderGrade,
    lead: leadGrade,
    analysis: analysis,
    compositeScore: compositeScore.toFixed(2)
  };
};
