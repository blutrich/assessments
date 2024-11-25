import Airtable from 'airtable';
import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

const apiKey = process.env.VITE_AIRTABLE_API_KEY;
const baseId = process.env.VITE_AIRTABLE_BASE_ID;

console.log('API Key:', apiKey ? 'Present' : 'Missing');
console.log('Base ID:', baseId ? 'Present' : 'Missing');

const base = new Airtable({ apiKey }).base(baseId);

async function testConnection() {
    try {
        console.log('Testing Airtable connection...');
        
        // Try to fetch records
        const records = await base('Assessments').select({
            maxRecords: 1,
            view: "Grid view"
        }).firstPage();
        
        console.log('Successfully connected to Airtable!');
        console.log(`Found ${records.length} record(s)`);
        
        // Print field names from the first record
        if (records.length > 0) {
            console.log('\nAvailable fields:');
            const fields = records[0].fields;
            Object.keys(fields).forEach(field => {
                console.log(`- ${field}: ${typeof fields[field]}`);
            });
        }
    } catch (error) {
        console.error('Error connecting to Airtable:', error);
        if (error.message) {
            console.error('Error message:', error.message);
        }
        if (error.statusCode) {
            console.error('Status code:', error.statusCode);
        }
    }
}

testConnection();
