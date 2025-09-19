import { describe, it } from 'vitest';

describe('Aave V4 Hub Scenarios', () => {
  describe('Given a user who wants to list available hubs', () => {
    describe('When fetching hubs by chain ID(s)', () => {
      it.todo('Then it should return the expected data for each hub');
    });

    describe('When fetching hubs by tokens)', () => {
      it.todo('Then it should return the expected data for native tokens');

      it.todo('Then it should return the expected data for ERC20 tokens');
    });
  });

  describe('Given a user who wants to fetch a single hub', () => {
    describe('When fetching a single hub', () => {
      it.todo('Then it should return the expected data for the hub');
    });
  });

  describe('Given a user who wants to know assets in a hub', () => {
    describe('When fetching assets in a hub', () => {
      it.todo('Then it should return the expected data for assets in a hub');
    });

    describe.skip('When fetching assets filtered in a hub', () => {
      const status = Object.values(['ACTIVE', 'FROZEN', 'PAUSED']);
      it.each(status)(
        'Then it should return only assets in a hub with a status: %s',
        (_status) => {
          // TODO: Implement test
        },
      );
    });

    describe.skip('When fetching assets sorted by in a hub', () => {
      const field = Object.values(['NAME', 'BALANCE']);
      it.each(field)(
        'Then it should return assets sorted by a field: %s',
        (_field) => {
          // TODO: Implement test
        },
      );
    });
  });
});
