import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const getLatestAssessment = (assessments) => {
  if (!assessments || assessments.length === 0) return null;
  
  // Sort assessments by date (newest first)
  return [...assessments].sort((a, b) => 
    new Date(b['Assessment Date']) - new Date(a['Assessment Date'])
  )[0];
};

const formatTrainingSchedule = (schedule) => {
  if (!schedule) return 'No training schedule available';
  
  return Object.entries(schedule)
    .map(([day, activity]) => {
      if (!activity || activity === 'Rest') return null;
      return `- ${day}: ${activity}`;
    })
    .filter(Boolean)
    .join('\n    ');
};

export const generateAIResponse = async (userMessage, assessments) => {
  const latestAssessment = getLatestAssessment(assessments);
  
  if (!latestAssessment) {
    return "I don't see any assessment data yet. Please complete an assessment first so I can provide personalized advice!";
  }

  try {
    // Format the date nicely
    const assessmentDate = new Date(latestAssessment['Assessment Date']).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const systemPrompt = `You are an expert climbing coach AI assistant analyzing data from the latest assessment (${assessmentDate}):

    Performance Metrics:
    - Finger Strength: ${latestAssessment['Finger Strength Weight'] || 'N/A'} kg
    - Pull-ups: ${latestAssessment['Pull Up Repetitions'] || 'N/A'} reps
    - Push-ups: ${latestAssessment['Push Up Repetitions'] || 'N/A'} reps
    - Toe-to-bar: ${latestAssessment['Toe To bar Repetitions'] || 'N/A'} reps
    - Leg Spread: ${latestAssessment['Leg Spread'] || 'N/A'} cm

    Current Grades:
    - Boulder Grade: ${latestAssessment['Boulder 80% Grade'] || 'N/A'}
    - Lead Grade: ${latestAssessment['Lead 80% Grade'] || 'N/A'}

    Perceived Exertion (RPE):
    - Finger Strength RPE: ${latestAssessment['RPE Finger Strength'] || 'N/A'}/10
    - Pull-ups RPE: ${latestAssessment['RPE Pull Ups'] || 'N/A'}/10
    - Push-ups RPE: ${latestAssessment['RPE Push Ups'] || 'N/A'}/10
    - Toe-to-bar RPE: ${latestAssessment['RPE Toe To Bar'] || 'N/A'}/10
    - Leg Spread RPE: ${latestAssessment['RPE Leg Spread'] || 'N/A'}/10

    Personal Info:
    - Weight: ${latestAssessment.Personal_Info?.Weight || 'N/A'} kg
    - Height: ${latestAssessment.Personal_Info?.Height || 'N/A'} cm

    Weekly Training Schedule:
    ${formatTrainingSchedule(latestAssessment.Training_Schedule)}

    Training Days per Week: ${Object.entries(latestAssessment.Training_Schedule || {})
      .filter(([_, value]) => value && value !== 'Rest')
      .length}

    As an expert climbing coach, provide personalized advice considering:
    1. Current performance levels and grades
    2. RPE scores to gauge training intensity
    3. Areas needing improvement
    4. Realistic progression goals
    5. Injury prevention based on training load
    6. Training schedule optimization

    Keep responses concise, actionable, and encouraging. Use technical climbing terminology where appropriate.
    If specific metrics are missing, acknowledge this and provide advice based on available data.`;

    console.log('Sending assessment data to OpenAI:', {
      date: assessmentDate,
      fingerStrength: latestAssessment['Finger Strength Weight'],
      pullUps: latestAssessment['Pull Up Repetitions'],
      boulderGrade: latestAssessment['Boulder 80% Grade'],
      leadGrade: latestAssessment['Lead 80% Grade'],
      trainingDays: Object.entries(latestAssessment.Training_Schedule || {})
        .filter(([_, value]) => value && value !== 'Rest')
        .length,
      schedule: latestAssessment.Training_Schedule
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: systemPrompt 
        },
        { 
          role: "user", 
          content: userMessage 
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return "I'm having trouble analyzing your latest assessment data. Please try again in a moment!";
  }
};
