---
"@aave/react": patch
---

**fix:** `usePendingOrders` polls only while an order is open or awaiting signature, refreshes after an order is submitted or cancelled, and refreshes the user's positions when a filled order drops out of a status-filtered list
