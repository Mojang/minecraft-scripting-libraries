# Changelog Generator Perf Investigation — Handoff Notes

> Purpose: Continue runtime/memory optimization of the Minecraft API changelog
> generator, and produce real before/after numbers on production-scale input.
> Hand this whole file to Copilot in a fresh session.

## TL;DR

The changelog diffing step in `@minecraft/api-docs-generator` is slow and
memory-hungry with many Minecraft metadata versions. An optimized version of
the hot path exists at `tools/api-docs-generator/src/changelog.ts.optimized`.
It was validated with the repo's snapshot test suite. Real end-to-end
before/after timings on production input were **not yet captured** — only
micro-benchmarks. Finish that work.

## Current Repo State (as of handoff)

Workspace root: `d:\minecraft-scripting-libraries` (multi-root with
`d:\MinecraftApiMetadata-internal-pages`).

Git status (`tools/api-docs-generator`):
- `src/changelog.ts` — **reverted to `HEAD` (baseline)**. Currently compiles to
  the slow implementation.
- `src/changelog.ts.optimized` — untracked. This is the **optimized source
  code**. Swap it in when benchmarking the "after" run.
- `bench-changelog.mjs` — untracked micro-benchmark (Node, standalone).
- `bench/setup-bench-input.ps1` — untracked; stages multi-version metadata.
- `bench/run-bench.ps1` — untracked; times a CLI run + peak RSS. (The
  ProcessStartInfo.ArgumentList approach had issues on the user's pwsh. See
  "Known Issues" below — probably easier to just `Measure-Command` a direct
  `node …\cli.js` invocation.)

Local metadata repo: `D:\MinecraftApiMetadata-internal` (Mojang-internal
clone; has release tags like `release/1.26.14`).

Staged benchmark input: `d:\bench-input` (15 staged releases, ~1 GB on disk).
If this is gone, rebuild it with the staging script below.

Snapshot test package: `d:\minecraft-scripting-libraries\tools\api-docs-generator-test-snapshots`.

## Optimizations In `changelog.ts.optimized` (what the user already approved)

All four changes passed:
- All 44 unit tests in `tools/api-docs-generator`.
- All 12 changelog-related snapshot suites in `api-docs-generator-test-snapshots`
  (including `test/changelog_diffing`).

Changes:

1. **`compareArray` — `Map` lookups instead of `.map().indexOf()` (O(N·M) → O(N+M))**
   - Build one `Map<key, index>` over `nextSubobjects` before the loop.
   - Also build one over `arrayChangelog` so existing entries aren't re-scanned.
   - Defer `splice`s until after the loop so indices remain valid during lookup.

2. **`value` case — skip defensive deep copies when `ignoredSubmembers` is empty**
   - Previously every scalar comparison did 4 `deepCopyJson` calls (2 for the
     compare, 2 for `$old`/`$new`). Fast path uses `deepEqual` directly on the
     source values when no submembers need stripping. The $old/$new deep copies
     still happen on actual change.

3. **`getChangelogForVersion` — reverse linear scan instead of `.map().indexOf()`**
   - The recently-appended version matches first; no intermediate array
     allocation per call.

4. **Per-module changelog copy — stringify once, parse N times**
   - Replaces `moduleWithChangelog.changelog = utils.deepCopyJson(sortedChangelogs)`
     (called once per module) with a single `JSON.stringify(sortedChangelogs,
     replacer)` followed by N `JSON.parse` calls.

## Micro-benchmark Results (already captured)

From `node bench-changelog.mjs` in `tools/api-docs-generator`:

| Hot path | Old | New | Speedup |
|---|---|---|---|
| `compareArray` key lookups | 38.7 ms | 13.0 ms | 3.0× |
| `value`-case comparison (no ignoredSubmembers) | 21,644 ms | 3,064 ms | 7.1× |
| Per-module changelog copy | 7,858 ms | 5,561 ms | 1.4× |

