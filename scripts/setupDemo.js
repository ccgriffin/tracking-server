const { spawn } = require('child_process');
const path = require('path');

async function runScript(scriptPath) {
    return new Promise((resolve, reject) => {
        const process = spawn('node', [scriptPath], {
            stdio: 'inherit'
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Script ${scriptPath} exited with code ${code}`));
            }
        });
    });
}

async function setupDemo() {
    try {
        console.log('Creating demo user...');
        await runScript(path.join(__dirname, 'createDemoUser.js'));

        console.log('Creating demo tracker data...');
        await runScript(path.join(__dirname, 'createDemoTrackers.js'));

        console.log('\nDemo setup completed successfully!');
        console.log('\nYou can now:');
        console.log('1. Start the server with: npm start');
        console.log('2. Login with:');
        console.log('   Username: demo');
        console.log('   Password: demo123');
        
        process.exit(0);
    } catch (error) {
        console.error('Error during demo setup:', error);
        process.exit(1);
    }
}

setupDemo();
