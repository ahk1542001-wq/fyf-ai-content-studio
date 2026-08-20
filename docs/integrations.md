> [!WARNING]
> **LEGACY PROTOTYPE DOCUMENTATION**
> This document describes the earlier mock prototype and is preserved only as migration evidence. It is not the current FYF AI V1 architecture.

V1 integrations are mock-first. They demonstrate the product workflow and adapter boundaries without using live secrets or external side effects.

The Integration Health/API settings feature keeps this posture while making the local Studio settings complete. The settings UI and API expose editable provider metadata, masked credential status, and provider-specific readiness checklists for each workspace. It must not make live calls to Gemini, Google Sheets, Facebook Pages, or Telegram.

## Integration Health Settings Contract

Each provider card should support three kinds of information:

- Safe editable metadata, such as model names, demo-mode toggles, sheet ranges, Page IDs, permission lists, and readiness labels.
- Write-only credential replacement inputs, such as API keys, page access tokens, OAuth placeholders, and signing secrets.
- Read-only masked credential display, such as `AIza••••xy`, `EAAG••••92`, or `not configured`.

The app may store and return masked demo values for local demo continuity. It must not return raw secret values from API responses, render raw values in the local UI after save, or write raw values to audit events, console logs, API logs, or test snapshots.

Recommended provider metadata fields:

| Provider | Safe metadata | Secret-like values |
| --- | --- | --- |
| Gemini | Model, generation mode, demo mode, prompt profile/version, Burmese output requirement | API key |
| Google Sheets | Sheet URL or ID, worksheet/range, style-memory row count, demo fetch status | OAuth token or service account credential placeholder |
| Facebook Pages | Page ID, page name, permission checklist, mock publish gate status | Page access token |

Connection tests must be readiness checklists. They can validate required fields are present, confirm demo data exists, and explain what would be needed for production. They must not contact provider endpoints.

## Gemini

V1 uses `integrations/mockGemini.ts` to generate realistic Burmese drafts. Prompt construction includes FYF AI brand rules, forbidden phrases, and few-shot examples from mock Sheets data.

The Integrations page may show Gemini API key status, model selector, demo mode, test connection, and status controls, but V1 does not call the live Gemini API. A real Gemini adapter is a V1.5 task behind the same boundary.

Readiness checklist:

- Model is selected, for example a Gemini model intended for Burmese content quality.
- Demo mode is active and clearly labeled.
- API key status is masked or `not configured`.
- Prompt profile still includes Burmese-only output and FYF AI tone-memory rules.

## Google Sheets

V1 uses `integrations/mockSheets.ts` to fetch FYF AI-style example posts from typed demo data. These examples simulate few-shot voice memory and must continue feeding the Burmese draft prompt.

The Sheets card can collect a sheet URL/ID, range, credential status, and a demo fetch action. V1 does not read a real Google Sheet.

Readiness checklist:

- Sheet URL or ID is present in metadata.
- Range is present and human-readable.
- Mock style examples are available for the selected workspace.
- Credential status is masked and no raw OAuth/service-account material is exposed.

## Facebook Pages

V1 uses `integrations/mockFacebook.ts`. It never posts externally. Mock publish is blocked until the draft is approved and Risk Guard passes, then returns a fake Facebook post ID.

The Facebook Page card can show Page ID, masked token, required permissions, mock test connection, and mock publish status. Real Facebook text/media publishing is outside V1.

Readiness checklist:

- Page ID is present.
- Required permissions are visible as metadata, such as page content publish/manage permissions.
- Page token status is masked.
- Mock publish gate states are clear: approved draft required, Risk Guard pass required, and no live Facebook request is sent.

## Secrets and Settings

- Integration settings are workspace-scoped.
- Saved values shown in the UI must be masked.
- Raw credentials must not be sent back to the frontend after saving.
- Demo connection tests must not call live provider endpoints.
- Provider settings must be tenant-scoped; switching workspaces must not show another workspace's metadata, masked credential status, or audit events.
- Audit events should say which provider changed or was tested, but must not include raw values, query-string secrets, or copied credential snippets.
- Production adapters require encrypted credential storage before they can be enabled.

## Real Adapter Stubs

Current real-adapter work is limited to preserving boundaries and settings shapes. The app should be ready to add real Gemini, Google Sheets, and Facebook Pages adapters later, but the local Studio keeps all provider behavior mocked.
