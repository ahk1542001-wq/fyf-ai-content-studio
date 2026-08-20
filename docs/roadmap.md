# FYF AI Content Studio Roadmap

**Status:** Local-first Studio execution
**Last updated:** August 20, 2026

## Current baseline

- Create and review Burmese content using FYF brand guidance.
- Apply deterministic quality, risk, workspace-isolation, and revision checks.
- Require human approval before manual export.
- Produce a typed `fyf.video-content.v1` handoff for the separate FYF Video Pipeline.
- Keep local SQLite state and generated media on the operator machine.

## Next implementation steps

1. **Canonical Studio naming**
   - Keep the user-facing product name `FYF AI Content Studio`.
   - Preserve legacy storage/config identifiers until a compatibility migration is separately tested.
2. **Studio → Video Pipeline handoff**
   - The `fyf.video-content.v1` contract endpoint is implemented and validates approved script, voice mode, and brand rules before export.
   - Automated cross-repository execution remains deferred; voice, visual, motion, lip-sync, and MP4 rendering stay in the separate video repository.
3. **Local reliability**
   - Continue cache, reset, collision, analytics, brand-profile, and full-decode tests.
   - Add resumable export checkpoints without copying local data between repositories.
4. **Public release gate**
   - Review committed history for local databases and FYF-owned content.
   - Sanitize or create an approved public mirror only after explicit maintainer approval.
   - Keep this working repository private until that gate passes.

## Explicitly deferred

- Hosted authentication, durable cloud storage, billing, subscriptions, and multi-tenant SaaS.
- Automated Facebook publishing or external workflow execution.
- External client workflows and automation adapters in the FYF runtime.
- Any major dependency upgrade (including a Next major) without a separate test and approval task.
