# Getting Started

SynBioHub3 runs as two separate processes:

- **`frontend/`** — a Next.js app served on port **3333**
- **`backend/`** — a Java (Spring Boot) app served on port **6789**

The backend also needs a **Virtuoso** triplestore (a SPARQL endpoint) to be useful.

For full, component-specific instructions see [`frontend/README.md`](./frontend/README.md)
and [`backend/README.md`](./backend/README.md).

## Quick start (one command)

From the repository root you can start Virtuoso, the backend, and the frontend
together:

```bash
npm install        # one time — installs the root dev tooling (concurrently)
npm run dev        # or: yarn dev
```

Requirements: **Docker** (for Virtuoso), **Java 17**, **Node 17+**, and **Yarn**.

`npm run dev` will:

1. Start a Virtuoso triplestore in Docker — creating the `virtuoso` container the
   first time and reusing it afterwards (see `db:up` / `db:down` below).
2. Run the backend (`./mvnw spring-boot:run`) on **http://localhost:6789**.
3. Run the frontend (`yarn devNextGen`, the OpenSSL-legacy mode required by Node
   17+) on **http://localhost:3333**.

Output from both services is shown together, prefixed with `backend`/`frontend`.
Press `Ctrl+C` to stop the backend and frontend. The Virtuoso container is left
running so the next start is fast; stop it explicitly with:

```bash
npm run db:down    # docker stop virtuoso
```

> The root `dev` script runs the frontend via `yarn devNextGen`, which requires
> Node 17+. On Node 14–16 (matching the Docker image) that flag is rejected — run
> the services separately as described below and use `yarn dev` in `frontend/`.

To run each piece by hand (or on Node 14–16), follow the component sections below.
Start the backend first.

## Backend (port 6789)

Requirements: **Java 17** (the project targets 17 — newer JDKs are not guaranteed to
work with Spring Boot 3.0.1) and **Docker** (for Virtuoso).

1. Start a Virtuoso triplestore on port 8890:

   ```bash
   docker run --name virtuoso -d \
     -p 8890:8890 -p 1111:1111 \
     -e DBA_PASSWORD=dba -e SPARQL_UPDATE=true \
     tenforce/virtuoso:virtuoso7.2.5
   ```

2. Point the backend at that Virtuoso. The bundled
   `backend/src/main/resources/config.json` defaults to the `virtuoso3` Docker host
   (used when the backend itself runs as a container). Running on the host, reach the
   container above at `localhost` by exporting two environment variables — they take
   precedence over `config.json` without editing it:

   ```bash
   export SBH_SPARQL_ENDPOINT="http://localhost:8890/sparql"
   export SBH_GRAPH_STORE_ENDPOINT="http://localhost:8890/sparql-graph-crud-auth/"
   ```

   (`npm run dev` already sets these for you — see above. To point at a Virtuoso
   running elsewhere, change the host in the variables, or create
   `backend/data/config.local.json`, which is gitignored and overrides `config.json`
   per-key but is itself overridden by the environment variables above.)

3. Run the backend from the `backend/` directory (config is read relative to the
   working directory). This uses the bundled Maven wrapper and the embedded H2
   database — no external database required:

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

   The backend is now serving on http://localhost:6789.

## Frontend (port 3333)

Requirements: **Node 14–16** and **Yarn**. (The Docker image uses Node 14; newer
Node versions need the OpenSSL workaround in step 3.)

1. Install dependencies:

   ```bash
   cd frontend
   yarn install
   ```

2. Tell the frontend where the backend is. It reads the backend URL from the
   `backend` environment variable, loaded in dev from `frontend/.env.development`,
   which ships pointing at this repo's backend (`http://localhost:6789`). Edit that
   file if your backend runs elsewhere. (`next.config.js` exposes it via
   `publicRuntimeConfig` — there is no `backendUrl` variable to edit.)

3. Start the dev server:

   ```bash
   yarn dev
   ```

   On Node 17+ this fails with an OpenSSL error (`ERR_OSSL_EVP_UNSUPPORTED`) because
   Next.js 10 / webpack 4 use a legacy algorithm. Use the legacy-OpenSSL script
   instead:

   ```bash
   yarn devNextGen
   ```

   Open [http://localhost:3333](http://localhost:3333) in your browser.

## Run everything with Docker (prebuilt images)

`tests/docker-compose.yml` starts Virtuoso, the backend, and the frontend from
published images (not your local code) — handy for a quick instance, not for
development:

```bash
cd tests && docker compose up
```

## Developer Notes

Each component/page in SynBioHub should have a header which dictates its purpose.

The frontend uses Redux for global application state and to simplify passing deeply
nested props; see the `frontend/redux` directory.

The frontend uses ESLint configured for React/Next.js. From the `frontend` directory:

```bash
npm run lint        # check for problems
npm run lint.fix    # auto-fix styling errors (recommended before pushing)
```

### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
