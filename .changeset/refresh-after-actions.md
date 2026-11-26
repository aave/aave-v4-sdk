---
"@aave/react": patch
---

**fix:** a settled order, a collateral toggle, a conditions update, a claim and an order cancel now refresh everything the position shows (`useUserPosition`, `useUserPositions`, `useUserSummary`, `useUserSummaryHistory`, `useUserRiskPremiumBreakdown`, `useActivities`, the user's reserves and hubs, the wallet), and a position that did not exist before the action appears in `useUserPositions`
