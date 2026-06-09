# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

**Innløse eller beholde** is a client-side Norwegian financial advisory calculator (static HTML/CSS/JS). There is no backend, database, build step, or package manager. All state lives in browser memory (`AppState` in `script.js`).

### Running the app

Start a static HTTP server from the repo root:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in a browser.

`npx serve .` also works if you prefer Node, but Python is sufficient and has no install step.

### Lint / test / build

There are no configured lint, test, or build commands in this repository. Verification is manual or browser-based: serve the files and exercise navigation, sliders, and calculation tabs (Input, Nedbetale lån, Utbetale utbytte, Innløse Fondskonto).

### Optional external dependency

`styles.css` loads the Inter font from Google Fonts. The app falls back to system fonts if the CDN is unavailable; no local action is required.

### Development notes

- Edits to `script.js`, `styles.css`, or `index.html` are picked up on browser refresh; no hot reload.
- The Clipboard API (Output modal) requires a secure context (`localhost` or HTTPS).
- Use tmux for long-running dev servers so sessions persist across agent turns.
