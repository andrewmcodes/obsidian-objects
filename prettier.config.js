import shared from '@andrewmcodes/prettier-config';

// Extend the shared config: never hard-wrap prose, so each paragraph stays on a
// single line and reflows in the editor instead of at a fixed column.
export default {
  ...shared,
  proseWrap: 'never',
};
