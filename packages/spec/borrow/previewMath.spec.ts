import {
  assertOk,
  bigDecimal,
  evmAddress,
  type PreviewUserPosition,
  type Reserve,
} from '@aave/client';
import { preview } from '@aave/client/actions';
import {
  client,
  createNewWallet,
  ETHEREUM_AAVE_ADDRESS,
  ETHEREUM_SPOKE_CORE_ID,
  ETHEREUM_USDT_ADDRESS,
} from '@aave/client/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { findReservesToBorrow } from '../helpers/reserves';
import {
  borrowFromRandomReserve,
  findReserveAndSupply,
} from '../helpers/supplyBorrow';

const user = await createNewWallet();

describe('Borrow Preview Math', () => {
  describe('Given a user with 1 supply position enabled as collateral', () => {
    describe('And the collateral is a safe token with collateralRisk = 0', () => {
      beforeAll(async () => {
        const setup = await findReserveAndSupply(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          token: ETHEREUM_USDT_ADDRESS, // Safe collateral
          asCollateral: true,
        });
        assertOk(setup);
      });

      describe('When the user previews a borrow action', () => {
        let previewInfo: PreviewUserPosition;

        beforeAll(async () => {
          const reserveToBorrow = await findReservesToBorrow(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
          });
          assertOk(reserveToBorrow);

          const previewResult = await preview(client, {
            action: {
              borrow: {
                reserve: reserveToBorrow.value[0].id,
                amount: {
                  erc20: {
                    value:
                      reserveToBorrow.value[0].userState!.borrowable.amount.value.times(
                        0.2,
                      ),
                  },
                },
                sender: evmAddress(user.account.address),
              },
            },
          });
          assertOk(previewResult);
          previewInfo = previewResult.value;
        });

        it('Then the healthFactor should change from null to a value higher than 1', () => {
          expect(previewInfo.healthFactor.after).toBeBigDecimalGreaterThan(1);
          expect(previewInfo.healthFactor.current).toBeNull();
        });

        it('Then the riskPremium should be 0', () => {
          expect(previewInfo.riskPremium.current.value.eq(0)).toBeTrue();
          expect(previewInfo.riskPremium.after.value.eq(0)).toBeTrue();
        });
      });

      describe('And the user has 1 borrow position', () => {
        let borrowReserve: Reserve;

        beforeAll(async () => {
          const borrowResult = await borrowFromRandomReserve(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            ratioToBorrow: 0.4,
          });
          assertOk(borrowResult);
          borrowReserve = borrowResult.value;
        });
        describe('When the user previews a borrow action adding more debt', () => {
          let previewInfo: PreviewUserPosition;

          beforeAll(async () => {
            const previewResult = await preview(client, {
              action: {
                borrow: {
                  reserve: borrowReserve.id,
                  amount: {
                    erc20: {
                      value:
                        borrowReserve.userState!.borrowable.amount.value.times(
                          0.3,
                        ),
                    },
                  },
                  sender: evmAddress(user.account.address),
                },
              },
            });
            assertOk(previewResult);
            previewInfo = previewResult.value;
          });

          it('Then the healthFactor should decrease', () => {
            expect(previewInfo.healthFactor.after).toBeBigDecimalLessThan(
              previewInfo.healthFactor.current!,
            );
          });

          it('Then the riskPremium should be 0', () => {
            expect(previewInfo.riskPremium.current.value.eq(0)).toBeTrue();
            expect(previewInfo.riskPremium.after.value.eq(0)).toBeTrue();
          });
        });
      });
    });

    describe('And the collateral is a risky token with collateralRisk > 0', () => {
      beforeAll(async () => {
        const setup = await findReserveAndSupply(client, user, {
          spoke: ETHEREUM_SPOKE_CORE_ID,
          token: ETHEREUM_AAVE_ADDRESS, // Risky collateral
          asCollateral: true,
        });
        assertOk(setup);
      });

      describe('When the user previews a borrow action', () => {
        let previewInfo: PreviewUserPosition;

        beforeAll(async () => {
          const reserveToBorrow = await findReservesToBorrow(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
          });
          assertOk(reserveToBorrow);

          const previewResult = await preview(client, {
            action: {
              borrow: {
                reserve: reserveToBorrow.value[0].id,
                amount: {
                  erc20: {
                    value:
                      reserveToBorrow.value[0].userState!.borrowable.amount.value.times(
                        0.4,
                      ),
                  },
                },
                sender: evmAddress(user.account.address),
              },
            },
          });

          assertOk(previewResult);
          previewInfo = previewResult.value;
        });

        it('Then the healthFactor should change from null to a value higher than 1', () => {
          expect(previewInfo.healthFactor.after).toBeBigDecimalGreaterThan(1);
          expect(previewInfo.healthFactor.current).toBeNull();
        });

        it('Then the riskPremium should be greater than 0', () => {
          expect(previewInfo.riskPremium.current.value.eq(0)).toBeTrue();
          expect(previewInfo.riskPremium.after.value).toBeBigDecimalGreaterThan(
            0,
          );
        });
      });

      describe('And the user has 1 borrow position', () => {
        let borrowReserve: Reserve;

        beforeAll(async () => {
          const borrowResult = await borrowFromRandomReserve(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
            ratioToBorrow: 0.4,
          });
          assertOk(borrowResult);
          borrowReserve = borrowResult.value;
        });
        describe('When the user previews a borrow action adding more debt', () => {
          let previewInfo: PreviewUserPosition;

          beforeAll(async () => {
            const previewResult = await preview(client, {
              action: {
                borrow: {
                  reserve: borrowReserve.id,
                  amount: {
                    erc20: {
                      value:
                        borrowReserve.userState!.borrowable.amount.value.times(
                          0.3,
                        ),
                    },
                  },
                  sender: evmAddress(user.account.address),
                },
              },
            });
            assertOk(previewResult);
            previewInfo = previewResult.value;
          });

          it('Then the healthFactor should decrease', () => {
            expect(previewInfo.healthFactor.after).toBeBigDecimalLessThan(
              previewInfo.healthFactor.current!,
            );
          });
          it('Then the riskPremium should be the same', () => {
            expect(
              previewInfo.riskPremium.current.value,
            ).toBeBigDecimalGreaterThan(0);
            expect(previewInfo.riskPremium.after.value).toEqual(
              previewInfo.riskPremium.current.value,
            );
          });
        });
      });

      describe('When the user previews a borrow action that exceeds the borrowing power', () => {
        let previewInfo: PreviewUserPosition;

        beforeAll(async () => {
          const borrowReserve = await findReservesToBorrow(client, user, {
            spoke: ETHEREUM_SPOKE_CORE_ID,
          });
          assertOk(borrowReserve);
          const amountToBorrow = bigDecimal('10000');

          const previewResult = await preview(client, {
            action: {
              borrow: {
                reserve: borrowReserve.value[0].id,
                amount: {
                  erc20: {
                    value: amountToBorrow,
                  },
                },
                sender: evmAddress(user.account.address),
              },
            },
          });
          assertOk(previewResult);
          previewInfo = previewResult.value;
        });

        it('Then the healthFactor should be below 1 and flagged as an error', () => {
          expect(previewInfo.healthFactor.after).toBeBigDecimalLessThan(1);
          expect(previewInfo.healthFactor.current).toBeNull();
        });
      });
    });
  });
});
