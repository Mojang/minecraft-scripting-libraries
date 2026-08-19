// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from 'path';

import { Plugin } from '@minecraft/api-docs-generator';

import {
    ChangelogJSONGenerator,
    ChangelogMDGenerator,
    MSDocsMarkdownGenerator,
    NPMModuleGenerator,
    ProtocolAstroGenerator,
    ProtocolHTMLGenerator,
    TypeDocGenerator,
    TypeScriptDefinitionGenerator,
    TypeScriptGenerator,
} from './generators';

const templatesRoot = path.resolve(__dirname, '..', 'templates');

const MarkupGeneratorsPlugin: Plugin = {
    generators: [
        new ChangelogJSONGenerator(),
        new ChangelogMDGenerator(),
        new MSDocsMarkdownGenerator(),
        new NPMModuleGenerator(),
        new ProtocolAstroGenerator(),
        new ProtocolHTMLGenerator(),
        new TypeDocGenerator(),
        new TypeScriptDefinitionGenerator(),
        new TypeScriptGenerator(),
    ],
    templates: {
        msdocs: path.join(templatesRoot, 'msdocs'),
        npm: path.join(templatesRoot, 'npm'),
        'protocol-astro': path.join(templatesRoot, 'protocol-astro'),
        ts: path.join(templatesRoot, 'ts'),
        tsdef: path.join(templatesRoot, 'tsdef'),
        txt: path.join(templatesRoot, 'txt'),
    },
};

export default MarkupGeneratorsPlugin;
