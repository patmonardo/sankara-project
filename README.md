# Dashboard V2

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.3-black.svg)](https://nextjs.org/)
[![tRPC](https://img.shields.io/badge/tRPC-next-blue.svg)](https://trpc.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5.12.1-green.svg)](https://www.prisma.io/)

A modern, type-safe dashboard application demonstrating best practices in full-stack development.

## 🚀 Features

- **Type-safe API** with tRPC
- **Modern Data Layer** with Prisma
- **Real-time Updates** with React Query
- **Clean Architecture** ready for scale
- **Performance Optimized** with Next.js

## 🛠️ Tech Stack

- Next.js 15.1.3
- TypeScript 5.7.2
- tRPC
- Prisma with PostgreSQL
- React Query
- Zod for validation

## 🏗️ Development Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm migrate-dev

# Start development server
pnpm dev
```

## 📚 Project Structure

```
dashboard-v2/
├── src/
│   ├── lib/        # Core business logic
│   ├── server/     # tRPC routes & API
│   ├── components/ # React components
│   └── utils/      # Shared utilities
├── prisma/
│   └── schema.prisma
└── tests/
```

## 📄 License

MIT © 2025
