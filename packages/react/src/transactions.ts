import type { UnexpectedError } from '@aave/client-next';
import {
  borrow,
  // collateralToggle,
  // liquidate,
  liquidatePosition,
  preview,
  repay,
  setSpokeUserPositionManager,
  supply,
  withdraw,
} from '@aave/client-next/actions';
import type {
  BorrowRequest,
  ExecutionPlan,
  LiquidatePositionRequest,
  PreviewRequest,
  PreviewUserPositionResult,
  RepayRequest,
  SetSpokeUserPositionManagerRequest,
  SupplyRequest,
  TransactionRequest,
  WithdrawRequest,
} from '@aave/graphql-next';
import { useAaveClient } from './context';
import { type UseAsyncTask, useAsyncTask } from './helpers';

/**
 * A hook that provides a way to supply assets to an Aave market.
 *
 * ```ts
 * const [supply, supplying] = useSupply();
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 *
 * const loading = supplying.loading && sending.loading;
 * const error = supplying.error || sending.error;
 *
 * // …
 *
 * const result = await supply({ ... })
 *   .andThen((plan) => {
 *     switch (plan.__typename) {
 *       case 'TransactionRequest':
 *         return sendTransaction(plan);
 *
 *       case 'ApprovalRequired':
 *         return sendTransaction(plan.approval)
 *           .andThen(() => sendTransaction(plan.originalTransaction));
 *
 *       case 'InsufficientBalanceError':
 *         return errAsync(
 *           new Error(`Insufficient balance: ${plan.required.value} required.`)
 *         );
 *     }
 *   });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 */
export function useSupply(): UseAsyncTask<
  SupplyRequest,
  ExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SupplyRequest) => supply(client, request));
}

/**
 * A hook that provides a way to borrow assets from an Aave market.
 *
 * ```ts
 * const [borrow, borrowing] = useBorrow();
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 *
 * const loading = borrowing.loading && sending.loading;
 * const error = borrowing.error || sending.error;
 *
 * // …
 *
 * const result = await borrow({ ... })
 *   .andThen((plan) => {
 *     switch (plan.__typename) {
 *       case 'TransactionRequest':
 *         return sendTransaction(plan);
 *
 *       case 'ApprovalRequired':
 *         return sendTransaction(plan.approval)
 *           .andThen(() => sendTransaction(plan.originalTransaction));
 *
 *       case 'InsufficientBalanceError':
 *         return errAsync(
 *           new Error(`Insufficient balance: ${plan.required.value} required.`)
 *         );
 *     }
 *   });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 */
export function useBorrow(): UseAsyncTask<
  BorrowRequest,
  ExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: BorrowRequest) => borrow(client, request));
}

/**
 * A hook that provides a way to repay borrowed assets to an Aave market.
 *
 * ```ts
 * const [repay, repaying] = useRepay();
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 *
 * const loading = repaying.loading && sending.loading;
 * const error = repaying.error || sending.error;
 *
 * // …
 *
 * const result = await repay({ ... })
 *   .andThen((plan) => {
 *     switch (plan.__typename) {
 *       case 'TransactionRequest':
 *         return sendTransaction(plan);
 *
 *       case 'ApprovalRequired':
 *         return sendTransaction(plan.approval)
 *           .andThen(() => sendTransaction(plan.originalTransaction));
 *
 *       case 'InsufficientBalanceError':
 *         return errAsync(
 *           new Error(`Insufficient balance: ${plan.required.value} required.`)
 *         );
 *     }
 *   });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 */
export function useRepay(): UseAsyncTask<
  RepayRequest,
  ExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: RepayRequest) => repay(client, request));
}

/**
 * A hook that provides a way to withdraw supplied assets from an Aave market.
 *
 * ```ts
 * const [withdraw, withdrawing] = useWithdraw();
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 *
 * const loading = withdrawing.loading && sending.loading;
 * const error = withdrawing.error || sending.error;
 *
 * // …
 *
 * const result = await withdraw({ ... })
 *   .andThen((plan) => {
 *     switch (plan.__typename) {
 *       case 'TransactionRequest':
 *         return sendTransaction(plan);
 *
 *       case 'ApprovalRequired':
 *         return sendTransaction(plan.approval)
 *           .andThen(() => sendTransaction(plan.originalTransaction));
 *
 *       case 'InsufficientBalanceError':
 *         return errAsync(
 *           new Error(`Insufficient balance: ${plan.required.value} required.`)
 *         );
 *     }
 *   });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 */
export function useWithdraw(): UseAsyncTask<
  WithdrawRequest,
  ExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: WithdrawRequest) => withdraw(client, request));
}

/**
 * A hook that provides a way to enable/disable a specific supplied asset as collateral.
 *
 * ```ts
 * const [toggle, toggling] = useCollateralToggle();
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 *
 * const loading = toggling.loading && sending.loading;
 * const error = toggling.error || sending.error;
 *
 * // …
 *
 * const result = await toggle({ ... })
 *   .andThen(sendTransaction);
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 */
// export function useCollateralToggle(): UseAsyncTask<
//   CollateralToggleRequest,
//   TransactionRequest,
//   UnexpectedError
// > {
//   const client = useAaveClient();

//   return useAsyncTask((request: CollateralToggleRequest) =>
//     collateralToggle(client, request),
//   );
// }

