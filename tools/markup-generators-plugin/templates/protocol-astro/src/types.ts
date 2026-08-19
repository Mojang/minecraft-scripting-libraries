export type ProtocolTypeCategory = 'array' | 'enum' | 'object' | 'scalar' | 'union' | 'other';

export interface ProtocolVariant {
    index: number;
    target?: string;
    title: string;
    type: string;
}

export interface ProtocolField {
    children?: ProtocolField[];
    description: string;
    enumValues?: string[];
    name: string;
    ordinal?: number;
    required: boolean;
    serialization: string[];
    target?: string;
    type: string;
    variants?: ProtocolVariant[];
    wireSize: string;
    wireSizeBytes: number;
}

export interface ProtocolUse {
    packetSlug: string;
    packetTitle: string;
    path: string[];
}

export interface ProtocolWireFormat {
    serialization: string[];
    type: string;
}

export interface ProtocolType {
    category: ProtocolTypeCategory;
    description: string;
    enumValues: string[];
    fields: ProtocolField[];
    slug: string;
    title: string;
    uses: ProtocolUse[];
    serialization: string[];
    wireFormats: ProtocolWireFormat[];
}

export interface ProtocolPacket {
    description: string;
    details: string;
    fields: ProtocolField[];
    id: number;
    slug: string;
    title: string;
}

export interface ProtocolPrimitive {
    category: 'Boolean' | 'Floating point' | 'Signed integer' | 'Text' | 'Unsigned integer';
    encoding: string;
    size: string;
    slug: string;
    title: string;
}

export interface ProtocolChangeItem {
    details: string[];
    slug: string;
    title: string;
}

export interface ProtocolChangeSet {
    added: ProtocolChangeItem[];
    changed: ProtocolChangeItem[];
    removed: ProtocolChangeItem[];
}

export interface ProtocolChangelogRelease {
    minecraftVersion: string;
    packets: ProtocolChangeSet;
    previousProtocolVersion: string;
    previousVersion: string;
    protocolVersion: string;
    protocolVersionShouldHaveChanged: boolean;
    releaseDate: string;
    totalChanges: number;
    types: ProtocolChangeSet;
    version: string;
}

export interface ProtocolMetadata {
    changelog: ProtocolChangelogRelease[];
    minecraftVersion: string;
    packets: ProtocolPacket[];
    primitives: ProtocolPrimitive[];
    protocolVersion: string;
    types: ProtocolType[];
}
