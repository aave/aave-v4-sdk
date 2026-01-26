import {
  assertOk,
  bigDecimal,
  evmAddress,
  invariant,
  type PreviewUserPosition,
  type Reserve,
  type SupplyRequest,
  type UserPosition,
} from '@aave/client';
import { preview, userPosition } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_AAVE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
} from '@aave/client/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReservesToSupply } from '../helpers/reserves';
import {
  borrowFromRandomReserve,
  findReserveAndSupply,
  fundAndSupplyToReserve,
} from '../helpers/supplyBorrow';

const user = await createNewWallet();

describe('Supply Preview Math', () => {
  describe('Given a user with 1 supply position enabled as collateral', () => {
    let supplyReserve: Reserve;

    beforeAll(async () => {
      const setup = await findReserveAndSupply(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        token: ETHEREUM_USDC_ADDRESS,
        asCollateral: true,
      });
      assertOk(setup);
      supplyReserve = setup.value.reserveInfo;
    });

    describe('And the user has 1 borrow position', () => {
      beforeAll(async () => {
        const setup = await borrowFromRandomReserve(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          ratioToBorrow: 0.5,
        });
        assertOk(setup);
      });

      describe('When the user previews a supply action adding more collateral to the same position', () => {
        let previewInfo: PreviewUserPosition;
        let operationInfo: UserPosition;

        beforeAll(async () => {
          const supplyRequest: SupplyRequest = {
            reserve: supplyReserve.id,
            amount: { erc20: { value: bigDecimal('10') } },
            sender: evmAddress(user.account.address),
          };

          const previewResult = await preview(client, {
            action: {
              supply: supplyRequest,
            },
          });
          assertOk(previewResult);
          previewInfo = previewResult.value;

          const result = await fundAndSupplyToReserve(client, user, {
            reserveId: supplyReserve.id,
            amount: bigDecimal('10'),
          }).andThen(() =>
            userPosition(client, {
              userSpoke: {
                spoke: ETHEREUM_SPOKE_CORE_ID,
                user: evmAddress(user.account.address),
              },
            }),
          );
          assertOk(result);
          operationInfo = result.value!;
        });

        it('Then the healthFactor should increase', () => {
          expect(previewInfo.healthFactor.after).toBeBigDecimalGreaterThan(
            previewInfo.healthFactor.current,
          );

          expect(previewInfo.healthFactor.after).toBeBigDecimalCloseTo(
            operationInfo.healthFactor.current,
            4,
          );
        });
        it('Then the riskPremium should remain unchanged', () => {
          expect(previewInfo.riskPremium.after.value).toEqual(
            previewInfo.riskPremium.current.value,
          );

          expect(
            previewInfo.riskPremium.after.value.eq(
              operationInfo.riskPremium?.current.value ?? 0,
            ),
          ).toBe(true);
        });
      });

      describe('When the user previews a supply action to a different reserve without enabling it as collateral', () => {
        let previewInfo: PreviewUserPosition;

        beforeAll(async () => {
          const newReserveToSupply = await findReservesToSupply(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
          }).map((reserves) => {
            return reserves.find((reserve) => reserve.id !== supplyReserve.id);
          });
          assertOk(newReserveToSupply);
          invariant(newReserveToSupply.value, 'No new reserve to supply to');

          const supplyRequest: SupplyRequest = {
            reserve: newReserveToSupply.value.id,
            amount: { erc20: { value: bigDecimal('10') } },
            sender: evmAddress(user.account.address),
          };
          const previewResult = await preview(client, {
            action: {
              supply: supplyRequest,
            },
          });
          assertOk(previewResult);
          previewInfo = previewResult.value;
        });

        it('Then the healthFactor should remain unchanged', () => {
          expect(previewInfo.healthFactor.after).toEqual(
            previewInfo.healthFactor.current,
          );
        });

        it('Then the riskPremium should remain unchanged', () => {
          expect(previewInfo.riskPremium.after).toEqual(
            previewInfo.riskPremium.current,
          );
        });
      });

      describe('And the user has another supply position that is not enabled as collateral', () => {
        let newSupplyReserve: Reserve;

        beforeAll(async () => {
          const newSupplyPositionResult = await findReserveAndSupply(
            client,
            user,
            {
              spoke: ETHEREUM_SPOKE_CORE_ID,
              token: ETHEREUM_AAVE_ADDRESS,
              asCollateral: false,
            },
          );
          assertOk(newSupplyPositionResult);
          newSupplyReserve = newSupplyPositionResult.value.reserveInfo;
        });

        describe('When the user previews a supply action to that position without enabling it as collateral', () => {
          let previewInfo: PreviewUserPosition;

          beforeAll(async () => {
            const supplyRequest: SupplyRequest = {
              reserve: newSupplyReserve.id,
              amount: { erc20: { value: bigDecimal('0.2') } },
              sender: evmAddress(user.account.address),
            };
            const previewResult = await preview(client, {
              action: {
                supply: supplyRequest,
              },
            });
            assertOk(previewResult);
            previewInfo = previewResult.value;
          });

          it('Then the healthFactor should remain unchanged', () => {
            expect(previewInfo.healthFactor.after).toEqual(
              previewInfo.healthFactor.current,
            );
          });

          it('Then the riskPremium should remain unchanged', () => {
            expect(previewInfo.riskPremium.after).toEqual(
              previewInfo.riskPremium.current,
            );
          });
        });

        describe('When the user previews a supply action to that position and enables it as collateral', () => {
          let previewInfo: PreviewUserPosition;

          beforeAll(async () => {
            const supplyRequest: SupplyRequest = {
              reserve: newSupplyReserve.id,
              amount: { erc20: { value: bigDecimal('0.2') } },
              sender: evmAddress(user.account.address),
              enableCollateral: true,
            };
            const previewResult = await preview(client, {
              action: {
                supply: supplyRequest,
              },
            });
            assertOk(previewResult);
            previewInfo = previewResult.value;
          });

          it('Then the healthFactor should increase', () => {
            expect(previewInfo.healthFactor.after).toBeBigDecimalGreaterThan(
              previewInfo.healthFactor.current,
            );
          });

          it('Then the riskPremium should remain unchanged', () => {
            expect(previewInfo.riskPremium.after).toEqual(
              previewInfo.riskPremium.current,
            );
          });
        });
      });
    });
  });
});
