# TP_PW Monorepo

Este repositório foi reorganizado em um monorepo com duas pastas principais:

- `frontend/` - aplicação React + Vite
- `backend/` - API Node.js + Express + JWT

## Instalação

No diretório raiz:

```bash
npm install
```

## Scripts principais

```bash
npm run dev:frontend
npm run dev:backend
npm run start:backend
```

## Tecnologias

- Backend: Node.js, Express, JWT, MongoDB
- Frontend: React, Vite
- Controle de versão: Git / GitHub

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
