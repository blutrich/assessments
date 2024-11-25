import Airtable from 'airtable';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
config({ path: resolve(__dirname, '../.env') });

const apiKey = process.env.VITE_AIRTABLE_API_KEY;
const baseId = process.env.VITE_AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
    console.error('Missing required environment variables. Please check your .env file.');
    process.exit(1);
}

const base = new Airtable({apiKey}).base(baseId);

async function updateLegSpreadValues() {
    try {
        console.log('Fetching records...');
        const records = await base('Assessments').select().all();
        console.log(`Found ${records.length} records`);
        
        for (let record of records) {
            const legSpread = record.get('LEG SPREAD');
            if (legSpread && typeof legSpread === 'string') {
                // Extract number from string (e.g., "1.40 m" -> 1.40)
                const numericValue = parseFloat(legSpread.replace('m', '').trim());
                
                if (!isNaN(numericValue)) {
                    console.log(`Updating record ${record.id}: ${legSpread} -> ${numericValue}`);
                    await base('Assessments').update(record.id, {
                        'LEG SPREAD': numericValue
                    });
                    // Add a small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }
        console.log('All leg spread values updated successfully!');
    } catch (error) {
        console.error('Error updating values:', error);
        if (error.message) {
            console.error('Error message:', error.message);
        }
        if (error.statusCode) {
            console.error('Status code:', error.statusCode);
        }
    }
}

updateLegSpreadValues();
