import {
  type ChainId,
  type EvmAddress,
  InvariantError,
  invariant,
  ok,
  ResultAsync,
  type UnexpectedError,
  type UserSummary,
  type UserSummaryRequest,
} from '@aave/client';
import { userSummary } from '@aave/client/actions';

import * as common from '../../common.js';

function formatAmount(
  symbol: string,
  value: { toFixed: (decimals: number) => string },
) {
  return `${symbol}${value.toFixed(2)}`;
}

export default class UserSummaryCommand extends common.V4Command {
  static override description = 'Show a user summary for a specific chain';

  static override flags = {
    user: common.address({
      required: true,
      description: 'User address',
    }),
    chain_id: common.chain({
      required: true,
      description: 'Chain ID to query summary from',
    }),
  };

  protected override headers = [{ value: 'Metric' }, { value: 'Value' }];

  private getSummaryRequest(): ResultAsync<
    UserSummaryRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(UserSummaryCommand),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      const user = flags.user as EvmAddress;
      const chainId = flags.chain_id as ChainId;

      invariant(user, 'You must provide a user address');
      invariant(chainId, 'You must provide a chain ID');

      return ok({
        user,
        filter: {
          chainIds: [chainId],
        },
      });
    });
  }

  async run(): Promise<UserSummary | InvariantError | UnexpectedError> {
    const result = await this.getSummaryRequest()
      .andThen((request) => userSummary(this.client, request))
      .andThen((summary) => {
        this.display([
          ['Positions', summary.totalPositions],
          [
            'Net Balance',
            formatAmount(
              summary.netBalance.current.symbol,
              summary.netBalance.current.value,
            ),
          ],
          [
            'Total Collateral',
            formatAmount(
              summary.totalCollateral.symbol,
              summary.totalCollateral.value,
            ),
          ],
          [
            'Total Supplied',
            formatAmount(
              summary.totalSupplied.symbol,
              summary.totalSupplied.value,
            ),
          ],
          [
            'Total Debt',
            formatAmount(summary.totalDebt.symbol, summary.totalDebt.value),
          ],
          ['Net APY', `${summary.netApy.normalized.toFixed(4)}%`],
          [
            'Accrued Interest',
            formatAmount(
              summary.netAccruedInterest.symbol,
              summary.netAccruedInterest.value,
            ),
          ],
          [
            'Lowest Health Factor',
            summary.lowestHealthFactor?.toFixed(2) ?? 'N/A',
          ],
        ]);

        return ok(summary);
      });

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
