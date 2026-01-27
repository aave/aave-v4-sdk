import {
  okAsync,
  type PreparePositionSwapRequest,
  type ResultAsync,
  SigningError,
  type SupplySwapQuoteResult,
} from '@aave/client';
import { signTypedDataWith } from '@aave/client/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';

export function signApprovalsWith(
  wallet: WalletClient<Transport, Chain, Account>,
): (
  result: SupplySwapQuoteResult,
) => ResultAsync<PreparePositionSwapRequest, SigningError> {
  return ({ approvals, quote }: SupplySwapQuoteResult) => {
    let result: ResultAsync<PreparePositionSwapRequest, SigningError> = okAsync(
      {
        quoteId: quote.quoteId,
        adapterContractSignature: null,
        positionManagerSignature: null,
      },
    );

    for (const approval of approvals) {
      result = result.andThen((request) => {
        return signTypedDataWith(wallet, approval.bySignature)
          .mapErr((err) => {
            if (err.name === 'SigningError') {
              return err;
            }
            return SigningError.from(err);
          })
          .map((signature) => {
            if (approval.__typename === 'PositionSwapAdapterContractApproval') {
              request.adapterContractSignature = signature;
            } else {
              request.positionManagerSignature = signature;
            }
            return request;
          });
      });
    }

    return result;
  };
}
