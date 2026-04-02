const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const commitHash = execSync('git rev-parse HEAD').toString().trim();
const outputPath = path.join(__dirname, 'public', 'commitHash.txt');

fs.writeFileSync(outputPath, commitHash);