# Sankara Project V1

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.3-black.svg)](https://nextjs.org/)
[![tRPC](https://img.shields.io/badge/tRPC-next-blue.svg)](https://trpc.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5.12.1-green.svg)](https://www.prisma.io/)
[![Zod](https://img.shields.io/badge/Zod-3.24.2-purple.svg)](https://zod.dev/)

A knowledge exploration platform for Sanskrit philosophical texts and concepts. The project demonstrates a semantic design system integrating philosophical principles with modern web technologies.

## 🚀 Features

- **Knowledge Representation System** for Sanskrit philosophical concepts
- **Semantic Design Architecture** using schema-driven design
- **Type-safe Design Language** with Zod validation
- **OOP Component Framework** built on functional design tokens
- **Interactive Visualizations** for exploring philosophical relationships
- **Sanskrit Text Integration** with proper typography and transliteration

## 🏑 Architecture

- **Functional Theme System**: Schema-driven design tokens with philosophical grounding
- **OOP Component Layer**: Object-oriented UI components with clean inheritance
- **MVFC Pattern**: Model-View-Form-Controller architecture for UI components
- **Knowledge Graph**: Semantic representation of philosophical concepts and relationships

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.1.3, TypeScript 5.7.2, React
- **Data Fetching**: tRPC, React Query
- **Data Layer**: Prisma with PostgreSQL
- **Validation**: Zod for both data and design schemas
- **Styling**: Tailwind CSS with semantic token system
- **Visualization**: D3.js for knowledge graphs and concept relationships

## 🧠 Design Philosophy

The Sankara Project implements a unique design approach that:

- Uses singular naming for conceptual clarity (e.g., `color` not `colors`)
- Treats design tokens as "things-in-themselves" (ontological approach)
- Creates a Hegelian design language with thesis-antithesis-synthesis pattern
- Implements design schemas as formal grammars for visual expression
- Bridges functional and object-oriented paradigms appropriately

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
