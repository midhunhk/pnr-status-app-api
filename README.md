# PNR Status Web API

A modernized, typed, high-performance Node.js API server for retrieving and parsing Indian Railways PNR status.

## 🚀 Modern Stack & Architecture
- **Runtime**: Node.js 22 LTS (ES Modules)
- **Language**: TypeScript 5.x
- **Framework**: Express 5.x with Zod request & response schema validation
- **Build System**: Vite (SSR / Node target bundle)
- **Dev Engine**: `tsx` (Instant ESM TypeScript runner)
- **Testing**: Vitest + Supertest
- **Security & Reliability**: Helmet, CORS, Express Rate Limiter, and async non-blocking file I/O

---

## 🛠️ Usage & Scripts

```bash
# Start development server with live reload
npm run dev

# Run full test suite with Vitest
npm test

# Type-check TypeScript codebase
npm run typecheck

# Build production bundle to dist/index.js
npm run build

# Start production server
npm start
```

---

## 📡 API Endpoints

- `GET /` - Root endpoint ("Hello Universe!")
- `GET /pnrstatus/:serviceId/:pnrNumber` - Get parsed PNR status using specified provider ID
- `GET /usage` - Returns usage information
- `GET /health` - Health check status (`{ "status": "UP" }`)