// /**
//  * A hook that provides a way to liquidate a non-healthy position with Health Factor below 1.
//  *
//  * ```ts
//  * const [liquidate, liquidating] = useLiquidate();
//  * const [sendTransaction, sending] = useSendTransaction(wallet);
//  *
//  * const loading = liquidating.loading && sending.loading;
//  * const error = liquidating.error || sending.error;
//  *
//  * // …
//  *
//  * const result = await liquidate({ ... })
//  *   .andThen(sendTransaction);
//  *
//  * if (result.isErr()) {
//  *   console.error(result.error);
//  *   return;
//  * }
//  *
//  * console.log('Transaction sent with hash:', result.value);
//  * ```
//  */
// export function useLiquidate(): UseAsyncTask<
//   LiquidateRequest,
//   TransactionRequest,
//   UnexpectedError
// > {
//   const client = useAaveClient();

//   return useAsyncTask((request: LiquidateRequest) =>
//     liquidate(client, request),
//   );
// }

/**
 * A hook that provides a way to liquidate a user's position.
 *
 * ```ts
 * const [liquidatePosition, liquidating] = useLiquidatePosition();
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 *
 * const loading = liquidating.loading || sending.loading;
 * const error = liquidating.error || sending.error;
 *
 * // …
 *
 * const result = await liquidatePosition({
 *   spoke: {
 *     address: evmAddress('0x87870bca…'),
 *     chainId: chainId(1),
 *   },
 *   collateral: reserveId(1),
 *   debt: reserveId(2),
 *   amount: amount,
 *   liquidator: liquidator,
 *   borrower: borrower,
 * })
 *   .andThen((plan) => {
 *     switch (plan.__typename) {
 *       case 'TransactionRequest':
 *         return sendTransaction(plan);
 *
 *       case 'ApprovalRequired':
 *         return sendTransaction(plan.approval)
 *           .andThen(() => sendTransaction(plan.originalTransaction));
 *
 *       case 'InsufficientBalanceError':
 *         return errAsync(
 *           new Error(`Insufficient balance: ${plan.required.value} required.`)
 *         );
 *     }
 *   });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Transaction sent with hash:', result.value);
 * ```
 */
export function useLiquidatePosition(): UseAsyncTask<
  LiquidatePositionRequest,
  ExecutionPlan,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: LiquidatePositionRequest) =>
    liquidatePosition(client, request),
  );
}

/**
 * A hook that provides a way to set or remove a position manager for a user on a specific spoke.
 *
 * **Position managers** can perform transactions on behalf of other users, including:
 * - Supply assets using `onBehalfOf`
 * - Borrow assets using `onBehalfOf`
 * - Withdraw assets using `onBehalfOf`
 * - Enable/disable collateral using `onBehalfOf`
 *
 * The `signature` parameter is an **ERC712 signature** that must be signed by the **user**
 * (the account granting permissions) to authorize the position manager. The signature contains:
 * - `value`: The actual cryptographic signature
 * - `deadline`: Unix timestamp when the authorization expires
 *
 * ```ts
 * const [setSpokeUserPositionManager, setting] = useSetSpokeUserPositionManager();
 * const [sendTransaction, sending] = useSendTransaction(wallet);
 *
 * const loading = setting.loading || sending.loading;
 * const error = setting.error || sending.error;
 *
 * const onSetPositionManager = async () => {
 *   const result = await setSpokeUserPositionManager({
 *     spoke: {
 *       address: evmAddress('0x87870bca…'),
 *       chainId: chainId(1),
 *     },
 *     manager: evmAddress('0x9abc…'), // Address that will become the position manager
 *     approve: true, // true to approve, false to remove the manager
 *     user: evmAddress('0xdef0…'), // User granting the permission (must sign the signature)
 *     signature: {
 *       value: '0x1234...', // ERC712 signature signed by the user
 *       deadline: 1735689600, // Unix timestamp when signature expires
 *     },
 *   }).then(sendTransaction);
 *
 *   if (result.isOk()) {
 *     // update local UI
 *   }
 * };
 * ```
 */
export function useSetSpokeUserPositionManager(): UseAsyncTask<
  SetSpokeUserPositionManagerRequest,
  TransactionRequest,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: SetSpokeUserPositionManagerRequest) =>
    setSpokeUserPositionManager(client, request),
  );
}

/**
 * Preview the impact of a potential action on a user's position.
 *
 * ```tsx
 * const [getPreview, previewing] = usePreview();
 *
 * const loading = previewing.loading;
 * const error = previewing.error;
 *
 * // …
 *
 * const result = await getPreview({
 *   action: {
 *     supply: {
 *       spoke: {
 *         address: evmAddress('0x87870bca…'),
 *         chainId: chainId(1),
 *       },
 *       reserve: reserveId(1),
 *       amount: {
 *         erc20: {
 *           currency: evmAddress('0x5678…'),
 *           value: '1000',
 *         },
 *       },
 *       supplier: evmAddress('0x9abc…'),
 *     },
 *   },
 * });
 *
 * if (result.isErr()) {
 *   console.error(result.error);
 *   return;
 * }
 *
 * console.log('Preview result:', result.value);
 * ```
 */
export function usePreview(): UseAsyncTask<
  PreviewRequest,
  PreviewUserPositionResult,
  UnexpectedError
> {
  const client = useAaveClient();

  return useAsyncTask((request: PreviewRequest) => preview(client, request));
}
