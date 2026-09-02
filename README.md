# Aplikuha

Minimal dependency-free scaffold for local development.

## Requirements

- Node.js 18 or newer

## Run locally

```sh
npm start
```

The static server starts at [http://localhost:3000](http://localhost:3000). Set `PORT` to use another port:

```sh
PORT=3001 npm start
```

## Verify

```sh
npm run check
npm test
```

`npm run check` validates the scaffold. `npm test` uses Node's built-in test
discovery and runs every test file in `test/`. No package installation is
required.

The server serves `index.html` for `/` when that file is present, with a
`text/html; charset=utf-8` content type. Requests that escape the project root
are rejected.
