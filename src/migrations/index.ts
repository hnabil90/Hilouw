import * as migration_20261028_210706_initial from './20261028_210706_initial';
import * as migration_20261028_214804_catalogue_editorial_permissions from './20261028_214804_catalogue_editorial_permissions';
import * as migration_20261028_233812_neutral_brand_copy from './20261028_233812_neutral_brand_copy';

export const migrations = [
  {
    up: migration_20261028_210706_initial.up,
    down: migration_20261028_210706_initial.down,
    name: '20261028_210706_initial',
  },
  {
    up: migration_20261028_214804_catalogue_editorial_permissions.up,
    down: migration_20261028_214804_catalogue_editorial_permissions.down,
    name: '20261028_214804_catalogue_editorial_permissions',
  },
  {
    up: migration_20261028_233812_neutral_brand_copy.up,
    down: migration_20261028_233812_neutral_brand_copy.down,
    name: '20261028_233812_neutral_brand_copy'
  },
];