These are synthetic-but-realistic proxies. Real end-to-end numbers still owed.

## How to Continue — Full Procedure

### Step 0: Restore & verify the optimized code

```powershell
cd D:\minecraft-scripting-libraries
# Start from clean baseline
git checkout HEAD -- tools/api-docs-generator/src/changelog.ts

# Sanity-check tests on baseline (optional)
npm run build -- -- --filter=@minecraft/api-docs-generator...
# Expect baseline compile to succeed.
```

The optimized source lives at
`tools/api-docs-generator/src/changelog.ts.optimized`.

### Step 1: Stage multi-version input (if `d:\bench-input` is gone)

Script: `tools/api-docs-generator/bench/setup-bench-input.ps1`

It `git checkout`s each tag into `D:\MinecraftApiMetadata-internal`'s working
tree, copies `docs/publish/raw/script_modules` into a per-release subdir, and
rewrites every `minecraft_version` JSON field to be the release name (so the
generator groups each copy as a separate Minecraft release).

```powershell
$releases = @('1.21.100','1.21.111','1.21.120','1.21.123','1.21.130',
              '1.21.131','1.21.132','1.26.0','1.26.1','1.26.2','1.26.3',
              '1.26.10','1.26.12','1.26.13','1.26.14')
& 'd:\minecraft-scripting-libraries\tools\api-docs-generator\bench\setup-bench-input.ps1' `
    -MetadataRepo 'D:\MinecraftApiMetadata-internal' `
    -OutputDir 'd:\bench-input' `
    -Releases $releases
```

15 releases produces ~1 GB of JSON, which is enough to exercise the slow
path. Consider bumping to 25+ releases if you want to stress memory further
(the original reported issue was "a TON of memory" with "too many versions").

### Step 2: Baseline run (slow code)

Make sure `src/changelog.ts` is the HEAD version. Rebuild:

```powershell
cd D:\minecraft-scripting-libraries
git checkout HEAD -- tools/api-docs-generator/src/changelog.ts
npm run build -- -- --filter=@minecraft/api-docs-generator...
```

Time the CLI. **Must use `--log.level warn`** or redirect stderr — the default
log output is *very* chatty (each merge gets printed) and the volume alone
skews timing. `Measure-Command` is simplest:

```powershell
$env:NODE_OPTIONS = '--max-old-space-size=16384'
Remove-Item d:\bench-output-baseline -Recurse -Force -ErrorAction SilentlyContinue

