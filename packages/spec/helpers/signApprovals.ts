import {
  okAsync,
  type PositionSwapByIntentApprovalsRequired,
  type PreparePositionSwapRequest,
  type ResultAsync,
  SigningError,
} from '@aave/client';
import { signTypedDataWith } from '@aave/client/viem';
import type { Account, Chain, Transport, WalletClient } from 'viem';

export function signApprovalsWith(
  wallet: WalletClient<Transport, Chain, Account>,
): (
  result: PositionSwapByIntentApprovalsRequired,
) => ResultAsync<PreparePositionSwapRequest, SigningError> {
  return ({ approvals, quote }: PositionSwapByIntentApprovalsRequired) => {
    let result: ResultAsync<PreparePositionSwapRequest, SigningError> = okAsync(
      {
        quoteId: quote.quoteId,
        adapterContractSignature: null,
        positionManagerSignature: null,
        setCollateralSignature: null,
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
            switch (approval.__typename) {
              case 'PositionSwapAdapterContractApproval':
                request.adapterContractSignature = signature;
                break;
              case 'PositionSwapPositionManagerApproval':
                request.positionManagerSignature = signature;
                break;
              case 'PositionSwapSetCollateralApproval':
                request.setCollateralSignature = signature;
                break;
            }
            return request;
          });
      });
    }

    return result;
  };
}
