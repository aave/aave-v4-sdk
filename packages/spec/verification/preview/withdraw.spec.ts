import {
  assertOk,
  type BigDecimal,
  bigDecimal,
  evmAddress,
  type HealthFactorError,
  type PreviewUserPosition,
  type Reserve,
} from '@aave/client';
import { preview } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_AAVE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDC_ADDRESS,
  ETHEREUM_USDT_ADDRESS,
  fundErc20Address,
} from '@aave/client/testing';
import type { Account, Chain, Transport, WalletClient } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  borrowFromRandomReserve,
  findReserveAndSupply,
} from '../../helpers/supplyBorrow';
import { repayAllExistingBorrows } from '../../helpers/withdrawRepay';

describe('Withdraw Preview Math', () => {
  describe('Given a user with 1 supply position enabled as collateral', () => {
    let user: WalletClient<Transport, Chain, Account>;
    let suppliedReserve: Reserve;
    let suppliedAmount: BigDecimal;

    beforeAll(async () => {
      user = await createNewWallet();
      const setup = await findReserveAndSupply(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        asCollateral: true,
      });
      assertOk(setup);
      suppliedReserve = setup.value.reserveInfo;
      suppliedAmount = setup.value.amountSupplied;
    });

    describe('And the user has 1 borrow position', () => {
      beforeAll(async () => {
        const borrowResult = await borrowFromRandomReserve(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          ratioToBorrow: 0.3,
        });
        assertOk(borrowResult);
      });

      describe('When the user previews a withdraw action removing part of the collateral', () => {
        let previewInfo: PreviewUserPosition;

        beforeAll(async () => {
          const previewResult = await preview(client, {
            action: {
              withdraw: {
                reserve: suppliedReserve.id,
                sender: evmAddress(user.account.address),
                amount: {
                  erc20: {
                    exact: suppliedAmount.div(10),
                  },
                },
              },
            },
          });
          assertOk(previewResult);
          previewInfo = previewResult.value;
        });

        it('Then the healthFactor should decrease', () => {
          expect(previewInfo.healthFactor.after).toBeBigDecimalLessThan(
            previewInfo.healthFactor.current,
          );
        });
        it('Then the riskPremium should remain unchanged', () => {
          expect(previewInfo.riskPremium.after.value).toEqual(
            previewInfo.riskPremium.current.value,
          );
        });
      });

      describe('When the user previews a withdraw action that exceeds the safety threshold', () => {
        let previewInfo: PreviewUserPosition;

        beforeAll(async () => {
          const previewResult = await preview(client, {
            action: {
              withdraw: {
                reserve: suppliedReserve.id,
                sender: evmAddress(user.account.address),
                amount: {
                  erc20: {
                    exact: suppliedAmount.times(0.95),
                  },
                },
              },
            },
          });
          assertOk(previewResult);
          previewInfo = previewResult.value;
        });

        it('Then the healthFactor should be below 1 and flagged as an error', () => {
          expect(previewInfo.healthFactor.__typename).toBe('HealthFactorError');
          expect(previewInfo.healthFactor.after).toBeBigDecimalLessThan(1);
          expect((previewInfo.healthFactor as HealthFactorError).reason).toBe(
            'Withdrawing this amount would reduce the health factor below 1',
          );
        });
      });
    });
  });

  describe('Given a user with 2 supply positions enabled as collateral, with different collateralRisk values', () => {
    let user: WalletClient<Transport, Chain, Account>;
    let lowestCollateralRiskSupply: {
      reserveInfo: Reserve;
      amountSupplied: BigDecimal;
    };
    let highestCollateralRiskSupply: {
      reserveInfo: Reserve;
      amountSupplied: BigDecimal;
    };

    beforeAll(async () => {
      user = await createNewWallet();

      const firstSupplyResult = await findReserveAndSupply(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        token: ETHEREUM_AAVE_ADDRESS,
        asCollateral: true,
      });
      assertOk(firstSupplyResult);

      const secondSupplyResult = await findReserveAndSupply(client, user, {
        spoke: ETHEREUM_SPOKE_CORE_ID,
        token: ETHEREUM_USDC_ADDRESS,
        asCollateral: true,
      });
      assertOk(secondSupplyResult);

      // Fund the user with USDT to avoid repay debt issues
      const fundResult = await fundErc20Address(
        evmAddress(user.account.address),
        {
          address: ETHEREUM_USDT_ADDRESS,
          amount: bigDecimal('100'),
          decimals: 6,
        },
      );
      assertOk(fundResult);

      const firstRisk =
        firstSupplyResult.value.reserveInfo.settings.collateralRisk.value;
      const secondRisk =
        secondSupplyResult.value.reserveInfo.settings.collateralRisk.value;

      if (firstRisk.lte(secondRisk)) {
        lowestCollateralRiskSupply = firstSupplyResult.value;
        highestCollateralRiskSupply = secondSupplyResult.value;
      } else {
        lowestCollateralRiskSupply = secondSupplyResult.value;
        highestCollateralRiskSupply = firstSupplyResult.value;
      }
    }, 80_000);

    describe('And the user has 1 borrow position distributed across the borrowing power of both collaterals', () => {
      beforeAll(async () => {
        const borrowResult = await borrowFromRandomReserve(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          token: ETHEREUM_USDT_ADDRESS,
          ratioToBorrow: 0.9,
        });
        assertOk(borrowResult);
      });

      describe('When the user previews a withdraw action from the collateral with the lower collateralRisk', () => {
        let previewInfo: PreviewUserPosition;

        beforeAll(async () => {
          const previewResult = await preview(client, {
            action: {
              withdraw: {
                reserve: lowestCollateralRiskSupply.reserveInfo.id,
                sender: evmAddress(user.account.address),
                amount: {
                  erc20: {
                    exact: lowestCollateralRiskSupply.amountSupplied.times(0.8),
                  },
                },
              },
            },
          });
          assertOk(previewResult);
          previewInfo = previewResult.value;
        });

        it('Then the healthFactor should decrease', () => {
          expect(previewInfo.healthFactor.after).toBeBigDecimalLessThan(
            previewInfo.healthFactor.current,
          );
        });

        it('Then the riskPremium should increase', () => {
          expect(previewInfo.riskPremium.after.value).toBeBigDecimalGreaterThan(
            previewInfo.riskPremium.current.value,
          );
        });
      });

      describe('When the user previews a withdraw action from the collateral with the higher collateralRisk', () => {
        let previewInfo: PreviewUserPosition;

        beforeAll(async () => {
          const previewResult = await preview(client, {
            action: {
              withdraw: {
                reserve: highestCollateralRiskSupply.reserveInfo.id,
                sender: evmAddress(user.account.address),
                amount: {
                  erc20: {
                    exact:
                      highestCollateralRiskSupply.amountSupplied.times(0.8),
                  },
                },
              },
            },
          });
          assertOk(previewResult);
          previewInfo = previewResult.value;
        });

        it('Then the healthFactor should decrease', () => {
          expect(previewInfo.healthFactor.after).toBeBigDecimalLessThan(
            previewInfo.healthFactor.current,
          );
        });
        it('Then the riskPremium should remain unchanged', () => {
          expect(previewInfo.riskPremium.after.value).toEqual(
            previewInfo.riskPremium.current.value,
          );
        });
      });
    });

    describe('And the user has 1 borrow position that is fully covered by the safest collateral', () => {
      beforeAll(async () => {
        await repayAllExistingBorrows(client, user, ETHEREUM_SPOKE_CORE_ID);

        const borrowResult = await borrowFromRandomReserve(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          token: ETHEREUM_USDT_ADDRESS,
          ratioToBorrow: 0.1,
        });
        assertOk(borrowResult);
      });

      describe('When the user previews a withdraw action from the collateral with the lower collateralRisk', () => {
        let previewInfo: PreviewUserPosition;

        beforeAll(async () => {
          const previewResult = await preview(client, {
            action: {
              withdraw: {
                reserve: lowestCollateralRiskSupply.reserveInfo.id,
                sender: evmAddress(user.account.address),
                amount: { erc20: { max: true } },
              },
            },
          });
          assertOk(previewResult);
          previewInfo = previewResult.value;
        });

        it('Then the healthFactor should decrease', () => {
          expect(previewInfo.healthFactor.after).toBeBigDecimalLessThan(
            previewInfo.healthFactor.current,
          );
        });
        it('Then the riskPremium should increase', () => {
          expect(previewInfo.riskPremium.after.value).toBeBigDecimalGreaterThan(
            previewInfo.riskPremium.current.value,
          );
        });
      });

      describe('When the user previews a withdraw action from the collateral with the higher collateralRisk', () => {
        let previewInfo: PreviewUserPosition;

        beforeAll(async () => {
          const previewResult = await preview(client, {
            action: {
              withdraw: {
                reserve: highestCollateralRiskSupply.reserveInfo.id,
                sender: evmAddress(user.account.address),
                amount: { erc20: { max: true } },
              },
            },
          });
          assertOk(previewResult);
          previewInfo = previewResult.value;
        });

        it('Then the healthFactor should decrease', () => {
          expect(previewInfo.healthFactor.after).toBeBigDecimalLessThan(
            previewInfo.healthFactor.current,
          );
        });
        it('Then the riskPremium should remain unchanged', () => {
          expect(previewInfo.riskPremium.after.value).toEqual(
            previewInfo.riskPremium.current.value,
          );
        });
      });
    });
  });
});
