import {
  assertOk,
  type EvmAddress,
  evmAddress,
  invariant,
  PageSize,
} from '@aave/client-next';
import {
  setSpokeUserPositionManager,
  spokePositionManagers,
  spokeUserPositionManagers,
} from '@aave/client-next/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_FORK_ID,
  ETHEREUM_SPOKES,
} from '@aave/client-next/test-utils';
import { sendWith } from '@aave/client-next/viem';
import { beforeAll, describe, expect, it } from 'vitest';

const user = await createNewWallet();

describe('Authorizing Position Managers on Aave V4', () => {
  let managerAddress: EvmAddress[];

  beforeAll(async () => {
    // Get available position managers
    const managers = await spokePositionManagers(client, {
      spoke: {
        chainId: ETHEREUM_FORK_ID,
        address: ETHEREUM_SPOKES.CORE_SPOKE,
      },
      pageSize: PageSize.Ten,
    });

    assertOk(managers);
    invariant(
      managers.value.items.length > 0,
      'No position managers available',
    );
    managerAddress = managers.value.items.map((m) => m.address);
  });

  describe('Given a user and a spoke with available position managers', () => {
    describe('When querying user position managers before authorization', () => {
      it('Then the user has no authorized position managers initially', async () => {
        const userManagers = await spokeUserPositionManagers(client, {
          spoke: {
            chainId: ETHEREUM_FORK_ID,
            address: ETHEREUM_SPOKES.CORE_SPOKE,
          },
          user: evmAddress(user.account.address),
          pageSize: PageSize.Ten,
        });

        assertOk(userManagers);
        expect(userManagers.value.items.length).toBe(0);
      });
    });

    describe('When the user authorizes a position manager', () => {
      it("Then the position manager is enabled and appears in the user's authorized managers list", async () => {
        const authResult = await setSpokeUserPositionManager(client, {
          spoke: {
            address: ETHEREUM_SPOKES.CORE_SPOKE,
            chainId: ETHEREUM_FORK_ID,
          },
          manager: managerAddress[0]!,
          approve: true,
          user: evmAddress(user.account.address),
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction);

        assertOk(authResult);
        const userManagers = await spokeUserPositionManagers(client, {
          spoke: {
            chainId: ETHEREUM_FORK_ID,
            address: ETHEREUM_SPOKES.CORE_SPOKE,
          },
          user: evmAddress(user.account.address),
          pageSize: PageSize.Ten,
        });

        assertOk(userManagers);
        const authorizedManager = userManagers.value.items.find(
          (m) => m.address === managerAddress[0]!,
        );
        invariant(
          authorizedManager,
          "Position manager not found in user's authorized list",
        );
      });
    });
  });

  describe('Given a user with an authorized position manager', () => {
    describe('When the user revokes the position manager authorization', () => {
      beforeAll(async () => {
        const userManagers = await spokeUserPositionManagers(client, {
          spoke: {
            chainId: ETHEREUM_FORK_ID,
            address: ETHEREUM_SPOKES.CORE_SPOKE,
          },
          user: evmAddress(user.account.address),
          pageSize: PageSize.Ten,
        });

        assertOk(userManagers);
        if (userManagers.value.items.length === 0) {
          const setup = await setSpokeUserPositionManager(client, {
            spoke: {
              address: ETHEREUM_SPOKES.CORE_SPOKE,
              chainId: ETHEREUM_FORK_ID,
            },
            manager: managerAddress[0]!,
            approve: true,
            user: evmAddress(user.account.address),
          })
            .andThen(sendWith(user))
            .andThen(client.waitForTransaction);
          assertOk(setup);
        }
      });

      it("Then the position manager is disabled and no longer appears in the user's authorized managers list", async () => {
        // Get all available managers
        const allUserManagers = await spokeUserPositionManagers(client, {
          spoke: {
            chainId: ETHEREUM_FORK_ID,
            address: ETHEREUM_SPOKES.CORE_SPOKE,
          },
          user: evmAddress(user.account.address),
          pageSize: PageSize.Ten,
        });
        assertOk(allUserManagers);
        invariant(
          allUserManagers.value.items.length >= 1,
          'Need at least 1 manager for this test',
        );

        const managerToUnauthorize = allUserManagers.value.items[0]!.address;

        const revokeResult = await setSpokeUserPositionManager(client, {
          spoke: {
            address: ETHEREUM_SPOKES.CORE_SPOKE,
            chainId: ETHEREUM_FORK_ID,
          },
          manager: managerToUnauthorize,
          approve: false,
          user: evmAddress(user.account.address),
        })
          .andThen(sendWith(user))
          .andThen(client.waitForTransaction);
        assertOk(revokeResult);

        const revokedUserManagers = await spokeUserPositionManagers(client, {
          spoke: {
            chainId: ETHEREUM_FORK_ID,
            address: ETHEREUM_SPOKES.CORE_SPOKE,
          },
          user: evmAddress(user.account.address),
          pageSize: PageSize.Ten,
        });

        assertOk(revokedUserManagers);
        expect(revokedUserManagers.value.items.length).toBe(
          allUserManagers.value.items.length - 1,
        );
        expect(
          revokedUserManagers.value.items.find(
            (m) => m.address === managerToUnauthorize,
          ),
        ).toBeUndefined();
      });
    });
  });
});
