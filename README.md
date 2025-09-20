# cf-ts-bundler-worker

A fast, lightweight Cloudflare Worker that runs esbuild on the edge to compile TypeScript to JavaScript with CDN imports support.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

## Features

- ⚡ Dynamic TypeScript compilation with esbuild-wasm running on the edge
- 🌐 Automatic CDN imports resolution
- 📡 REST API with OpenAPI documentation
- 📁 File upload support
- ☁️ Low-latency compilation powered by Cloudflare's global network

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

### File Upload Compilation (cURL)

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/_cfw/cf-ts-bundler-worker/compile-file \
  -F "file=@example.ts"
```

Response: Returns the compiled JavaScript file for download.

### Example TypeScript File (example.ts)

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const userSchema = z.object({
  name: z.literal("John"),
  age: z.number().min(18),
  email: z.email().optional(),
});

type User = z.infer<typeof userSchema> & {
  id: string;
};

const app = new Hono();

app.get('/', (c) => c.json({ message: 'Hello World!' }));

app.post('/users', zValidator('json', userSchema), (c) => {
  const userData = c.req.valid('json');
  
  const user: User = {
    id: `user-${crypto.randomUUID().slice(0, 8)}`,
    ...userData,
  };
  
  return c.json({ message: 'User created!', user }, 201);
});

export default app;
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

## TODO / Roadmap

- [ ] 📦 Multiple files support - Bundle entire TypeScript projects with multiple files and dependencies
- [ ] 📊 Compilation performance metrics and caching
- [ ] 🔧 Custom esbuild configuration options

## License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.