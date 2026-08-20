> [!NOTE]
> **Current local setup for FYF AI Content Studio**
> This repository is a local-first studio. The setup below does not authorize public deployment.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Use Node.js 22 or newer because the local SQLite adapter uses `node:sqlite`. Copy `.env.example` to `.env.local` only when you want local overrides. Keep all real keys, SQLite files, and generated output out of source control. Read the root `README.md` for the current Studio → Video Pipeline boundary.
