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
    'Height': 'height',
    'Weight': 'Weight',
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
  }
};

const findFieldValue = (record, fieldNames) => {
  if (Array.isArray(fieldNames)) {
    for (const fieldName of fieldNames) {
      if (record.fields[fieldName] !== undefined) {
        return record.fields[fieldName];
      }
    }
  }
  return null;
};

const transformRecord = (record) => {
  if (!record || !record.fields) {
    console.warn('Invalid record structure:', record);
    return null;
  }

  console.log('Raw record fields:', record.fields);

  // Debug: Log all available field names from Airtable
  console.log('Available Airtable fields:', Object.keys(record.fields));

  const transformed = {
    id: record.id,
    email: record.fields.Email,
    name: record.fields.Name,
    traineeName: record.fields['trainee name'],
    notes: record.fields.Notes
  };
  
  // Transform basic fields
  for (const [standardField, alternateFields] of Object.entries(FIELD_MAPPINGS)) {
    if (Array.isArray(alternateFields)) {
      // Debug: Log field mapping attempt
      console.log(`Trying to map ${standardField} from:`, alternateFields);
      console.log('Available values:', alternateFields.map(f => record.fields[f]));
      
      transformed[standardField] = findFieldValue(record, alternateFields);
      
      // Special handling for Training Schedule
      if (standardField === 'Training Schedule') {
        console.log('Raw Training Schedule:', record.fields['Training Schedule']);
        transformed[standardField] = record.fields['Training Schedule'] || {};
      }
      
      // Debug: Log result
      console.log(`${standardField} mapped to:`, transformed[standardField]);
      
      // Convert numeric fields
      if (['Finger Strength Weight', 'Pull Up Repetitions', 'Push Up Repetitions', 'Toe To bar Repetitions', 'Leg Spread'].includes(standardField)) {
        const value = transformed[standardField];
        if (value !== null && value !== '') {
          // Remove any non-numeric characters except decimal point and minus sign
          const cleanValue = value.toString().replace(/[^\d.-]/g, '');
          const numericValue = parseFloat(cleanValue);
          transformed[standardField] = isNaN(numericValue) ? null : numericValue;
          
          // Debug log for numeric conversion
          console.log(`Converting ${standardField}:`, {
            original: value,
            cleaned: cleanValue,
            final: transformed[standardField]
          });
        }
      }
      
      // Ensure date is in correct format
      if (standardField === 'Assessment Date' && transformed[standardField]) {
        try {
          transformed[standardField] = new Date(transformed[standardField]).toISOString().split('T')[0];
        } catch (error) {
          console.warn(`Invalid date format for record ${record.id}:`, transformed[standardField]);
          transformed[standardField] = null;
        }
      }
    } else if (typeof alternateFields === 'object') {
      // Handle nested objects (e.g., Personal Info)
      transformed[standardField] = {};
      for (const [key, fieldName] of Object.entries(alternateFields)) {
        transformed[standardField][key] = record.fields[fieldName];
      }
    }
  }
  
  console.log('Transformed record:', transformed);
  
  // Validate required fields
  const hasRequiredFields = transformed['Assessment Date'] && 
    (transformed['Boulder 80% Grade'] || transformed['Lead 80% Grade']);
  
  if (!hasRequiredFields) {
    console.warn('Record missing required fields:', transformed);
    return null;
  }
  
  return transformed;
};

// Initialize Airtable with proper error handling
let airtable;
try {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable configuration missing');
  }
  airtable = new Airtable({
    apiKey: AIRTABLE_API_KEY,
    endpointUrl: 'https://api.airtable.com',
  });
} catch (error) {
  console.error('Failed to initialize Airtable:', error);
  throw error;
}

const base = airtable.base(AIRTABLE_BASE_ID);

export const fetchAssessmentsByEmail = async (email) => {
  if (!email) {
    throw new Error('Email is required');
  }

  try {
    console.log('Fetching assessments for email:', email);
    
    // First, fetch a single record to check field names
    const testRecords = await base(TABLE_NAME)
      .select({
        maxRecords: 1
      })
      .all();
    
    if (testRecords.length > 0) {
      console.log('Available fields in Airtable:', Object.keys(testRecords[0].fields));
    }
    
    // Use the SDK to fetch records
    const records = await base(TABLE_NAME)
      .select({
        maxRecords: 100,
        filterByFormula: `LOWER(Email) = LOWER("${email.replace(/"/g, '\\"')}")`,
        sort: [{ field: 'Created', direction: 'desc' }]
      })
      .all();

    console.log(`Found ${records.length} records for email:`, email);

    // Transform and validate records
    const transformedRecords = records
      .map(transformRecord)
      .filter(Boolean); // Remove null records

    console.log(`Transformed ${transformedRecords.length} valid records`);
    
    if (transformedRecords.length === 0) {
      console.warn('No valid assessments found for email:', email);
      return [];
    }

    return transformedRecords;

  } catch (error) {
    console.error('Error fetching assessments:', error);
    if (error.error === 'NOT_FOUND') {
      throw new Error('Assessment data not found');
    } else if (error.error === 'UNAUTHORIZED') {
      throw new Error('Unable to access assessment data');
    } else {
      throw new Error(`Failed to fetch assessments: ${error.message || 'Unknown error'}`);
    }
  }
};

export const createAssessment = async (data) => {
  if (!data) {
    throw new Error('Assessment data is required');
  }

  try {
    const record = await base(TABLE_NAME).create([
      {
        fields: data
      }
    ]);
    
    return transformRecord(record[0]);
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw new Error(`Failed to create assessment: ${error.message || 'Unknown error'}`);
  }
};

export const updateAssessment = async (id, data) => {
  if (!id || !data) {
    throw new Error('Assessment ID and data are required');
  }

  try {
    const record = await base(TABLE_NAME).update([
      {
        id: id,
        fields: data
      }
    ]);
    
    return transformRecord(record[0]);
  } catch (error) {
    console.error('Error updating assessment:', error);
    throw new Error(`Failed to update assessment: ${error.message || 'Unknown error'}`);
  }
};
