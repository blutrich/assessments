import Airtable from 'airtable';

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const TABLE_NAME = 'tblzfyMtUyoSUglLf';

// Field mappings matching the actual Airtable column names
const FIELD_MAPPINGS = {
  'Assessment Date': ['Created'],
  'Boulder 80% Grade': ['דירוג בולדרינג 80%', 'Bouldering grade at 80%'],
  'Lead 80% Grade': ['דירוג הובלה 80%', 'Lead grade at 80%'],
  'Finger Strength Weight': ['FB Weight', 'Weight used on the fingerboard'],
  'Pull Up Repetitions': ['PU MAX', 'Maximum pull-ups'],
  'Push Up Repetitions': ['PUSH UP MAX', 'Maximum push-ups'],
  'Toe To bar Repetitions': ['T2b MAX', 'Maximum toes-to-bar repetitions'],
  'Leg Spread': ['LEG SPREAD'],
  'RPE Finger Strength': ['RPE FB'],
  'RPE Pull Ups': ['RPE PullUPS'],
  'RPE Push Ups': ['RPE Pushups'],
  'RPE Toe To Bar': ['RPE T2B'],
  'RPE Leg Spread': ['RPE Split'],
  'Training Schedule': ['Training Schedule'],
  'Personal Info': {
    'Name': ['Name', 'Full Name', 'שם'],
    'Height': ['height', 'Height', 'גובה'],
    'Weight': ['weight', 'Weight', 'משקל'],
    'Birthday': 'Birthday',
    'Years Climbing': 'Years Climbing',
    'Power to Weight Ratio': 'יחס כוח משקל'
  },
  'Equipment': {
    'Fingerboard Size': 'FB size',
    'Has Home Fingerboard': 'HOME FB',
    'Has Home TRX': 'HOME TRX',
    'Has Home Wall': 'HOME WALL'
  },
  'Goals': {
    'Five Month Goal': 'מטרה ל5',
    'One Year Goal': 'מטרה לשנה',
    'Current Goal': 'Current Goal'
  },
  'Notes': {
    'Coach Notes': ['Coach Notes', 'הערות מאמן'],
    'Last Updated': ['Notes Last Updated', 'תאריך עדכון הערות'],
    'User Notes': ['Notes', 'הערות']
  }
};

const findFieldValue = (record, fieldNames) => {
  if (Array.isArray(fieldNames)) {
    for (const fieldName of fieldNames) {
      if (record.fields[fieldName] !== undefined) {
        return record.fields[fieldName];
      }
    }
  } else if (typeof fieldNames === 'string') {
    return record.fields[fieldNames];
  }
  return null;
};

const calculateFingerStrengthRatio = (bodyWeight, fingerBoardWeight) => {
  if (!bodyWeight || !fingerBoardWeight) return null;
  const totalWeight = parseFloat(bodyWeight) + parseFloat(fingerBoardWeight);
  return ((totalWeight / parseFloat(bodyWeight)) * 100).toFixed(1);
};

