import { describe, it } from 'vitest';

describe('Aave V4 Reserve Scenario', () => {
  describe('Given a user who wants to fetch reserves', () => {
    describe('When fetching reserves for a specific hub token', () => {
      it.todo('Then it should return the reserves for an ERC20 hub token');
      it.todo('Then it should return the reserves for a native hub token');
    });

    describe('When fetching reserves for a specific spoke', () => {
      it.todo('Then it should return the reserves for that specific spoke');
    });

    describe('When fetching reserves for a specific token', () => {
      it.todo('Then it should return the reserves for an ERC20 token');
      it.todo('Then it should return the reserves for a native token');
    });

    describe('When fetching reserves ordered by', () => {
      it.todo('Then it should return reserves ordered by apy');
      it.todo('Then it should return reserves ordered by balance');
      it.todo('Then it should return reserves ordered by collateralFactor');
      it.todo('Then it should return reserves ordered by name');
    });

    describe.skip('When fetching reserves filtered by', () => {
      const status = Object.values(['SUPPLY', 'BORROW', 'ALL']);
      it.each(status)(
        'Then it should return only reserves with a status: %s',
        (_status) => {
          // TODO: Implement test
        },
      );
    });
  });

  describe('Given a user who wants to find best borrow reserve', () => {
    const filterReserve = Object.values(['LOWEST_RATE', 'LOWEST_AVERAGE_RATE']);
    describe('When the user searches by chainIds', () => {
      it.each(filterReserve)(
        'Then it should return the best borrow reserve for the chainIds: %s',
        (_filterReserve) => {
          // TODO: Implement test
        },
      );
    });

    describe('When the user searches by spokes', () => {
      it.each(filterReserve)(
        'Then it should return the best borrow reserve for the spokes: %s',
        (_filterReserve) => {
          // TODO: Implement test
        },
      );
    });
  });

  describe('Given a user who wants to find best supply reserve', () => {
    const filterReserve = Object.values([
      'HIGHEST_YIELD',
      'HIGHEST_AVERAGE_YIELD',
    ]);
    describe('When the user searches by chainIds', () => {
      it.each(filterReserve)(
        'Then it should return the best supply reserve for the chainIds: %s',
        (_filterReserve) => {
          // TODO: Implement test
        },
      );
    });

    describe('When the user searches by spokes', () => {
      it.each(filterReserve)(
        'Then it should return the best supply reserve for the spokes: %s',
        (_filterReserve) => {
          // TODO: Implement test
        },
      );
    });
  });
});
