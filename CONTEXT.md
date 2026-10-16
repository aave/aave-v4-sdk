# Aave v4 SDK

TypeScript and React SDK for reading Aave v4 protocol data and sending protocol transactions from a user's wallet.

## Language

### Sending transactions

**Smart Account**:
An account whose address holds contract code, or will once deployed (counterfactual). An EOA with an EIP-7702 delegation is not a Smart Account.
_Avoid_: SC wallet, smart contract wallet, contract wallet

**Submission**:
What a wallet accepts when the user signs a transaction request. It may not be on-chain yet.
_Avoid_: transaction, tx

**Submission ID**:
The identifier a wallet returns for a Submission: an on-chain tx hash for an EOA, otherwise a wallet-specific id such as a `safeTxHash`, `userOpHash` or EIP-5792 call id.
_Avoid_: hash, tx hash

**Execution**:
The on-chain transaction that carries a Submission, identified by a real tx hash.
_Avoid_: resolved hash

**Awaiting Signatures**:
The state of a Submission that cannot execute until more co-signers of a Smart Account sign it.
_Avoid_: pending (too broad)

**Batch-capable Account**:
An account whose wallet reports EIP-5792 `atomic` status `supported` for a chain, so it can execute several calls atomically without further user action. It can be a Smart Account or an EOA already upgraded with EIP-7702; an EOA that reports `ready` would need the upgrade first and is not batch-capable.
_Avoid_: 7702 wallet, smart wallet

**Transaction Batch**:
The transactions of one execution plan (e.g. approvals, then the action) sent as a single atomic `wallet_sendCalls` request. It produces one Submission, tracked by its EIP-5792 call id.
_Avoid_: bundle (ERC-4337 term), multicall