const transformRecord = (record) => {
  const transformed = {
    id: record.id,
    'Assessment Date': findFieldValue(record, FIELD_MAPPINGS['Assessment Date']),
    'Boulder 80% Grade': findFieldValue(record, FIELD_MAPPINGS['Boulder 80% Grade']),
    'Lead 80% Grade': findFieldValue(record, FIELD_MAPPINGS['Lead 80% Grade']),
    'Finger Strength Weight': findFieldValue(record, FIELD_MAPPINGS['Finger Strength Weight']),
    'Pull Up Repetitions': findFieldValue(record, FIELD_MAPPINGS['Pull Up Repetitions']),
    'Push Up Repetitions': findFieldValue(record, FIELD_MAPPINGS['Push Up Repetitions']),
    'Toe To bar Repetitions': findFieldValue(record, FIELD_MAPPINGS['Toe To bar Repetitions']),
    'Leg Spread': findFieldValue(record, FIELD_MAPPINGS['Leg Spread']),
    'RPE Finger Strength': findFieldValue(record, FIELD_MAPPINGS['RPE Finger Strength']),
    'RPE Pull Ups': findFieldValue(record, FIELD_MAPPINGS['RPE Pull Ups']),
    'RPE Push Ups': findFieldValue(record, FIELD_MAPPINGS['RPE Push Ups']),
    'RPE Toe To Bar': findFieldValue(record, FIELD_MAPPINGS['RPE Toe To Bar']),
    'RPE Leg Spread': findFieldValue(record, FIELD_MAPPINGS['RPE Leg Spread']),
    'Training Schedule': findFieldValue(record, FIELD_MAPPINGS['Training Schedule']),
    'Personal Info': {
      'Name': findFieldValue(record, FIELD_MAPPINGS['Personal Info']['Name']),
      'Height': findFieldValue(record, FIELD_MAPPINGS['Personal Info']['Height']),
      'Weight': findFieldValue(record, FIELD_MAPPINGS['Personal Info']['Weight']),
      'Birthday': findFieldValue(record, FIELD_MAPPINGS['Personal Info']['Birthday']),
      'Years Climbing': findFieldValue(record, FIELD_MAPPINGS['Personal Info']['Years Climbing']),
      'Power to Weight Ratio': findFieldValue(record, FIELD_MAPPINGS['Personal Info']['Power to Weight Ratio'])
    },
    'Equipment': {
      'Fingerboard Size': findFieldValue(record, FIELD_MAPPINGS['Equipment']['Fingerboard Size']),
      'Has Home Fingerboard': findFieldValue(record, FIELD_MAPPINGS['Equipment']['Has Home Fingerboard']),
      'Has Home TRX': findFieldValue(record, FIELD_MAPPINGS['Equipment']['Has Home TRX']),
      'Has Home Wall': findFieldValue(record, FIELD_MAPPINGS['Equipment']['Has Home Wall'])
    },
    'Goals': {
      'Five Month Goal': findFieldValue(record, FIELD_MAPPINGS['Goals']['Five Month Goal']),
      'One Year Goal': findFieldValue(record, FIELD_MAPPINGS['Goals']['One Year Goal']),
      'Current Goal': findFieldValue(record, FIELD_MAPPINGS['Goals']['Current Goal'])
    },
    'Notes': {
      'Coach Notes': findFieldValue(record, FIELD_MAPPINGS['Notes']['Coach Notes']),
      'Last Updated': findFieldValue(record, FIELD_MAPPINGS['Notes']['Last Updated']),
      'User Notes': findFieldValue(record, FIELD_MAPPINGS['Notes']['User Notes'])
    }
  };

  // Calculate finger strength ratio
  const weight = transformed['Personal Info']['Weight'];
  const fingerBoardWeight = transformed['Finger Strength Weight'];
  transformed['Finger Strength Ratio'] = calculateFingerStrengthRatio(weight, fingerBoardWeight);

  return transformed;
};

// Initialize Airtable
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Fetch all unique users and their latest assessments for coaches
const fetchAllUsersData = async () => {
  try {
    const records = await base(TABLE_NAME).select({
      sort: [{ field: 'Created', direction: 'desc' }]
    }).all();

    // Group records by email
    const userGroups = records.reduce((acc, record) => {
      const email = record.fields.Email?.toLowerCase();
      if (!email) return acc;
      
      if (!acc[email]) {
        acc[email] = [];
      }
      acc[email].push(transformRecord(record));
      return acc;
    }, {});

    // Get latest assessment for each user
    return Object.entries(userGroups).map(([email, assessments]) => ({
      email,
      latestAssessment: assessments[0],
      assessmentCount: assessments.length,
      firstAssessment: assessments[assessments.length - 1],
      lastAssessmentDate: assessments[0]['Assessment Date'],
      assessments // Include all assessments for full analysis view
    }));
  } catch (error) {
    console.error('Error fetching all users data:', error);
    throw error;
  }
};

const fetchAssessmentsByEmail = async (email) => {
  try {
    if (!email) throw new Error('Email is required');

    const records = await base(TABLE_NAME)
      .select({
        filterByFormula: `LOWER({Email}) = '${email.toLowerCase()}'`,
        sort: [{ field: 'Created', direction: 'desc' }]
      })
      .all();

    return records.map(transformRecord);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    throw error;
  }
};

const createAssessment = async (data) => {
  try {
    const record = await base(TABLE_NAME).create([
      {
        fields: data
      }
    ]);
    return record;
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
};

const updateAssessment = async (id, data) => {
  try {
    const record = await base(TABLE_NAME).update([
      {
        id,
        fields: data
      }
    ]);
    return record;
  } catch (error) {
    console.error('Error updating assessment:', error);
    throw error;
  }
};

const updateUserNotes = async (email, notes) => {
  try {
    const records = await base(TABLE_NAME)
      .select({
        filterByFormula: `{Email} = '${email}'`,
        sort: [{ field: 'Created', direction: 'desc' }],
        maxRecords: 1
      })
      .firstPage();

    if (records.length > 0) {
      const record = records[0];
      await base(TABLE_NAME).update(record.id, {
        'Coach Notes': notes  // Using the English field name as specified
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating notes:', error);
    throw error;
  }
};

// Single export statement for all functions
export {
  fetchAllUsersData,
  fetchAssessmentsByEmail,
  createAssessment,
  updateAssessment,
  updateUserNotes
};
