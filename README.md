## Nest Developer Test

Brief NestJS project exposing two endpoints:
- GET /email to extract JSON data referenced inside an .eml email
- POST /map to normalize AWS SES/SNS events into a compact JSON shape


## Repository layout

- `project/` – Main NestJS project (application code, tests and tooling)
- `public_data/` – Test fixtures for the email endpoint. This folder is kept outside the app because a simple HTTP server was used to serve the files for testing.
	- `email-attachment-json.eml` – Email with a .json attachment
	- `email-link-direct-json.eml` – Email whose plaintext body links directly to a .json URL
	- `email-link-via-page.eml` – Email that links to a web page which in turn links to a .json
	- `page-with-json.html` – Sample HTML page that contains a link to a .json
	- `ses-sns-event.json` – Sample AWS SNS→SES event payload
- `case 1.mp4` and `case 2.mp4` – Short demo videos for the two endpoints


## Requirements

- Node.js 18+ and npm
- macOS, Linux, or Windows


## Install and run

1) Install dependencies and start the API

```bash
cd project/
npm install
npm run start:dev
```

By default the API listens on `http://localhost:3000` (override with `PORT` env var).

2) (Optional) Serve the test fixtures over HTTP

While the email endpoint can read local file paths, it also supports URLs. To mimic “real world” emails that point to HTTP resources, you can serve `public_data/` with any static server, e.g.:

```bash
# Option A: Node http-server
cd public_data
npx http-server -p 8080 public_data

# Option B: Python 3 built-in server (if installed)
# python3 -m http.server 8080

```

Your files will be available at `http://localhost:8080/...`.


## Endpoints

### 1 GET /email

Extracts and returns the first valid JSON referenced by the email provided. The source is specified via the `path` query param and can be:
- An absolute path to a local `.eml` file
- An HTTP/HTTPS URL to an `.eml` file

The service parses the email and attempts, in order:
1. JSON attachment: `.json` attachment inside the email
2. Direct JSON link: a `*.json` URL found in the plaintext body
3. Indirect link: an HTTP link in the HTML body that leads to a page containing a `*.json` link

Examples:

```bash
# Using a local .eml file (absolute path)
curl "http://localhost:3000/email?path=/absolute/path/to/public_data/email-attachment-json.eml"

# Using an .eml served over HTTP
curl "http://localhost:3000/email?path=http://localhost:8080/email-link-via-page.eml"
```

If no JSON is found, the endpoint returns HTTP 400 with a short message.


### 2 POST /map

Accepts either:
- An AWS SNS→SES event (where `Records[0].Sns.Message` contains a JSON string with the SES message), or
- A raw SES receiving event

Returns a normalized JSON with the following fields:
- `spam` (boolean) – spam verdict passed
- `virus` (boolean) – virus verdict passed
- `dns` (boolean) – SPF, DKIM, and DMARC verdicts all passed
- `month` (string) – month name (english) derived from `mail.timestamp`
- `delayed` (boolean) – true if `receipt.processingTimeMillis > 1000`
- `sender` (string) – local part of `mail.source`
- `recipients` (string[]) – local parts of `mail.destination[]`

Example using the provided sample:

```bash
curl -X POST "http://localhost:3000/map" \
	-H "Content-Type: application/json" \
	--data-binary @public_data/ses-sns-event.json
```


## Project structure (app)

Inside `project`:

- `src/main.ts` – App bootstrap, sets global validation pipe
- `src/email/` – Email ingestion endpoint and logic
	- `email.controller.ts` – `GET /email?path=...`
	- `email.service.ts` – Loads `.eml` from file/URL, parses with `mailparser`, discovers JSON via attachment/body/linked page
- `src/ses/` – SES mapping endpoint and DTOs
	- `ses.controller.ts` – `POST /map`
	- `ses.services.ts` – Unwraps SNS→SES messages or accepts raw SES, delegates to mapper
	- `dto/` – `ses-event.ts` (input types) and `out.dto.ts` (normalized output)
- `src/map/` – Mapping helpers
	- `map.prof.ts` – `MapperService` (mapping utilities used by SES service)

Key dependencies:
- `mailparser`, `axios`, `jsdom` for email and HTML processing
- `class-validator`, `class-transformer` for validation and mapping
- NestJS 11


## Notes

- The `public_data` folder is intentionally outside the app because it was served by a simple HTTP server for tests and demos.
- Demo videos `case 1.mp4` and `case 2.mp4` show example runs of both endpoints.
- Linting, tests, and build scripts are available in `project/package.json`.


## Scripts (from `project`)

- `npm run start:dev` – Start in watch mode
- `npm run build` – Build to `dist/`
- `npm test` / `npm run test:e2e` – Unit/E2E tests
- `npm run lint` – ESLint with fixes


