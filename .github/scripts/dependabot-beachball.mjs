#!/usr/bin/env node

import { execSync } from 'node:child_process';

function checkIfBeachballChangeNeeded() {
    console.log('Checking if beachball change files are needed...');

    try {
        execSync('npx beachball check --verbose', { encoding: 'utf8', stdio: 'pipe' });
        console.log('✅ Beachball check passed - no change files needed');
        return false;
    } catch (error) {
        console.log('❌ Beachball check failed - change files needed');
        return true;
    }
}

function determineChangeType(commitMessage) {
    console.log(`Analyzing commit message: "${commitMessage}"`);

    // Search for keywords to determine change type. This is best effort and intended to be reviewed at PR time.
    if (/breaking|major/i.test(commitMessage)) {
        return 'major';
    } else if (/feat|feature|minor/i.test(commitMessage)) {
        return 'minor';
    } else {
        return 'patch';
    }
}

function getLatestCommitMessage() {
    const commitMessage = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim();
    return commitMessage.replace(/^"|"$/g, ''); // Remove surrounding quotes if present
}

function createBeachballChangeFile(commitMessage, changeType) {
    console.log(`Creating beachball change file with type: ${changeType}`);

    try {
        // Create change file using beachball CLI
        execSync('git config --local user.email "mc-npm@microsoft.com"');
        execSync('git config --local user.name "mc-npm"');

        execSync(`npx beachball change --type "${changeType}" --message "${commitMessage}"`, {
            encoding: 'utf8',
            stdio: 'inherit',
        });

        console.log('✅ Successfully created and committed beachball change files');
        return true;
    } catch (error) {
        console.error('❌ Failed to create beachball change file:', error.message);
        return false;
    }
}

try {
    const isDryRun = process.argv.includes('-n');
    console.log('🤖 Starting dependabot beachball change file automation...');

    // Step 1: Check if beachball change files are needed
    const needsChange = checkIfBeachballChangeNeeded();

    if (!needsChange) {
        process.exit(0);
    }

    // Step 2: Get commit message and determine change type
    const commitMessage = getLatestCommitMessage();
    const changeType = determineChangeType(commitMessage);

    console.log(`📝 Commit message: "${commitMessage}"`);
    console.log(`📊 Determined change type: ${changeType}`);

    // Step 3: Create beachball change file
    const changeFileCreated = createBeachballChangeFile(commitMessage, changeType, isDryRun);

    if (!changeFileCreated) {
        console.error('❌ Failed to create change file');
        process.exit(1);
    }

    console.log('🎉 Successfully automated beachball change file creation! Pushing changes.');
    if (!isDryRun) {
        execSync('git push');
    }
} catch (error) {
    console.error('❌ Error in dependabot beachball automation:', error.message);
    console.error(error.stack);
    process.exit(1);
}
