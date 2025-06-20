/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: { exclude: [...configDefaults.exclude, '**/build/**', '**/lib/**'], watch: false, testTimeout: 15000 },
});
