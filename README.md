# cf-ts-bundler-worker

A fast, lightweight Cloudflare Worker that compiles TypeScript to JavaScript using esbuild with CDN imports support.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

## Features

- ⚡ Fast TypeScript compilation with esbuild-wasm
- 🌐 Automatic CDN imports resolution
- 📡 REST API with OpenAPI documentation
- 📁 File upload support
- 🌍 CORS enabled for browser usage

## Quick Start

```bash
git clone https://github.com/yourusername/cf-ts-bundler-worker.git
cd cf-ts-bundler-worker
npm install
npm run deploy
```

## API Reference

**Base URL:** `https://your-worker.your-subdomain.workers.dev`

**Interactive Documentation:**
- Swagger UI: `/_cfw/cf-ts-bundler-worker/docs`
- OpenAPI JSON: `/_cfw/cf-ts-bundler-worker/openapi.json`

## Usage Examples

### Basic Compilation (cURL)

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/_cfw/cf-ts-bundler-worker/compile \
  -H "Content-Type: application/json" \
  -d '{"code": "const message: string = \"Hello!\"; console.log(message);"}'
```

Response:
```json
{
  "success": true,
  "compiledCode": "var o=\"Hello!\";console.log(o);\n"
}
```

### JavaScript Client

```javascript
export const compileTypeScript = async (code) => {
  const response = await fetch('/_cfw/cf-ts-bundler-worker/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });

  const result = await response.json();
  return result.success ? result.compiledCode : Promise.reject(result.error);
};

// Example TypeScript code 
const tsCode = `
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

interface User {
  id: string;
  name: "John";
  age: number;
  email?: string;
}

const userSchema = z.object({
  name: z.literal("John"),
  age: z.number().min(18),
  email: z.string().email().optional(),
});

const app = new Hono();

app.get('/', (c) => c.json({ message: 'Hello World!' }));

app.post('/users', zValidator('json', userSchema), (c) => {
  const userData = c.req.valid('json');
  const user: User = {
    id: \`user-\${crypto.randomUUID().slice(0, 8)}\`,
    ...userData,
  };
  return c.json({ message: 'User created!', user }, 201);
});

export default app;
`;

// Compile from string
compileTypeScript(tsCode)
  .then(js => console.log('Compiled:', js))
  .catch(err => console.error('Error:', err));

// Or compile from file upload
export const compileFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/_cfw/cf-ts-bundler-worker/compile-file', {
    method: 'POST',
    body: formData
  });

  return response.ok ? response.text() : Promise.reject(await response.json());
};
```

## Development

```bash
# Local development
npm run dev

# Run tests
npm test

# Deploy
npm run deploy
```

## License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.