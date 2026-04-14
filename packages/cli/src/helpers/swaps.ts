import type { AaveClient } from '@aave/client';
import {
  invariant,
  okAsync,
  type PositionSwapByIntentApprovalsRequired,
  type PreparePositionSwapRequest,
  type ResultAsync,
  type SwapQuote,
  type SwapQuoteId,
  type SwapReceipt,
  supportsPermit,
  type TokenSwapQuoteResult,
  UnexpectedError,
} from '@aave/client';
import {
  preparePositionSwap,
  prepareTokenSwap,
  swap,
} from '@aave/client/actions';
import { sendWith, signTypedDataWith } from '@aave/client/viem';
import type { WalletClient } from 'viem';

function toSwapReceipt(value: unknown): ResultAsync<SwapReceipt, unknown> {
  if (!value || typeof value !== 'object' || !('__typename' in value)) {
    return UnexpectedError.from(value).asResultAsync();
  }

  if (value.__typename === 'SwapReceipt') {
    return okAsync(value as SwapReceipt);
  }

  return UnexpectedError.from(value).asResultAsync();
}

function buildPositionSwapRequest(
  wallet: WalletClient,
  quoteResult: PositionSwapByIntentApprovalsRequired,
): ResultAsync<PreparePositionSwapRequest, unknown> {
  let request: ResultAsync<PreparePositionSwapRequest, unknown> = okAsync({
    quoteId: quoteResult.quote.quoteId,
    adapterContractSignature: null,
    positionManagerSignature: null,
    setCollateralSignature: null,
  });

  for (const approval of quoteResult.approvals) {
    request = request.andThen((next) => {
      switch (approval.__typename) {
        case 'PositionSwapAdapterContractApproval':
          return signTypedDataWith(wallet, approval.bySignature).map(
            (signature) => ({
              ...next,
              adapterContractSignature: signature,
            }),
          );

        case 'PositionSwapPositionManagerApproval':
          invariant(
            approval.bySignature,
            'Position manager approval by transaction is not supported in CLI swap flow',
          );
          return signTypedDataWith(wallet, approval.bySignature).map(
            (signature) => ({
              ...next,
              positionManagerSignature: signature,
            }),
          );

        case 'PositionSwapSetCollateralApproval':
          return signTypedDataWith(wallet, approval.bySignature).map(
            (signature) => ({
              ...next,
              setCollateralSignature: signature,
            }),
          );
      }
    });
  }

  return request;
}

export function executePositionMarketSwap(
  client: AaveClient,
  wallet: WalletClient,
  quoteResult: PositionSwapByIntentApprovalsRequired,
): ResultAsync<SwapReceipt, unknown> {
  return buildPositionSwapRequest(wallet, quoteResult)
    .andThen((request) => preparePositionSwap(client, request))
    .andThen(({ newQuoteId, data }) =>
      signTypedDataWith(wallet, data).andThen((signature) =>
        swap(client, {
          intent: {
            quoteId: newQuoteId,
            signature,
          },
        }),
      ),
    )
    .andThen(toSwapReceipt);
}

function executeTransactionSwap(
  client: AaveClient,
  wallet: WalletClient,
  quoteId: SwapQuoteId,
): ResultAsync<SwapReceipt, unknown> {
  return swap(client, {
    transaction: { quoteId },
  }).andThen((plan) => {
    if (plan.__typename === 'SwapReceipt') {
      return okAsync(plan);
    }

    return sendWith(wallet, plan.transaction)
      .andThen(client.waitForTransaction)
      .map(() => plan.orderReceipt);
  });
}

function processTokenApprovals(
  client: AaveClient,
  wallet: WalletClient,
  quoteResult:
    | Extract<
        TokenSwapQuoteResult,
        { __typename: 'SwapByIntentWithApprovalRequired' }
      >
    | Extract<
        TokenSwapQuoteResult,
        { __typename: 'SwapByTransactionWithApprovalRequired' }
      >,
): ResultAsync<
  {
    permitSig: { deadline: number; value: unknown } | null;
    quoteId: SwapQuoteId;
  },
  unknown
> {
  if (supportsPermit(quoteResult)) {
    const permit = quoteResult.approvals[0];
    return signTypedDataWith(wallet, permit.bySignature).map((value) => ({
      permitSig: {
        deadline: permit.bySignature.message.deadline as number,
        value,
      },
      quoteId: quoteResult.quote.quoteId,
    }));
  }

  let chain: ResultAsync<unknown, unknown> = okAsync(undefined);

  for (const approval of quoteResult.approvals) {
    chain = chain.andThen(() => {
      invariant(
        approval.byTransaction,
        'Approval by transaction data is missing',
      );
      return sendWith(wallet, approval.byTransaction)
        .andThen(client.waitForTransaction)
        .map(() => undefined);
    });
  }

  return chain.map(() => ({
    permitSig: null,
    quoteId: quoteResult.quote.quoteId,
  }));
}

export function executeTokenMarketSwap(
  client: AaveClient,
  wallet: WalletClient,
  quoteResult: TokenSwapQuoteResult,
): ResultAsync<SwapReceipt, unknown> {
  switch (quoteResult.__typename) {
    case 'SwapByIntent':
      return prepareTokenSwap(client, {
        quoteId: quoteResult.quote.quoteId,
      })
        .andThen(({ data, newQuoteId }) =>
          signTypedDataWith(wallet, data).andThen((signature) =>
            swap(client, {
              intent: {
                quoteId: newQuoteId,
                signature,
              },
            }),
          ),
        )
        .andThen(toSwapReceipt);

    case 'SwapByIntentWithApprovalRequired':
      return processTokenApprovals(client, wallet, quoteResult)
        .andThen(({ permitSig, quoteId }) =>
          prepareTokenSwap(client, {
            quoteId,
            permitSig: permitSig as never,
          }),
        )
        .andThen(({ data, newQuoteId }) =>
          signTypedDataWith(wallet, data).andThen((signature) =>
            swap(client, {
              intent: {
                quoteId: newQuoteId,
                signature,
              },
            }),
          ),
        )
        .andThen(toSwapReceipt);

    case 'SwapByTransaction':
      return executeTransactionSwap(client, wallet, quoteResult.quote.quoteId);

    case 'SwapByTransactionWithApprovalRequired':
      return processTokenApprovals(client, wallet, quoteResult).andThen(
        ({ quoteId }) => executeTransactionSwap(client, wallet, quoteId),
      );

    default:
      return UnexpectedError.upgradeRequired(
        `Unsupported swap quote result: ${quoteResult.__typename}`,
      ).asResultAsync();
  }
}

export function quoteRows(quote: SwapQuote): [string, string][] {
  const rows: [string, string][] = [];

  rows.push(
    ['Sell', `${quote.sell.amount.value} ${quote.sell.token.info.symbol}`],
    ['Buy', `${quote.buy.amount.value} ${quote.buy.token.info.symbol}`],
    [
      'Final Buy',
      `${quote.finalBuy.amount.value} ${quote.finalBuy.token.info.symbol}`,
    ],
    [
      'Final Sell',
      `${quote.finalSell.amount.value} ${quote.finalSell.token.info.symbol}`,
    ],
  );

  return rows;
}
