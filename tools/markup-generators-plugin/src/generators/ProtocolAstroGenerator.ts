// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { execFileSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import semver from 'semver';

import {
    GeneratorContext,
    Logger,
    MarkupGenerator,
    MinecraftProtocolSchemaObject,
    MinecraftRelease,
    ProtocolChangelogGenerator,
    ProtocolChangelogRelease,
    ProtocolMetadataDocument,
    ProtocolReleaseSnapshot,
} from '@minecraft/api-docs-generator';

const CHANGELOG_RELEASE_COUNT = 15;

const PROJECT_FILES = [
    'README.md',
    'astro.config.mjs',
    'package.json',
    'tsconfig.json',
    'src/components/Datagram.astro',
    'src/components/ChangelogDetail.astro',
    'src/components/FieldTree.astro',
    'src/components/ProtocolSearch.astro',
    'src/components/SerializationTag.astro',
    'src/layouts/Layout.astro',
    'src/pages/changelog/index.astro',
    'src/pages/index.astro',
    'src/pages/packets/[slug].astro',
    'src/pages/primitives/index.astro',
    'src/pages/types/index.astro',
    'src/pages/types/[slug].astro',
    'src/styles/global.css',
    'src/styles/xbox.css',
    'src/types.ts',
] as const;

export class ProtocolAstroGenerator implements MarkupGenerator {
    private readGitProtocolSchemas(
        repositoryRoot: string,
        protocolDirectory: string,
        tag: string
    ): Record<string, MinecraftProtocolSchemaObject> {
        const pathOutput = execFileSync(
            'git',
            ['-C', repositoryRoot, 'ls-tree', '-r', '-z', '--name-only', tag, '--', protocolDirectory],
            { maxBuffer: 16 * 1024 * 1024 }
        );
        const paths = pathOutput
            .toString('utf-8')
            .split('\0')
            .filter(filePath => filePath.endsWith('.json'));
        if (paths.length === 0) return {};

        const references = paths.map(filePath => `${tag}:${filePath}`).join('\n') + '\n';
        const batchOutput = execFileSync('git', ['-C', repositoryRoot, 'cat-file', '--batch'], {
            input: references,
            maxBuffer: 128 * 1024 * 1024,
        });
        const schemas: Record<string, MinecraftProtocolSchemaObject> = {};
        let offset = 0;
        for (const filePath of paths) {
            const headerEnd = batchOutput.indexOf(0x0a, offset);
            if (headerEnd < 0) throw new Error(`Invalid git cat-file output for ${tag}.`);
            const header = batchOutput.subarray(offset, headerEnd).toString('utf-8');
            const size = Number(header.split(' ').at(-1));
            if (!Number.isFinite(size)) throw new Error(`Unable to read ${filePath} from ${tag}.`);
            const contentStart = headerEnd + 1;
            const contentEnd = contentStart + size;
            schemas[path.resolve(repositoryRoot, filePath)] = JSON.parse(
                batchOutput.subarray(contentStart, contentEnd).toString('utf-8')
            ) as MinecraftProtocolSchemaObject;
            offset = contentEnd + 1;
        }
        return schemas;
    }

    private createChangelog(context: GeneratorContext): ProtocolChangelogRelease[] {
        try {
            const repositoryRoot = execFileSync('git', ['-C', context.inputDirectory, 'rev-parse', '--show-toplevel'], {
                encoding: 'utf-8',
            }).trim();
            const tagOutput = execFileSync(
                'git',
                [
                    '-C',
                    repositoryRoot,
                    'for-each-ref',
                    '--format=%(refname:short)%09%(creatordate:short)',
                    'refs/tags/release/',
                ],
                { encoding: 'utf-8' }
            );
            const versions = tagOutput
                .split(/\r?\n/)
                .map(line => {
                    const [tag, releaseDate] = line.split('\t');
                    return { releaseDate, tag, version: tag.replace(/^release\//, '') };
                })
                .filter(entry => entry.tag && semver.valid(entry.version))
                .sort((left, right) => semver.rcompare(left.version, right.version))
                .slice(0, CHANGELOG_RELEASE_COUNT + 1);
            if (versions.length < 2) return [];

            const protocolDirectory = path
                .relative(repositoryRoot, path.join(context.inputDirectory, 'json_schemas', 'protocol'))
                .split(path.sep)
                .join('/');
            const snapshots: ProtocolReleaseSnapshot[] = [];
            for (const entry of versions) {
                const schemas = this.readGitProtocolSchemas(repositoryRoot, protocolDirectory, entry.tag);
                if (Object.keys(schemas).length === 0) continue;
                const firstSchema = Object.values(schemas)[0];
                const release = new MinecraftRelease(firstSchema['x-minecraft-version'] ?? entry.version);
                release.protocol_schemas = schemas;
                snapshots.push({ release, releaseDate: entry.releaseDate, version: entry.version });
            }

            return new ProtocolChangelogGenerator(CHANGELOG_RELEASE_COUNT).generateChangelogs(snapshots);
        } catch (error) {
            Logger.warn(`Unable to generate protocol changelog: ${String(error)}`);
            return [];
        }
    }

    async generateFiles(
        context: GeneratorContext,
        releases: MinecraftRelease[],
        outputDirectory: string
    ): Promise<void> {
        if (releases.length === 0 || Object.keys(releases[0].protocol_schemas).length === 0) {
            Logger.warn(`No protocol schemas found, '${this.name}' generation not possible.`);
            return;
        }

        const { 'protocol-astro': templates } = context.getTemplates(...this.templates);
        const writes = PROJECT_FILES.map(async projectFile => {
            const outputPath = path.join(outputDirectory, projectFile);
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, templates.readFileAsString(projectFile), 'utf-8');
        });
        const metadataPath = path.join(outputDirectory, 'src', 'data', 'protocol.json');
        await fs.mkdir(path.dirname(metadataPath), { recursive: true });
        const changelogGenerator = new ProtocolChangelogGenerator();
        const metadata: ProtocolMetadataDocument = {
            ...changelogGenerator.generateReleaseMetadata(releases[0]),
            changelog: this.createChangelog(context),
        };
        writes.push(fs.writeFile(metadataPath, JSON.stringify(metadata, undefined, 2) + '\n', 'utf-8'));
        await Promise.all(writes);
    }

    readonly id: string = 'protocol-astro';
    readonly name: string = 'Protocol Astro Generator';
    readonly outputDirectoryName: string = 'protocol-astro';
    readonly templates: string[] = ['protocol-astro'];
}
