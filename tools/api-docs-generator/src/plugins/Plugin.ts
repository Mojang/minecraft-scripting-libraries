// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ChangelogStrategy } from '../ChangelogStrategy';
import { MarkupGenerator } from './MarkupGenerator';

export interface Plugin {
    /**
     * Array of MarkupGenerator objects that can be ran by api-docs-generator
     */
    generators?: MarkupGenerator[];
    /**
     * Dictionary of template id keys and root directories containing template files used by generators
     */
    templates?: Record<string, string>;
    /**
     * Dictionary of changelog strategies that can be used by api-docs-generator
     */
    changelogStrategies?: Record<string, ChangelogStrategy>;
}
