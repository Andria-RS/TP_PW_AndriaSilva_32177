# SnapTheme

Plataforma de partilha de fotografias organizada por álbuns temáticos, desenvolvida no âmbito da unidade curricular de Programação Web.

## Tecnologias

- Backend: Node.js, Express e JWT
- Frontend: React com Vite
- Base de dados: MongoDB
- Imagens: Cloudinary
- Controlo de versões: Git e GitHub

## Estrutura

- `backend/` — API REST, autenticação, modelos e rotas
- `frontend/` — aplicação React

## Pré-requisitos

- Node.js 18 ou superior
- npm
- MongoDB ou MongoDB Atlas
- Conta Cloudinary para upload de imagens

## Instalação

Na raiz do projeto:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

Criar os ficheiros `.env` a partir dos exemplos e preencher os valores locais. Nunca publicar credenciais reais no GitHub.

## Executar o projeto

Na raiz do projeto, executar:

```bash
npm run dev:backend
```

Noutro terminal, também na raiz do projeto, executar:

```bash
npm run dev:frontend
```

O frontend comunica com o backend através da API REST.

## Funcionalidades

- Registo e autenticação de utilizadores com JWT
- Criação, edição e eliminação de álbuns
- Upload de fotografias para o Cloudinary
- Associação de fotografias a álbuns
- Galeria pública e área pessoal
- Pesquisa e filtragem de álbuns
- Likes sem duplicação por utilizador
- Criação, edição e eliminação dos próprios comentários
- Álbuns e fotografias públicos ou privados

## API REST

As principais áreas da API são:

- `/api/auth` — registo e autenticação
- `/api/albums` — operações sobre álbuns
- `/api/photos` — operações sobre fotografias
- `/api/likes` — likes de fotografias
- `/api/comments` — comentários de fotografias

As rotas protegidas requerem o cabeçalho:

```text
Authorization: Bearer <token>
```

## Variáveis de ambiente

Consultar o ficheiro `.env.example` para a lista das variáveis necessárias. Os valores reais devem existir apenas no ambiente local ou na plataforma de deploy.

## Deploy

O backend e o frontend devem ser configurados como serviços separados numa plataforma compatível, como Render ou Railway. Depois do deploy, configurar as mesmas variáveis de ambiente usadas localmente e definir no frontend o endereço público da API.

## Autoria

Andria Silva — TP_PW_AndriaSilva_32177