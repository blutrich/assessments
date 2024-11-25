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

// Calculate performance score based on latest assessment
export const calculatePerformanceScore = (assessment) => {
  if (!assessment) return 0;

  let score = 0;
  let metrics = 0;

  // Boulder grade contribution (max 40 points)
  const boulderGrade = boulderGradeToNumber(assessment['Boulder 80% Grade']);
  if (boulderGrade !== null) {
    score += Math.min(40, boulderGrade * 4);
    metrics++;
  }

  // Finger strength contribution (max 30 points)
  const fingerStrength = parseFloat(assessment['Finger Strength Weight']);
  if (!isNaN(fingerStrength)) {
    score += Math.min(30, fingerStrength / 3);
    metrics++;
  }

  // Pull-ups contribution (max 15 points)
  const pullUps = parseInt(assessment['Pull Up Repetitions']);
  if (!isNaN(pullUps)) {
    score += Math.min(15, pullUps);
    metrics++;
  }

  // Push-ups contribution (max 15 points)
  const pushUps = parseInt(assessment['Push Up Repetitions']);
  if (!isNaN(pushUps)) {
    score += Math.min(15, pushUps / 2);
    metrics++;
  }

  // If no metrics available, return 0
  if (metrics === 0) return 0;

  // Normalize score based on available metrics
  return Math.round((score / metrics) * (100 / 40));
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
  const fingerStrength = parseFloat(latest['Finger Strength Weight']);
  if (!isNaN(fingerStrength)) {
    if (fingerStrength > 30) {
      insights.push({
        type: 'positive',
        message: 'Your finger strength is well-developed. Remember to maintain proper rest and recovery.'
      });
    } else if (fingerStrength < 15) {
      insights.push({
        type: 'info',
        message: 'Consider incorporating more structured hangboard training to improve finger strength.'
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

// Calculate normalized metrics
const normalizeMetrics = (assessment) => {
  const metrics = {
    fingerStrength: 0,
    pullUps: 0,
    pushUps: 0,
    coreStrength: 0,
    flexibility: 0
  };

  if (!assessment) return metrics;

  // Get body weight and height
  const bodyWeight = Number(assessment.Personal_Info?.Weight) || 70; // default weight if not provided
  const height = Number(assessment.Personal_Info?.Height) || 170; // default height if not provided

  console.log('Body weight:', bodyWeight, 'Height:', height);

  // Normalize finger strength: (added weight + body weight) / body weight
  const fingerWeight = Number(assessment['Finger Strength Weight']) || 0;
  if (bodyWeight > 0) {
    metrics.fingerStrength = (fingerWeight + bodyWeight) / bodyWeight;
    console.log('Finger strength calculation:', `(${fingerWeight} + ${bodyWeight}) / ${bodyWeight} = ${metrics.fingerStrength}`);
  }

  // Normalize pull-ups: max reps / body weight
  const pullUps = Number(assessment['Pull Up Repetitions']) || 0;
  metrics.pullUps = pullUps / bodyWeight;

  // Normalize push-ups: max reps / body weight
  const pushUps = Number(assessment['Push Up Repetitions']) || 0;
  metrics.pushUps = pushUps / bodyWeight;

  // Normalize core strength: max reps / body weight
  const toeToBar = Number(assessment['Toe To bar Repetitions']) || 0;
  metrics.coreStrength = toeToBar / bodyWeight;

  // Normalize flexibility: leg spread distance / height
  const legSpreadStr = assessment['Leg Spread'] || '0';
  // Extract numeric part from string (e.g., "165" -> 165)
  const legSpread = Number(legSpreadStr) || 0;
  if (height > 0) {
    metrics.flexibility = legSpread / height;
  }

  console.log('Leg spread raw:', legSpreadStr, 'parsed:', legSpread);
  console.log('Normalized metrics:', metrics);

  return metrics;
};

// Predict climbing grade based on metrics
export const predictGrade = (assessment) => {
  if (!assessment) return null;

  const metrics = normalizeMetrics(assessment);
  
  // Calculate composite score using exact weights
  const compositeScore = (
    0.45 * metrics.fingerStrength +
    0.20 * metrics.pullUps +
    0.10 * metrics.pushUps +
    0.15 * metrics.coreStrength +
    0.10 * metrics.flexibility
  );

  console.log('Composite score:', compositeScore);

  // Determine grade based on exact thresholds
  let predictedGrade;
  let confidence = 'Medium';

  if (compositeScore > 1.45) predictedGrade = 'V12';
  else if (compositeScore >= 1.30) predictedGrade = 'V11';
  else if (compositeScore >= 1.15) predictedGrade = 'V10';
  else if (compositeScore >= 1.05) predictedGrade = 'V9';
  else if (compositeScore >= 0.95) predictedGrade = 'V8';
  else if (compositeScore >= 0.85) predictedGrade = 'V7';
  else if (compositeScore >= 0.75) predictedGrade = 'V6';
  else if (compositeScore >= 0.65) predictedGrade = 'V5';
  else predictedGrade = 'V4';

  // Find strongest and weakest areas
  const metricEntries = Object.entries(metrics);
  const strongest = metricEntries.reduce((a, b) => a[1] > b[1] ? a : b);
  const weakest = metricEntries.reduce((a, b) => a[1] < b[1] ? a : b);

  // Training recommendations based on weakest areas
  const recommendations = {
    fingerStrength: {
      exercises: 'Max hangs on 20mm edge, 2x/week with 72h rest',
      protocol: '7s hang, 3min rest, 4-6 sets at RPE 8-9'
    },
    pullUps: {
      exercises: 'Weighted pull-ups and max rep sets',
      protocol: '3-5 sets of 3-5 reps with added weight, 2x/week'
    },
    pushUps: {
      exercises: 'Weighted push-ups and decline push-ups',
      protocol: '3-4 sets of 8-12 reps, 2-3x/week'
    },
    coreStrength: {
      exercises: 'Toe to bar progression and front lever work',
      protocol: '4 sets to technical failure, 2-3x/week'
    },
    flexibility: {
      exercises: 'Dynamic and static stretching for splits',
      protocol: '15-20 minutes daily, focus on active flexibility'
    }
  };

  return {
    predictedGrade,
    confidence,
    compositeScore,
    metrics,
    strongest: strongest[0],
    weakest: weakest[0],
    recommendations: {
      primary: recommendations[weakest[0]],
      secondary: recommendations[metricEntries.sort((a, b) => a[1] - b[1])[1][0]]
    }
  };
};
