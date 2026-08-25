# Burmese Insurance OCR UI

This is the primary production frontend for the Burmese OCR / Insurance Claim OCR stack. It is a React 19, TypeScript, Tailwind, and Vite application. Browser code talks only to the umbrella FastAPI orchestrator; it never calls layout, OCR, document-processing, or VLM services directly.

## Workflows

Template registration is presented as:

```text
Upload blank form → Analyze template → Review fields → Save template
```

`Analyze template` starts `POST /api/v1/template-registrations` and polls the returned registration. The review screen edits the complete authoritative draft. `Save template` saves the optimistic draft revision, validates it, and approves it when valid.

Completed document processing is presented as:

```text
Select template → Upload completed form → Process → Review/correct → Approve → Sync/export
```

Long-running operations show orchestrator progress with user-facing stage names. Raw service details are available only in expandable developer details.

## Local development

Start the orchestrator at `http://localhost:8000`, then:

```bash
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. Set `VITE_API_BASE_URL` in `.env` when the API is not same-origin.

For the complete stack, run from the repository root:

```bash
docker compose up --build --detach --wait
```

Open `http://localhost:3000`. Nginx serves this build and proxies `/api` to the orchestrator.

## Verification

```bash
npm run lint
npm run build
```

The umbrella API and adapter suite is run from the repository root with `python -m pytest tests -q`. `compose.mock.yaml` plus the smoke scripts exercises the complete workflow without downloading production models.

## API organization

- `src/api/client.ts`: base URL, request/error handling, and correlation diagnostics.
- `src/api/adapters.ts`: backend-to-UI domain transformations.
- `src/api/index.ts`: application actions such as `analyzeTemplate`, `processDocument`, `saveTemplateDraft`, and `saveDocumentCorrections`.

No generated sample data or silent production mock path remains in the application.
