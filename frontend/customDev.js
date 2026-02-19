const { execSync } = require('child_process');

// Run setCommitHash.js script
execSync('node CommitHash.js', { stdio: 'inherit' });

// Start the Next.js development server
execSync('next dev -p 3333', { stdio: 'inherit' });