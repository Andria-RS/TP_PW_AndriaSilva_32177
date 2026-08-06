# Plataforma de Partilha de Fotografias por Tema

Projeto individual desenvolvido no âmbito da unidade curricular de Programação Web do CTeSP de TPSI — IPVC.

A aplicação permite aos utilizadores publicar fotografias organizadas por álbuns temáticos, interagir através de likes e comentários e consultar uma galeria pública ou a sua área pessoal.

A comunicação entre o frontend e o backend é realizada através de uma API REST.

## Índice

- [Funcionalidades](#funcionalidades)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução](#execução)
- [API REST](#api-rest)
- [Testes da API](#testes-da-api)
- [Deploy](#deploy)
- [Segurança](#segurança)
- [Autoria](#autoria)

## Funcionalidades

### Autenticação

- Registo de utilizadores.
- Login de utilizadores.
- Autenticação através de JSON Web Tokens.
- Proteção das operações privadas da aplicação.

### Álbuns

- Criação de álbuns.
- Definição do nome, descrição e tema do álbum.
- Edição dos próprios álbuns.
- Eliminação dos próprios álbuns.
- Definição de álbuns públicos ou privados.
- Pesquisa de álbuns pelo nome ou tema.

### Fotografias

- Upload de fotografias.
- Associação das fotografias a álbuns.
- Definição do título e descrição da fotografia.
- Armazenamento das imagens através do Cloudinary.
- Visualização de fotografias numa galeria pública.
- Visualização das fotografias de um álbum.
- Área pessoal com os álbuns e fotografias do utilizador.

### Likes e comentários

- Adição de likes às fotografias.
- Remoção de likes.
- Impedimento de likes duplicados pelo mesmo utilizador.
- Criação de comentários.
- Edição dos próprios comentários.
- Eliminação dos próprios comentários.
- Visualização dos comentários associados às fotografias.

## Tecnologias utilizadas

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Token
- bcryptjs
- Multer
- Cloudinary
- CORS

### Frontend

- React
- Vite
- JavaScript
- CSS

### Ferramentas

- Git
- GitHub
- Postman
- Visual Studio Code

## Estrutura do projeto

```text
TP_PW_AndriaSilva_32177/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── pages/
│   │   └── services/
│   ├── .gitignore
│   ├── package.json
│   └── vite.config.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

A estrutura atual inclui modelos para utilizadores, álbuns, fotografias, likes e comentários, bem como rotas separadas para as principais funcionalidades da API. [1][2][3]

## Pré-requisitos

Antes de executar o projeto, é necessário ter instalado:

- Node.js 18 ou superior.
- npm.
- MongoDB local ou MongoDB Atlas.
- Uma conta Cloudinary para armazenar as fotografias.
- Git.

## Instalação

Clonar o repositório:

```bash
git clone https://github.com/Andria-RS/TP_PW_AndriaSilva_32177.git
```

Entrar na pasta do projeto:

```bash
cd TP_PW_AndriaSilva_32177
```

Instalar as dependências da raiz:

```bash
npm install
```

Instalar as dependências do backend:

```bash
cd backend
npm install
```

Instalar as dependências do frontend:

```bash
cd ../frontend
npm install
```

Voltar para a raiz do projeto:

```bash
cd ..
```

## Configuração

Criar um ficheiro `.env` com base no ficheiro `.env.example`.

O ficheiro `.env` deve conter as seguintes variáveis:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your_jwt_secret_key
PORT=5000
CLIENT_URL=http://localhost:5000

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Substituir os valores de exemplo pelos valores reais do ambiente local.

O ficheiro `.env` não deve ser enviado para o GitHub, uma vez que pode conter credenciais e chaves privadas.

## Execução

O projeto é executado através de dois processos: backend e frontend.

A partir da raiz do projeto, abrir dois terminais.

No primeiro terminal, iniciar o backend:

```bash
npm run dev:backend
```

No segundo terminal, iniciar o frontend:

```bash
npm run dev:frontend
```

Depois de iniciar o frontend, abrir no navegador o endereço apresentado pelo Vite.

O backend utiliza a porta definida na variável `PORT`.

## API REST

As principais áreas da API são:

| Rota | Descrição |
|---|---|
| `/routes/auth` | Registo e autenticação dos utilizadores |
| `/routes/albums` | Criação e gestão de álbuns |
| `/routes/photos` | Upload e gestão de fotografias |
| `/routes/likes` | Adição e remoção de likes |
| `/routes/comments` | Criação, edição e eliminação de comentários |

As rotas protegidas requerem um token JWT no cabeçalho da requisição:

```http
Authorization: Bearer <token>
```

O token é obtido através do login e deve ser enviado nas operações que exigem autenticação.

## Testes da API

A API pode ser testada através de uma coleção Postman.

A sequência recomendada para testar a aplicação é:

1. Criar uma conta através da rota de registo.
2. Fazer login e obter o token JWT.
3. Enviar o token nas requisições protegidas.
4. Criar um álbum.
5. Fazer upload de uma fotografia associada ao álbum.
6. Consultar os álbuns e fotografias.
7. Adicionar e remover um like.
8. Criar um comentário.
9. Editar o comentário criado.
10. Eliminar o comentário.

Nas requisições protegidas, utilizar o seguinte cabeçalho:

```http
Authorization: Bearer <token>
```

A coleção Postman deverá ser incluída no repositório para permitir a validação das funcionalidades da API.

## Deploy

O backend e o frontend podem ser publicados através de uma plataforma como Render, Railway ou outra plataforma equivalente.

### Backend

No serviço do backend, configurar as seguintes variáveis de ambiente:

```text
MONGO_URI
JWT_SECRET
CLIENT_URL
PORT
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

O comando de execução do backend deve ser o mesmo utilizado no projeto:

```bash
npm run dev:backend
```

### Frontend

No serviço do frontend, configurar o projeto como uma aplicação React desenvolvida com Vite.

O frontend deve conseguir comunicar com o endereço público do backend.

Depois do deploy, confirmar:

- O frontend abre corretamente.
- O backend responde sem erros.
- O frontend consegue comunicar com o backend.
- O login e o registo funcionam.
- O upload de fotografias funciona.
- A base de dados está acessível.
- Os likes e comentários funcionam.
- As credenciais não estão expostas publicamente.

## Segurança

- As palavras-passe não devem ser guardadas em texto simples.
- As palavras-passe devem ser protegidas através de hashing.
- As rotas privadas devem utilizar autenticação JWT.
- As credenciais devem ser configuradas através de variáveis de ambiente.
- O ficheiro `.env` não deve ser publicado no GitHub.
- As chaves do Cloudinary não devem ser partilhadas.
- Os tokens JWT não devem ser incluídos em commits ou screenshots.

## Histórico de desenvolvimento

O projeto foi desenvolvido de forma incremental, através de commits separados para funcionalidades e correções específicas, incluindo:

- Configuração inicial do projeto.
- Criação dos componentes.
- Implementação das páginas
- Implementação de upload de imagens.
- Implementação de likes e comentários.
- Criação, edição e eliminação de álbuns e fotos.
- Upload de imagens para o Cloudinary.
- Pesquisa e filtragem de álbuns.
- Correções visuais e funcionais.

## Autoria

Andria Silva

Projeto desenvolvido para a unidade curricular de Programação Web.

Repositório GitHub:

https://github.com/Andria-RS/TP_PW_AndriaSilva_32177