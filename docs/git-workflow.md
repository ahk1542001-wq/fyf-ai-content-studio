> [!WARNING]
> **LEGACY PROTOTYPE DOCUMENTATION**
> This document describes the earlier mock prototype and is preserved only as migration evidence. It is not the current FYF AI V1 architecture.

The public repository is the reviewed distribution snapshot. The private working repository and its history remain separate; do not merge private history into this repository.

Recommended loop:

```bash
git status --short
npm run typecheck
npm run test
npm run build
git add <reviewed-paths-only>
git commit -m "Describe completed loop"
```

Do not commit secrets, local databases, `node_modules`, `.next`, or test artifacts.
