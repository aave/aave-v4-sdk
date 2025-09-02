import { describe, it } from 'vitest';

describe('Aave V4 Hub Scenarios', () => {
  describe('GIVEN a user who wants to list available hubs', () => {
    describe('WHEN fetching hubs by chain ID(s)', () => {
      it.todo('THEN it should return the expected data for each hub');
    });

    describe('WHEN fetching hubs by tokens)', () => {
      it.todo('THEN it should return the expected data for native tokens');

      it.todo('THEN it should return the expected data for ERC20 tokens');
    });
  });

  describe('GIVEN a user who wants to fetch a single hub', () => {
    describe('WHEN fetching a single hub', () => {
      it.todo('THEN it should return the expected data for the hub');
    });
  });

  describe('GIVEN a user who wants to know assets in a hub', () => {
    describe('WHEN fetching assets in a hub', () => {
      it.todo('THEN it should return the expected data for assets in a hub');
    });

    describe.skip('WHEN fetching assets filtered in a hub', () => {
      const status = Object.values(['ACTIVE', 'FROZEN', 'PAUSED']);
      it.each(status)(
        'THEN it should return only assets in a hub with a status: %s',
        (_status) => {
          // TODO: Implement test
        },
      );
    });

    describe.skip('WHEN fetching assets sorted by in a hub', () => {
      const field = Object.values(['NAME', 'BALANCE']);
      it.each(field)(
        'THEN it should return assets sorted by a field: %s',
        (_field) => {
          // TODO: Implement test
        },
      );
    });
  });
});