Measure-Command {
    node D:\minecraft-scripting-libraries\tools\api-docs-generator\lib\cli.js `
         --no-config `
         --input-directory d:\bench-input `
         --output-directory d:\bench-output-baseline `
         --run-generators changelog `
         --log.level warn 2>&1 | Out-Null
}
```

To also capture peak RSS, wrap in:

```powershell
$p = Start-Process -FilePath 'node' -ArgumentList @(
    'D:\minecraft-scripting-libraries\tools\api-docs-generator\lib\cli.js',
    '--no-config',
    '--input-directory','d:\bench-input',
    '--output-directory','d:\bench-output-baseline',
    '--run-generators','changelog',
    '--log.level','warn'
) -NoNewWindow -PassThru -RedirectStandardOutput NUL -RedirectStandardError NUL

$peak = 0
while (-not $p.HasExited) {
    $p.Refresh()
    if ($p.PeakWorkingSet64 -gt $peak) { $peak = $p.PeakWorkingSet64 }
    Start-Sleep -Milliseconds 250
}
$p.Refresh()
if ($p.PeakWorkingSet64 -gt $peak) { $peak = $p.PeakWorkingSet64 }
"Peak working set: $([Math]::Round($peak/1MB,1)) MB"
```

Run **three times** and record median, to absorb filesystem/GC noise. Also
record output size (`Get-ChildItem d:\bench-output-baseline -Recurse -File |
Measure-Object -Sum Length`) — both runs must produce the same output size.

### Step 3: "After" run (optimized code)

```powershell
cd D:\minecraft-scripting-libraries
Copy-Item tools\api-docs-generator\src\changelog.ts.optimized tools\api-docs-generator\src\changelog.ts -Force
npm run build -- -- --filter=@minecraft/api-docs-generator...
```

Then run the same timing procedure against `d:\bench-output-optimized`.

### Step 4: Verify output equivalence

The outputs should be byte-identical (or very nearly so) between the two
builds — this is the strongest correctness signal beyond the snapshot tests.

```powershell
# Compare file lists
$a = Get-ChildItem d:\bench-output-baseline  -Recurse -File | Sort-Object FullName
$b = Get-ChildItem d:\bench-output-optimized -Recurse -File | Sort-Object FullName
Compare-Object $a.Name $b.Name

# Hash-compare all files
$hashA = $a | ForEach-Object { [PSCustomObject]@{ rel = $_.FullName.Replace('d:\bench-output-baseline\',''); hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash } } | Sort-Object rel
$hashB = $b | ForEach-Object { [PSCustomObject]@{ rel = $_.FullName.Replace('d:\bench-output-optimized\',''); hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash } } | Sort-Object rel
Compare-Object $hashA $hashB -Property rel,hash
```

If there's a diff, the snapshot tests wouldn't have caught it — investigate.
The most likely suspect is ordering differences (the `Map<>` lookup preserves
order; the deferred splice in `compareArray` does too; but re-check if any
test fails).

### Step 5: Re-run the snapshot tests with optimized code

```powershell
cd D:\minecraft-scripting-libraries\tools\api-docs-generator
npx vitest run

cd D:\minecraft-scripting-libraries\tools\api-docs-generator-test-snapshots
npx vitest run --no-file-parallelism `
  test/changelog_diffing test/additive_beta_change test/deprecation_warning `
  test/prerelease_warning test/property_and_function_privilege `
  test/only_generate_latest_versions test/minecraft_version_stable `
  test/minecraft_version_alpha test/minecraft_version_beta `
  test/minecraft_version_shipped_stable test/skip_merging_without_parent `
  test/skip_merging_with_parent
```

Expected: 44/44 unit, 18/18 snapshot (12 files) all green.

### Step 6: Record the numbers and commit

When both implementations produce matching output and the optimized version is
measurably faster/smaller, keep `src/changelog.ts` as the optimized version,
delete `src/changelog.ts.optimized`, and commit.

## Known Issues / Gotchas Hit During Investigation

- **`npm run test -- -- --filter=api-docs-generator-test-snapshots` is flaky**
  at the monorepo root. Some tests do `rmSync` / `execSync npx tsc` of shared
  `actual_output` directories, which race under vitest's default
  parallelism and produce `ENOTEMPTY` / tsc failures that look like changelog
  bugs but aren't. Always prefer `cd`-ing into the test package and running
  `npx vitest run --no-file-parallelism <specific test dirs>`. The failures
  seen during this session were all of this flavor; the changelog diffing
  test itself passed cleanly.

- **Default CLI log level is extremely chatty** on real input (one info line
  per module-merge, 100+ entries). This *dominates* wall-clock measurements if
  you don't redirect. Use `--log.level warn` AND redirect stdout/stderr.

- **The test harness sees output from `--run-generators changelog` only** when
  combined with other generators. The raw `changelog` generator writes nothing
  on its own to disk (`--run-generators changelog-json` does). An earlier
  bench attempt saw "0 files" in the output dir — not a failure, just the
  wrong generator choice for verification. For timing *and* verifying output,
  use `--run-generators changelog-json` (or `changelog msdocs ts`) so the
  filesystem has something to diff.

- **`ProcessStartInfo.ArgumentList.Add`** had issues in the user's pwsh during
  this session — the wrapper `bench/run-bench.ps1` failed with exit -1. Use
  `Measure-Command` + `Start-Process` directly or just `Measure-Command` as
  shown in Step 2 and skip the wrapper.

- **Output directory MUST be empty**. The generator `rmSync`s its output root.
  Running two builds against the same output dir back-to-back is fine; running
  while something else holds a file open in it causes `ENOTEMPTY` on Windows.

- **Memory**: use `NODE_OPTIONS=--max-old-space-size=16384` for the baseline
  to avoid OOM on large inputs (that's the actual symptom the user is trying
  to fix).

## Additional Optimization Ideas Not Yet Implemented

If the measured speedup isn't sufficient:

- **Avoid the final `JSON.stringify` entirely**: modules in a group could share
  the exact same changelog reference (immutable) rather than each getting a
  parsed copy. Requires auditing downstream mutation — if any downstream code
  mutates `module.changelog`, this is unsafe. Search for `.changelog` mutation
  in `tools/api-docs-generator` and `tools/markup-generators-plugin`.

- **Cache `config.getVersionKey()`**: it's called inside the inner loop. Pull
  it out to a local once per `generateModuleChangeLog`.

- **The "remove-if-key-only" check in `compareArray`** uses
  `Object.getOwnPropertyNames` which allocates. A counter plus a direct
  property check would be cheaper, at the cost of some readability.

- **Pre-sorting once**: `generateChangelogs` calls `sort(semVerSortComparer)`
  on the module list, then `generateModuleChangeLog` calls
  `modulesJson.sort(sortComparer(versionKey))` again inside. If they're always
  the same order, sort once.

- **`removePropertyRecursive` walks every value**: for `from_module` stripping
  specifically, it would be faster to stringify-with-replacer (which touches
  each value once) than to stringify, parse, walk, re-stringify.

- **Parallelization**: each `currentModuleList` group is independent. Running
  them on worker threads could scale roughly with core count. Non-trivial
  because of how the result is attached back to the modules, but possible.

- **Heap profiling**: run `node --heap-prof` on the baseline to confirm where
  the memory actually goes. The expected top consumer is the N× deepCopyJson
  of the full sorted changelog (already addressed by optimization #4 above).

## File Index

| Path | Purpose |
|---|---|
| `tools/api-docs-generator/src/changelog.ts` | Baseline changelog generator (HEAD) |
| `tools/api-docs-generator/src/changelog.ts.optimized` | **Optimized version — copy over `changelog.ts` to benchmark** |
| `tools/api-docs-generator/bench-changelog.mjs` | Standalone micro-benchmark of the three hot paths |
| `tools/api-docs-generator/bench/setup-bench-input.ps1` | Stages N release tags into a per-release input tree |
| `tools/api-docs-generator/bench/run-bench.ps1` | Timing wrapper (works but buggy — use Measure-Command instead) |
| `tools/api-docs-generator/src/utilities/DeepCopyJson.ts` | `JSON.parse(JSON.stringify(...))` wrapper used everywhere |
| `tools/api-docs-generator/src/utilities/RemoveProperty.ts` | Recursive property stripper |
| `D:\MinecraftApiMetadata-internal` | Metadata repo with release tags |
| `d:\bench-input` | Staged multi-version metadata (rebuild with Step 1 if missing) |

## Acceptance Criteria

- Baseline and optimized runs both complete on the 15-release (or larger)
  bench input.
- Optimized output is byte-identical to baseline output (or differences are
  explained and accepted).
- All unit + relevant snapshot tests pass on the optimized code.
- Numbers recorded for: wall-clock (median of 3), peak RSS.
- Expected rough magnitude based on micro-benchmarks: 2–4× faster end-to-end
  on changelog-heavy inputs, with noticeably lower peak memory. If you see
  less than ~1.3× the micro-benchmarks were lying — investigate which phase
  actually dominates (likely I/O or other generators, not the diff).
