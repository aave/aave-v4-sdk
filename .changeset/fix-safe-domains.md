---
"@aave/client": patch
---

Fix Safe wallet detection failing due to allowedDomains regex not matching the full origin (https://app.safe.global). Also restore webpackIgnore comment for dynamic import and increase getInfo timeout from 200ms to 5s.
