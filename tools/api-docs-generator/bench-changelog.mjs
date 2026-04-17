// Micro-benchmark for the changelog optimizations. Not part of the build/tests.
// Run with: node bench-changelog.mjs

import deepEqual from 'deep-equal';

// --- Build realistic-ish data: one "module" per version, each with many classes
// each with many properties/functions. This mirrors the structure the real
// changelog diffs traverse.
function makeModule(versionIdx, classCount = 80, membersPerClass = 30) {
    const classes = [];
    for (let c = 0; c < classCount; c++) {
        const properties = [];
        const functions = [];
        for (let m = 0; m < membersPerClass; m++) {
            properties.push({
                name: `prop_${c}_${m}`,
                is_read_only: (m + versionIdx) % 2 === 0,
                type: { name: 'number', is_bind_type: false, from_module: { name: 'mod', version: `${versionIdx}.0.0` } },
            });
            functions.push({
                name: `fn_${c}_${m}`,
                arguments: [
                    { name: 'a', type: { name: 'string', from_module: { name: 'mod', version: `${versionIdx}.0.0` } } },
                ],
                return_type: { name: 'void' },
                call_privilege: [],
            });
        }
        classes.push({ name: `Class_${c}`, properties, functions, constants: [], base_types: [] });
    }
    return { name: 'bench-module', version: `${versionIdx}.0.0`, classes, interfaces: [], errors: [], objects: [], functions: [], constants: [], enums: [], type_aliases: [], dependencies: [], peer_dependencies: [] };
}

const VERSIONS = 25; // realistic-ish number of versions
const modules = [];
for (let v = 1; v <= VERSIONS; v++) modules.push(makeModule(v));

// Add a few differences so diffing does real work
for (let v = 1; v < VERSIONS; v++) {
    modules[v].classes[0].properties[0].is_read_only = v % 2 === 0;
    modules[v].classes[1].functions[0].arguments.push({ name: 'extra', type: { name: 'number' } });
    if (v > 3) modules[v].classes.pop();
}

// ---- Simulated hot paths -----------------------------------------------------

// OLD compareArray key lookup strategy
function oldIndexOf(arr, key, value) {
    return arr.map(o => o[key]).indexOf(value);
}

// NEW compareArray key lookup strategy
function buildIndex(arr, key) {
    const m = new Map();
    for (let i = 0; i < arr.length; i++) m.set(arr[i][key], i);
    return m;
}

// ---- Old value-case path: always deepCopy + deepEqual ----
function oldValueDiff(a, b) {
    const ac = JSON.parse(JSON.stringify(a));
    const bc = JSON.parse(JSON.stringify(b));
    return !deepEqual(ac, bc);
}
// ---- New value-case path: direct deepEqual (no ignoredSubmembers) ----
function newValueDiff(a, b) {
    return !deepEqual(a, b);
}

function bench(name, fn) {
    const t0 = performance.now();
    fn();
    const t1 = performance.now();
    console.log(`${name.padEnd(50)} ${(t1 - t0).toFixed(1)} ms`);
    return t1 - t0;
}

// ---- Benchmark 1: N*M vs N+M key lookups in compareArray ----
// Each version-pair comparison walks all classes + all properties/functions.
// For each "current" entry it previously did arr.map().indexOf() over "next".
console.log('--- Benchmark 1: compareArray key lookup (simulated) ---');

const lookupsPerPair = 80 * 30 * 2; // class properties/functions per module pair
const pairs = VERSIONS - 1;

const oldTime = bench('OLD: map().indexOf() per entry', () => {
    let hits = 0;
    for (let p = 0; p < pairs; p++) {
        const a = modules[p].classes[0].properties;
        const b = modules[p + 1].classes[0].properties;
        // simulate twice (next-lookup + changelog-lookup)
        for (let r = 0; r < 2; r++) {
            for (let i = 0; i < a.length; i++) {
                if (oldIndexOf(b, 'name', a[i].name) !== -1) hits++;
            }
        }
        // simulate the full class*member fanout
        for (let c = 0; c < modules[p].classes.length; c++) {
            const ca = modules[p].classes[c].properties;
            const cb = modules[p + 1].classes[c % modules[p + 1].classes.length].properties;
            for (let r = 0; r < 2; r++) {
                for (let i = 0; i < ca.length; i++) {
                    if (oldIndexOf(cb, 'name', ca[i].name) !== -1) hits++;
                }
            }
        }
    }
    globalThis.__hits = hits;
});

const newTime = bench('NEW: Map-based index lookup', () => {
    let hits = 0;
    for (let p = 0; p < pairs; p++) {
        const a = modules[p].classes[0].properties;
        const b = modules[p + 1].classes[0].properties;
        for (let r = 0; r < 2; r++) {
            const idx = buildIndex(b, 'name');
            for (let i = 0; i < a.length; i++) {
                if (idx.has(a[i].name)) hits++;
            }
        }
        for (let c = 0; c < modules[p].classes.length; c++) {
            const ca = modules[p].classes[c].properties;
            const cb = modules[p + 1].classes[c % modules[p + 1].classes.length].properties;
            for (let r = 0; r < 2; r++) {
                const idx = buildIndex(cb, 'name');
                for (let i = 0; i < ca.length; i++) {
                    if (idx.has(ca[i].name)) hits++;
                }
            }
        }
    }
});

console.log(`--> speedup: ${(oldTime / newTime).toFixed(1)}x`);

// ---- Benchmark 2: value-case deepCopy fast path ----
console.log('\n--- Benchmark 2: value-case comparison ---');
const sampleType = { name: 'number', is_bind_type: false, from_module: { name: 'mod', version: '1.0.0' }, nested: { a: 1, b: [1, 2, 3] } };
const sampleType2 = { ...sampleType, is_bind_type: true };
const valueIters = 20_000;

const oldValTime = bench(`OLD: deepCopy + deepEqual x${valueIters}`, () => {
    for (let i = 0; i < valueIters; i++) oldValueDiff(sampleType, sampleType2);
});
const newValTime = bench(`NEW: deepEqual direct    x${valueIters}`, () => {
    for (let i = 0; i < valueIters; i++) newValueDiff(sampleType, sampleType2);
});
console.log(`--> speedup: ${(oldValTime / newValTime).toFixed(1)}x`);

// ---- Benchmark 3: serialize-once vs deepCopyJson per module ----
console.log('\n--- Benchmark 3: per-module changelog copy ---');
const bigChangelog = modules; // reuse as a sizeable structure
const moduleCount = 40;

const oldCopyTime = bench(`OLD: deepCopyJson x${moduleCount}`, () => {
    for (let i = 0; i < moduleCount; i++) JSON.parse(JSON.stringify(bigChangelog));
});
const newCopyTime = bench(`NEW: stringify once, parse x${moduleCount}`, () => {
    const s = JSON.stringify(bigChangelog);
    for (let i = 0; i < moduleCount; i++) JSON.parse(s);
});
console.log(`--> speedup: ${(oldCopyTime / newCopyTime).toFixed(1)}x`);
