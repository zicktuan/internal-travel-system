import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Khai báo __dirname cho ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

async function runSeedSQL() {
    const sqlFile = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
    
    try {
        console.log('🚀 Running SQL seed...');
        console.log(`📁 SQL file: ${sqlFile}`);
        
        // Chạy SQL file
        const { stdout, stderr } = await execAsync(
            `psql -d travel_system_internal -f "${sqlFile}"`
        );
        
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        
        console.log('✅ SQL seed completed successfully');
    } catch (error) {
        console.error('❌ SQL seed failed:', error);
    }
}

runSeedSQL();