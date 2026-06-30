// Copyright (c) Mojang AB.  All rights reserved.

/**
 * Add link to {@link TestInfo.propC}.
 * TestCategory description.
 * @beta
 */
export enum TestCategory {
    EnumA = 'enumA',
    EnumB = 'enumB',
}

/**
 * Additional information about key binding.
 * @beta
 */
export type TestInfo = {
    /**
     * Description for propA.
     */
    propA: string;
    /**
     * Description for propB.
     */
    propB?: string;
    /**
     * Description for propD. Add link to {@link TestCategory}.
     */
    propC: string;
};
