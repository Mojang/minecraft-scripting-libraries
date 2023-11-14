import { execSync } from 'child_process';

export function vitestTask() {
    return () => {
        execSync('vitest', { stdio: 'inherit' });
    };
}
