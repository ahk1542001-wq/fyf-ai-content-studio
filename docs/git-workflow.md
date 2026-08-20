> [!WARNING]
> **LEGACY PROTOTYPE DOCUMENTATION**
> This document describes the earlier mock prototype and is preserved only as migration evidence. It is not the current FYF AI V1 architecture.

Git is local for V1. A private GitHub repo can be added later.

Recommended loop:

```bash
git status --short
npm run typecheck
npm run test
npm run build
git add .
git commit -m "Describe completed loop"
```

Do not commit secrets, local databases, `node_modules`, `.next`, or test artifacts.
