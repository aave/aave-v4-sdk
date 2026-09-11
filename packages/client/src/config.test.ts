import { describe, expect, it } from 'vitest';
import { configureContext } from './config';
import { production, staging } from './environments';

describe('Given a client configuration', () => {
  describe('When no `apiUrl` is provided', () => {
    it('Then it should use the environment backend URL', () => {
      const context = configureContext({});

      expect(context.environment.backend).toBe(production.backend);
    });
  });

  describe('When an `apiUrl` is provided', () => {
    it('Then it should override the environment backend URL', () => {
      const context = configureContext({ apiUrl: 'https://proxy.example/gql' });

      expect(context.environment.backend).toBe('https://proxy.example/gql');
    });

    it('Then it should preserve the remaining environment settings', () => {
      const context = configureContext({
        environment: staging,
        apiUrl: 'https://proxy.example/gql',
      });

      expect(context.environment).toMatchObject({
        name: staging.name,
        indexingTimeout: staging.indexingTimeout,
        pollingInterval: staging.pollingInterval,
      });
      expect(staging.backend).toBe('https://api.staging.aave.com/graphql');
    });

    it('Then it should throw if it is not an absolute URL', () => {
      expect(() => configureContext({ apiUrl: '/graphql' })).toThrow(
        /Invalid `apiUrl`/,
      );
    });
  });
});
