// This is a placeholder for actual AI integration
// In production, this would connect to your AI service

const generateAIResponse = async (message, userData = null) => {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Extract athlete data if available
  const athleteName = userData?.latestAssessment?.['Personal Info']?.['Name'] || 'the athlete';
  const boulderGrade = userData?.latestAssessment?.['Boulder 80% Grade'];
  const leadGrade = userData?.latestAssessment?.['Lead 80% Grade'];
  const fingerStrength = userData?.latestAssessment?.['Finger Strength Weight'];
  const pullUps = userData?.latestAssessment?.['Pull Up Repetitions'];
  const currentGoal = userData?.latestAssessment?.Goals?.['Current Goal'];

  // Example responses based on message content and athlete data
  const responses = {
    performance: [
      `Based on ${athleteName}'s data, they're climbing at ${boulderGrade} in bouldering and ${leadGrade} in lead. ${
        fingerStrength ? `With a finger strength of ${fingerStrength}kg, ` : ''
      }they show potential for advancement.`,
      `Looking at their metrics, ${athleteName}'s ${
        pullUps ? `ability to do ${pullUps} pull-ups combined with ` : ''
      }their current climbing grades suggests they might benefit from focused technique training.`,
      `Their performance data indicates a good balance between strength and technique. Let's focus on maintaining this while pushing grades.`
    ],
    training: [
      `For ${athleteName}'s current level (${boulderGrade} boulder/${leadGrade} lead), I recommend a structured training plan focusing on weakness identification and progressive overload.`,
      `Based on their metrics, ${athleteName} could benefit from ${
        fingerStrength < 20 ? 'foundational finger strength work' : 'advanced hangboard protocols'
      } combined with technique drills.`,
      `Looking at their training data, we should consider implementing periodization to optimize ${athleteName}'s progress.`
    ],
    goals: [
      `${athleteName}'s current goal is ${currentGoal || 'not specified'}. Given their current level, this ${
        currentGoal ? 'appears achievable with focused training' : 'should be defined to create a targeted training plan'
      }.`,
      `To help ${athleteName} progress towards their goals, let's focus on specific benchmarks in both bouldering and lead climbing.`,
      `Based on their current performance metrics, we can create a roadmap to help ${athleteName} achieve their climbing objectives.`
    ],
    technique: [
      `For ${athleteName}'s current grade (${boulderGrade}), focusing on advanced movement patterns and body positioning would be beneficial.`,
      `I recommend working on project-level boulders that emphasize technical skills, especially given their current strength metrics.`,
      `Given their performance data, ${athleteName} might benefit from structured technique drills, particularly on overhanging terrain.`
    ],
    default: [
      `I've analyzed ${athleteName}'s data. Would you like to focus on their performance metrics, training plan, or goal progression?`,
      `Based on ${athleteName}'s recent assessments, I can provide insights about their climbing progression. What specific aspect interests you?`,
      `I can help analyze ${athleteName}'s climbing journey and make recommendations. What would you like to know about?`
    ]
  };

  // Enhanced keyword matching
  let category = 'default';
  const lowercaseMessage = message.toLowerCase();
  
  if (lowercaseMessage.includes('perform') || lowercaseMessage.includes('progress') || lowercaseMessage.includes('grade')) {
    category = 'performance';
  } else if (lowercaseMessage.includes('train') || lowercaseMessage.includes('workout') || lowercaseMessage.includes('exercise')) {
    category = 'training';
  } else if (lowercaseMessage.includes('goal') || lowercaseMessage.includes('target') || lowercaseMessage.includes('aim')) {
    category = 'goals';
  } else if (lowercaseMessage.includes('technique') || lowercaseMessage.includes('movement') || lowercaseMessage.includes('skill')) {
    category = 'technique';
  }

  // Get responses for the category
  const categoryResponses = responses[category];
  
  // Select a response that hasn't been used recently (could be enhanced with actual history tracking)
  const randomIndex = Math.floor(Math.random() * categoryResponses.length);
  const response = categoryResponses[randomIndex];

  // Add follow-up suggestions
  const followUps = [
    "Would you like more specific details about their training metrics?",
    "Should we analyze their progression in more detail?",
    "Would you like recommendations for their next training phase?",
    "Shall we look at their strength-to-weight ratios more closely?"
  ];
  
  const randomFollowUp = followUps[Math.floor(Math.random() * followUps.length)];
  
  return `${response}\n\n${randomFollowUp}`;
};

export { generateAIResponse };
