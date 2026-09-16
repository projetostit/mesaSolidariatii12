
# Guia de execuÃƒÂ§ÃƒÂ£o do Mesa SolidÃƒÂ¡ria

Este guia parte do princÃƒÂ­pio de que o computador jÃƒÂ¡ possui Git, Node.js, MySQL, MySQL Workbench, VS Code e as pastas dos dois repositÃƒÂ³rios jÃƒÂ¡ baixadas.

## 1. Instalar as bibliotecas da API

No mesmo PowerShell, escreva:

```powershell
cd "$HOME\\Documents\\Projetos\\mesa-solidaria-api"
npm install
```

Espere terminar. Na primeira vez pode demorar alguns minutos. Esse comando cria uma pasta chamada 'node_modules'; ela contÃƒÂ©m bibliotecas necessÃƒÂ¡rias e nÃƒÂ£o deve ser enviada ao GitHub.

Se aparecer 'npm is not recognized', instale o Node.js e abra um novo PowerShell.

## 2. Criar o banco de dados

### 2.1 Localizar o arquivo SQL

O arquivo que cria as tabelas se chama 'database.sql' e jÃƒÂ¡ vem dentro do repositÃƒÂ³rio 'mesa-solidaria-api'.

Depois de clonar o projeto, ele estarÃƒÂ¡ neste local:

```text
Documentos\\Projetos\\mesa-solidaria-api\\database.sql
```

> Use sempre 'database.sql', que ÃƒÂ© o arquivo atualizado incluÃƒÂ­do no repositÃƒÂ³rio.

### 2.2 Executar o script no MySQL Workbench

1. Abra o **MySQL Workbench** pelo menu Iniciar.
2. Na tela inicial, clique na conexÃƒÂ£o chamada **Local instance MySQL**. Ela normalmente mostra 'localhost:3306'.
3. Digite a senha do MySQL criada durante a instalaÃƒÂ§ÃƒÂ£o e clique em **OK**.
4. Clique em **File** > **Open SQL Script...**.
5. VÃƒÂ¡ atÃƒÂ© 'Documentos > Projetos > mesa-solidaria-api'.
6. Selecione 'database.sql' e clique em **Open**.
7. O texto SQL aparecerÃƒÂ¡ no editor.
8. Clique no ÃƒÂ­cone de raio (Ã¢Å¡Â¡), no alto da tela, para executar todo o script.
9. Na parte inferior, procure por uma mensagem semelhante a 'Query OK' ou 'Action Output' sem erros.

O script cria o banco chamado 'mesa_solidaria', as tabelas e os perfis iniciais.

### 2.3 Conferir se o banco foi criado

No Workbench, abra uma nova aba SQL e execute:

```sql
USE mesa_solidaria;
SHOW TABLES;
SELECT * FROM PERFIS;
```

VocÃƒÂª deve ver tabelas como 'USUARIOS', 'PERFIS', 'USUARIOS_PERFIS' e 'SESSOES'. A consulta de perfis deve mostrar 'BENEFICIARIO', 'DOADOR', 'VOLUNTARIO', 'PONTO_COLETA' e 'ADMINISTRADOR'.

## 3. Criar o arquivo de configuraÃƒÂ§ÃƒÂ£o da API (.env)

O arquivo '.env' guarda configuraÃƒÂ§ÃƒÂµes privadas, como a senha do banco. Por seguranÃƒÂ§a, ele nÃƒÂ£o ÃƒÂ© enviado ao GitHub.

1. Abra o VS Code.
2. Clique em **File** > **Open Folder...**.
3. Escolha a pasta 'Documentos\\Projetos\\mesa-solidaria-api'.
4. No painel esquerdo, clique no botÃƒÂ£o **New File** (ÃƒÂ­cone de folha com '+').
5. No nome do arquivo, escreva exatamente '.env' e aperte Enter.
6. Cole o conteÃƒÂºdo abaixo.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=COLOQUE_AQUI_A_SENHA_DO_MYSQL
DB_NAME=mesa_solidaria

JWT_SECRET=troque_esta_frase_por_uma_chave_longa_e_secreta_2026
JWT_EXPIRES_IN=1d
```

7. Troque somente 'COLOQUE_AQUI_A_SENHA_DO_MYSQL' pela senha criada no MySQL Installer. NÃƒÂ£o use aspas.
8. A 'JWT_SECRET' nÃƒÂ£o ÃƒÂ© uma senha que jÃƒÂ¡ existe nem pode ser descoberta pelo GitHub. VocÃƒÂª precisa criar uma chave prÃƒÂ³pria para esse computador.
9. Abra um PowerShell separado, copie o comando abaixo e aperte Enter:

```powershell
[Convert]::ToBase64String([byte[]](1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

10. O PowerShell mostrarÃƒÂ¡ uma sequÃƒÂªncia longa de letras, nÃƒÂºmeros e sÃƒÂ­mbolos. Copie toda essa sequÃƒÂªncia.
11. Volte ao arquivo '.env', apague o texto depois de 'JWT_SECRET=' e cole a sequÃƒÂªncia gerada. A linha ficarÃƒÂ¡ semelhante a esta:

```env
JWT_SECRET=cole_aqui_a_sequencia_gerada_no_powershell
```

12. Salve com 'Ctrl + S'.

Exemplo fictÃƒÂ­cio preenchido:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=MinhaSenha@2026
DB_NAME=mesa_solidaria

JWT_SECRET=MesaSolidaria-chave-local-2026-9fA7k2Lm
JWT_EXPIRES_IN=1d
```

> Nunca envie o arquivo '.env', a senha do MySQL, o token do GitHub ou a chave JWT para outra pessoa ou para o GitHub. Se outra pessoa configurar o projeto em outro computador, ela deve gerar a prÃƒÂ³pria 'JWT_SECRET'.

## 4. Iniciar a API

1. Abra um PowerShell.
2. Entre na pasta da API:

```powershell
cd "$HOME\\Documents\\Projetos\\mesa-solidaria-api"
```

3. Inicie a API:

```powershell
npm run start:dev
```

4. Espere aparecer uma mensagem contendo 'Nest application successfully started'.
5. NÃƒÂ£o feche esse PowerShell enquanto estiver usando o sistema. Ele ÃƒÂ© o servidor da API.

Abra o navegador e acesse:

```text
http://localhost:3000/api
```

Se abrir a pÃƒÂ¡gina "Mesa SolidÃƒÂ¡ria API", a API estÃƒÂ¡ funcionando.

