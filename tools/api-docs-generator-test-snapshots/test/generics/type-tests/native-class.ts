import {
    BaseFixture,
    DerivedFixture,
    FixtureRegistry,
    NativeClass,
} from '@minecraft/generic-fixtures';

const token: NativeClass<BaseFixture> = DerivedFixture;
const fixture: DerivedFixture | undefined = FixtureRegistry.get(DerivedFixture);

void token;
void fixture;
