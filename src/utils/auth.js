import { fetchAssessmentsByEmail } from './airtable';

const COACH_EMAILS = [
  'blutrich@gmail.com',
  'oferblutrich@gmail.com',
  'coach@climbing.com'
];

export const isCoach = (email) => {
  return COACH_EMAILS.includes(email?.toLowerCase());
};

export const sendVerificationEmail = async (email) => {
  // For now, we'll just simulate email verification
  // In production, you'd want to use a service like SendGrid or AWS SES
  return true;
};

export const verifyEmail = async (email) => {
  try {
    // Check if the email exists in Airtable
    const assessments = await fetchAssessmentsByEmail(email);
    return {
      isAuthenticated: assessments.length > 0,
      isCoach: isCoach(email),
      assessments
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return {
      isAuthenticated: false,
      isCoach: false,
      assessments: []
    };
  }
};
