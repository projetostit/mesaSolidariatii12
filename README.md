# Mesa Solidária API

API REST do projeto Mesa Solidária. Ela centraliza cadastro de usuários, autenticação com JWT, perfis de acesso e controle de sessões, sendo consumida pelo repositório do front-end.

## Tecnologias

- Node.js e TypeScript
- NestJS 11
- MySQL 8
- JWT para autenticação
- bcrypt para hash de senhas
- class-validator para validação das requisições
- Swagger para documentação interativa
- Jest para testes

## Estrutura principal

```text
src/
├── auth/             autenticação, JWT, guard e sessões
├── database/         conexão e consultas ao MySQL
├── usuarios/         cadastro de usuários e associação de perfis
├── test/             mocks utilizados nos testes
├── app.module.ts     módulos globais da aplicação
└── main.ts           CORS, Swagger, validação e inicialização
database.sql          script de criação do banco e perfis iniciais
GUIA-INICIAL.md       guia de instalação e execução local
```

## Pré-requisitos

- Node.js LTS
- MySQL Server 8 ou compatível
- npm

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/vssantos-dev/mesa-solidaria-api.git
cd mesa-solidaria-api
npm install
```

## Banco de dados

O script 'database.sql' cria o banco 'mesa_solidaria', as tabelas necessárias e os perfis iniciais.

Execute o arquivo no MySQL Workbench ou pelo cliente MySQL:

```bash
mysql -u root -p < database.sql
```

Os perfis cadastrados pelo script são:

- BENEFICIARIO
- DOADOR
- VOLUNTARIO
- PONTO_COLETA
- ADMINISTRADOR

## Variáveis de ambiente

Crie um arquivo chamado '.env' na raiz do projeto. Esse arquivo não deve ser versionado.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_do_mysql
DB_NAME=mesa_solidaria

JWT_SECRET=uma_chave_longa_aleatoria_e_secreta
JWT_EXPIRES_IN=1d
```

Para gerar uma 'JWT_SECRET' localmente no PowerShell:

```powershell
[Convert]::ToBase64String([byte[]](1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Executar a aplicação

Modo de desenvolvimento, com reinicialização automática:

```bash
npm run start:dev
```

A API será iniciada em 'http://localhost:3000'.

Documentação Swagger: 'http://localhost:3000/api'.

O CORS está configurado para o front-end em 'http://localhost:5500' e 'http://127.0.0.1:5500'.

## Endpoints disponíveis

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| POST | /usuarios | Não | Cria usuário e vincula o perfil escolhido. |
| POST | /auth/login | Não | Autentica por e-mail ou CPF e retorna token JWT. |
| GET | /auth/me | Bearer token | Retorna os dados do usuário e seus perfis ativos. |
| POST | /auth/logout | Bearer token | Encerra a sessão ativa. |

### Cadastro de usuário

Requisição para 'POST /usuarios':

```json
{
  "nome": "Maria Silva",
  "cpf": "12345678901",
  "email": "maria@email.com",
  "senha": "senha-com-ao-menos-8-caracteres",
  "perfil": "BENEFICIARIO"
}
```

O campo 'cpf' é opcional. Os valores permitidos para 'perfil' são 'BENEFICIARIO', 'DOADOR', 'VOLUNTARIO' e 'PONTO_COLETA'.

### Login

Requisição para 'POST /auth/login':

```json
{
  "login": "maria@email.com",
  "senha": "senha-com-ao-menos-8-caracteres"
}
```

O campo 'login' aceita e-mail ou CPF. A resposta contém 'access_token', informações do usuário, perfil ativo e perfis associados.

### Rotas protegidas

Envie o token recebido no login no cabeçalho HTTP:

```text
Authorization: Bearer SEU_ACCESS_TOKEN
```

O 'AuthGuard' valida o JWT e também confirma se a sessão correspondente continua ativa no banco antes de liberar a rota.

## Scripts úteis

```bash
npm run start:dev  # desenvolvimento com watch
npm run build      # gera a compilação em dist/
npm run start:prod # executa a compilação gerada
npm run test       # executa testes unitários
npm run test:cov   # executa testes com cobertura
npm run lint       # verifica e corrige regras de lint
npm run format     # aplica Prettier aos arquivos TypeScript de src e test
```

## Fluxo de autenticação

```text
Front-end envia e-mail/CPF e senha
        ↓
API valida o usuário e a senha com bcrypt
        ↓
API cria uma sessão ativa no MySQL
        ↓
API retorna o token JWT
        ↓
Front-end envia o token nas rotas protegidas
        ↓
AuthGuard valida token e sessão ativa
```

No logout, a sessão é atualizada para 'ENCERRADA' e recebe a data de saída. Isso impede que a sessão seja reutilizada, mesmo que o token ainda não tenha expirado.

## Qualidade e contribuição

Antes de abrir uma alteração, execute:

```bash
npm run build
npm run test
```

Não envie os arquivos '.env', 'node_modules', 'dist' ou credenciais para o repositório. Use mensagens de commit claras e mantenha o script 'database.sql' sincronizado sempre que o modelo de dados mudar.
