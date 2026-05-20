---
"@aave/graphql": major
"@aave/client": major
---

Realign with backend after the PreviewReward types were restored. The backend now exposes both the legacy `PreviewReward` union (`PreviewMerkl{Supply,Borrow}Reward` + `Preview{Supply,Borrow}PointsReward`) via deprecated `PreviewRewardOutcome.lost` / `.gained`, and the new wrapper as `ReserveReward` via `PreviewRewardOutcome.abandoned` / `.acquired`. Rename `PreviewRewardChange` to `ReserveReward` and switch the `PreviewRewardOutcome` fragment to query `abandoned` / `acquired` (breaking for the previous 2.0.0 shape).
