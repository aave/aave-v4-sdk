# Aave V4 SDK

The client and React SDK that turns Aave protocol actions into wallet interactions.

## Language

### Plans and steps

**Execution Plan**:
What an action returns: either a single transaction, or a transaction preceded by the steps it depends on (approvals or a pre-contract action).
_Avoid_: Plan result, action result

**Step**:
One wallet interaction within an Execution Plan: an approval, a pre-contract action, or the original transaction.
_Avoid_: Stage, sub-transaction

**Original Transaction**:
The step that performs the user's intended action; every other step in the plan exists to enable it.
_Avoid_: Main transaction, final transaction

### Sending

**Batch**:
Several steps submitted to the wallet as one all-or-nothing unit. A batch is always atomic in this SDK.
_Avoid_: Bundle, multicall, atomic batch

**Calls ID**:
The identifier a wallet returns for calls submitted via EIP-5792; for a Safe it is the safeTxHash. It is not a transaction hash.
_Avoid_: Batch hash, tx hash

**Contract Account**:
An account whose address holds contract code other than an EIP-7702 delegation (e.g. a Safe).
_Avoid_: Smart wallet, smart account, multisig

**EOA**:
An account controlled by a single key, including one that has delegated its code via EIP-7702.
_Avoid_: Wallet, externally owned wallet
