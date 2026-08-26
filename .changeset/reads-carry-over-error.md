---
"@aave/react": patch
---

**fix:** read hooks keep presenting the previous error while a re-execution after a rejected request is in flight, instead of handing a `null` result to selectors
