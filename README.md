# Table Sense

Table Sense is an interactive learning lab for tabular foundation models. It is organized as a seven-slide deck: the table prompt, synthetic priors, attention mechanics, architecture lineage, predictive distributions, benchmark methodology, and a paper-backed comparison table. The examples use claims frequency and severity so the context-query contract is concrete for actuarial readers without presenting a production pricing model.

## Run locally

```bash
npm install
npm run dev
```

Other checks:

```bash
npm run typecheck
npm run test
npm run build
```

## Deploy

The site is deployed to [GitHub Pages](https://alberto826.github.io/TabFM/) from the `main` branch by `.github/workflows/deploy-pages.yml`.

The source-paper cards link to public arXiv or publisher records. The local PDF copies remain available in the workspace for development but are excluded from the public repository.

## Scope boundary

The interface intentionally uses deterministic browser simulations. This workspace contains the six source papers but does not contain model weights, a Python inference service, credentials, or a deployment target. The simulations explain the mechanisms and trade-offs; they do not reproduce a released TabPFN or TabICL checkpoint.

Use the top slide tabs, previous/next controls, or `ArrowLeft`, `ArrowRight`, `Home`, and `End` to navigate. Only the active slide is rendered, while taller slides use the deck's internal scroll area so the lesson does not become one long page.

Benchmark figures in `src/content/benchmarks.ts` are labeled paper-report snapshots. They distinguish TabArena, TALENT, and OpenML-style evaluation regimes, and keep default, tuned, ensemble, Thinking/API, and real-data fine-tuned variants separate. The linked Hugging Face TabArena board is the live reference; the app does not pretend its dynamically rendered contents are embedded locally.

Model architecture facts and validated/recommended input envelopes are kept in `src/content/modelMatrix.ts`. Technical reports, API-only features, tuned results, ensemble results, and real-data fine-tuned results should remain visibly labeled when the evidence is updated.

The local PDFs remain in `papers/` for local reading and are not part of the public deployment. The paper shelf links to the corresponding DOI or arXiv record so the published site does not redistribute those files.

## Content maintenance

When a source paper changes, add a new version/date and preserve the context of the old claim rather than silently replacing it. Keep pure calculations in `src/lib/simulations.ts`; keep paper facts and caveats in the content files so the educational controls remain independent from the evidence layer.
