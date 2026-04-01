# SMART Permission Tickets — Stakeholder Interview Report

A browsable collection of 22 AI-mediated stakeholder discovery interviews about [SMART Permission Tickets](https://build.fhir.org/ig/AshleyHMFanning/smart-app-launch/permission-tickets.html), distilled into analytical briefs for the [Argonaut Project](https://confluence.hl7.org/display/AP/Argonaut+Project+Home).

## What's Here

- **22 interview briefs** — each covering a different stakeholder's positions, concerns, and distinctive insights about portable authorization in healthcare
- **Cross-cutting digest** — common themes and rare/unique positions across all interviews
- **Multi-axis filtering** — browse by stakeholder type, stance, use cases discussed, spec topics, concerns raised, and frameworks referenced
- **Methodology** — how the interviews were conducted and how the briefs were produced

## Stakeholder Coverage

| Archetype | Count |
|-----------|-------|
| EHR Vendor | 6 |
| App Developer | 5 |
| Payer / Health Plan | 2 |
| Patient Representative | 2 |
| Provider Organization | 3 |
| Caregiver | 1 |
| Consent Management Vendor | 1 |
| Consultant | 2 |

## Building

```bash
cd report
bun install
bun run build    # outputs to dist/
```

For development with hot reload:

```bash
bun run dev      # http://localhost:3001
```

## How It Works

1. `src/build.ts` reads all `briefs/*.md` files, parses YAML frontmatter, and generates `src/data.ts`
2. `bun build index.html` bundles the React app with embedded brief data into `dist/`
3. The result is a fully static site — no server required

## Adding New Interviews

See [operator.md](operator.md) for instructions on how to run the abstraction process on new interview data.
