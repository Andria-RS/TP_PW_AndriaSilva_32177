# TP_PW - Plataforma de partilha de fotografias

Este projeto implementa a opção 26 do enunciado: uma aplicação web para partilha de fotografias com autenticação, álbuns, visibilidade pública/privada, comentários e likes.

## Funcionalidades incluídas

- Registo e login de utilizadores
- Criação de álbuns
- Upload de fotos
- Definição de visibilidade pública/privada
- Galeria pública com filtros por tema e álbum
- Comentários em fotos
- Likes em fotos

## Estrutura do projeto

- frontend/ - interface React + Vite
- backend/ - API Node.js + Express + MongoDB + JWT

## Como correr

Na raiz do projeto:

```bash
npm install
npm run dev:backend
```

Em outra consola:

```bash
npm run dev:frontend
```

## Variáveis de ambiente

O backend espera um ficheiro de ambiente com:

- MONGO_URI
- JWT_SECRET
- PORT (opcional)
- CLIENT_URL (opcional)

## Objetivo de avaliação

Este projeto está alinhado com o enunciado naquilo que foi pedido para esta opção: autenticação, gestão de álbuns, gestão de fotos, visibilidade pública/privada, comentários e likes.
