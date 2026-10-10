# NewsBot Painel

Painel web de operação do [NewsBot](https://github.com/anwarquirino/newsbot): acompanha a fila, as publicações, os erros e os logs do pipeline de notícias (n8n + IA + WordPress) e permite intervir sem quebrar o fluxo automático.

[![CI](https://github.com/anwarquirino/newsbot-painel/actions/workflows/ci.yml/badge.svg)](https://github.com/anwarquirino/newsbot-painel/actions/workflows/ci.yml)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-2a78d6.svg)](LICENSE)

## O que é

O [NewsBot](https://github.com/anwarquirino/newsbot) é um sistema de automação que roda em n8n: captura notícias de feeds RSS e do Google Trends, reescreve o texto com IA (Groq), publica no WordPress e registra cada etapa em um MySQL (tabelas `noticias_publicadas` e `execucoes_log`).

Este repositório é a interface de operação desse sistema. Ele lê o mesmo banco que o n8n escreve e oferece:

- visibilidade: métricas, gráficos e listas do que está na fila, do que foi publicado e do que falhou;
- intervenção segura: editar um item antes de ele ser processado, descartar, reprocessar erros e destravar itens presos;
- uma API REST documentada sobre os mesmos dados.

A regra de ouro é não atrapalhar o fluxo do n8n, que sempre pega o próximo item com `status = 'fila'` ordenado por `data_coleta`. Todas as ações do painel são transições de status feitas em uma única query condicionada ao status atual; nada é apagado.

O projeto também tem um **modo demo** que roda sem banco, com dados fictícios em memória. É assim que o deploy público do portfólio funciona, sem expor o MySQL real.

## Funcionalidades

| Página         | O que faz                                                                                                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`            | Visão geral: tiles (na fila, processando com contagem de travados, publicados hoje, publicados em 7 dias, erros), gráfico de publicações por dia nos últimos 14 dias, publicações por categoria, top 5 fontes e os 10 últimos publicados.            |
| `/fila`        | Itens em `fila` e `processando` na ordem em que o n8n vai consumi-los, com paginação, busca por título e filtros por fonte e categoria. Ações: ver detalhe, descartar (só itens em `fila`) e destravar todos os `processando` há mais de 10 minutos. |
| `/publicados`  | Artigos publicados, do mais recente ao mais antigo, com filtros por categoria, fonte e período de publicação e link direto para o post no WordPress (`WORDPRESS_URL/?p=post_id_wp`).                                                                 |
| `/erros`       | Itens com `status = 'erro'`, com a mensagem de erro e o número de tentativas. Ações: reprocessar um item, reprocessar todos e descartar.                                                                                                             |
| `/logs`        | Últimas 200 linhas de `execucoes_log`, com filtro por fluxo e por status (ok/erro).                                                                                                                                                                  |
| `/artigo/[id]` | Todos os campos do artigo, conteúdo reescrito renderizado após sanitização, link para a matéria original e, quando o item está em `fila`, formulário para editar título, resumo da fonte e tags.                                                     |
| `/login`       | Página de autenticação por senha única (aparece apenas quando `PAINEL_SENHA` está definida).                                                                                                                                                         |

Transversal: navegação lateral responsiva, tema claro e escuro via `prefers-color-scheme`, estados vazio e de erro tratados em todas as páginas, filtros que funcionam sem JavaScript (formulários GET) e aviso no topo quando o painel roda em demo ou sem autenticação.

## Arquitetura

```
Navegador
   │   HTML renderizado no servidor + fetch para /api/* nas ações
   ▼
Next.js 15 (App Router, TypeScript strict, Tailwind CSS 4)
   ├── src/app/(painel)/*      páginas: leitura via Server Components
   ├── src/app/api/*           Route Handlers: escrita e JSON, validação com zod
   ├── src/middleware.ts       sessão assinada (HMAC-SHA256) quando há PAINEL_SENHA
   └── src/lib/
        ├── metrics.ts         métricas da visão geral (função pura, testada)
        ├── sanitize.ts        limpeza do HTML gerado pela IA
        └── repositories/      ArticlesRepository e LogsRepository (interfaces)
             ├── mysql/        mysql2/promise com pool e queries parametrizadas
             └── demo/         em memória, determinístico: 60 artigos e 40 logs
                    │
                    ▼
            MySQL do NewsBot   ◄──────  n8n (coleta → reescrita com IA → WordPress)
            noticias_publicadas, execucoes_log
```

**Camada de dados por interface.** Páginas e API falam apenas com `ArticlesRepository` e `LogsRepository`. A implementação é escolhida em tempo de execução por `DATA_SOURCE`:

- `mysql`: `mysql2/promise` com pool de conexões, todas as queries com placeholders (nenhum valor é interpolado em SQL), mapeamento das colunas em português para um modelo em inglês.
- `demo`: um conjunto de dados gerado por um PRNG com semente fixa, com 60 artigos espalhados por status, categoria, fonte e datas dos últimos 30 dias, mais 40 linhas de log. As ações (descartar, reprocessar, editar) funcionam de verdade, mas o estado vive só na memória do processo.

Se `DATABASE_URL` não existir, o painel cai automaticamente para `demo`, mesmo que `DATA_SOURCE=mysql` tenha sido pedido (um aviso é registrado no log do servidor).

**Regras de negócio que o painel respeita.** Cada ação é um `UPDATE ... WHERE id = ? AND status IN (...)`, então não há corrida com o n8n:

| Ação              | Status de origem                             | Status de destino | Efeitos colaterais                        |
| ----------------- | -------------------------------------------- | ----------------- | ----------------------------------------- |
| Editar            | `fila`                                       | `fila`            | altera `titulo`, `resumo_fonte`, `tags`   |
| Descartar         | `fila`, `erro`                               | `descartado`      | precisa da migration `sql/001_painel.sql` |
| Reprocessar       | `erro`                                       | `fila`            | `tentativas = 0`, `erro_msg = NULL`       |
| Reprocessar todos | `erro`                                       | `fila`            | idem, para todos os itens em erro         |
| Destravar         | `processando` (> 10 min desde `data_coleta`) | `fila`            | nenhum                                    |

O schema do NewsBot não guarda a hora da última mudança de status, então `data_coleta` é usada como indicador de item travado (ver "Decisões e próximos passos").

**Migration opcional.** `sql/001_painel.sql` estende o ENUM de `status` para incluir `'descartado'`. É a única alteração de schema e serve apenas à ação "Descartar"; sem ela, tudo funciona e essa ação responde `409 MIGRATION_REQUIRED`. O n8n não é afetado, pois só consulta `status = 'fila'`.

## Como rodar

### Demo em 3 comandos (sem banco)

```bash
git clone https://github.com/anwarquirino/newsbot-painel.git && cd newsbot-painel
npm install
npm run dev
```

Abra <http://localhost:3000>. Sem `DATABASE_URL` o painel usa dados fictícios e, sem `PAINEL_SENHA`, a autenticação fica desligada (um aviso aparece no topo).

### Apontando para o MySQL do NewsBot

```bash
cp .env.example .env.local
# edite .env.local: DATA_SOURCE=mysql, DATABASE_URL, PAINEL_SENHA, SESSION_SECRET, WORDPRESS_URL, TZ
mysql -h HOST -u USUARIO -p newsbot < sql/001_painel.sql   # opcional: habilita "Descartar"
npm run build
npm start
```

O usuário do banco precisa de `SELECT` e `UPDATE` em `noticias_publicadas` e `SELECT` em `execucoes_log`. Use o mesmo `TZ` do n8n para que "publicados hoje" e os gráficos por dia batam com o horário local.

### Docker Compose (painel + MySQL 8)

```bash
PAINEL_SENHA=minha-senha SESSION_SECRET=um-segredo-longo docker compose up --build
```

Sobe o painel em <http://localhost:3000> (modo `mysql`) e um MySQL 8 em `localhost:3306` que, na primeira inicialização do volume, executa `newsbot_schema.sql` e depois `sql/001_painel.sql`. As tabelas começam vazias, então o painel mostra os estados vazios até que o n8n (ou um `INSERT` seu) grave dados. Para apontar o contêiner do painel para o banco real, basta trocar `DATABASE_URL` no `docker-compose.yml`.

A imagem usa o build `standalone` do Next.js em três estágios (dependências, build, runtime enxuto como usuário sem privilégios) e expõe `/api/health` como `HEALTHCHECK`.

## Variáveis de ambiente

| Variável         | Obrigatória   | Padrão                                         | Descrição                                                                                                                 |
| ---------------- | ------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `DATA_SOURCE`    | não           | `mysql` se houver `DATABASE_URL`, senão `demo` | Fonte de dados: `mysql` ou `demo`.                                                                                        |
| `DATABASE_URL`   | no modo mysql | —                                              | `mysql://usuario:senha@host:3306/banco`. Sem ela o painel usa `demo`.                                                     |
| `PAINEL_SENHA`   | não           | — (autenticação desligada)                     | Senha única de acesso. Defina sempre que o painel estiver exposto.                                                        |
| `SESSION_SECRET` | recomendada   | derivado de `PAINEL_SENHA`                     | Segredo do HMAC do cookie de sessão. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `WORDPRESS_URL`  | não           | —                                              | URL pública do WordPress; habilita os links `WORDPRESS_URL/?p=post_id_wp`.                                                |
| `TZ`             | recomendada   | fuso do sistema                                | Fuso do servidor; use o mesmo do n8n e do MySQL.                                                                          |
| `PORT`           | não           | `3000`                                         | Porta do servidor Next.js.                                                                                                |

## API

Route Handlers em `src/app/api`. Respostas de sucesso usam `{ "data": ... }` (listas incluem `"pagination": { page, limit, total, totalPages }`); erros usam `{ "error": { "code", "message", "details?" } }` com códigos estáveis: `VALIDATION_ERROR`, `INVALID_JSON`, `NOT_FOUND`, `INVALID_STATUS`, `UNAUTHORIZED`, `AUTH_DISABLED`, `MIGRATION_REQUIRED`, `INTERNAL_ERROR`. Com autenticação ligada, todas as rotas exceto `/api/health` e `/api/auth/*` exigem o cookie de sessão (sem ele: `401`).

| Método | Rota                        | Descrição                                                                                                                                                                                                                     |
| ------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/health`               | Estado do serviço, fonte de dados e se a autenticação está ativa. `503` se o banco não responder.                                                                                                                             |
| GET    | `/api/metrics`              | Métricas da visão geral (contadores, publicações por dia, por categoria, top fontes, últimos publicados).                                                                                                                     |
| GET    | `/api/articles`             | Lista paginada. Query: `status` (lista separada por vírgula), `source`, `category`, `q` (título), `from`/`to` (AAAA-MM-DD, por `data_publicacao`), `sort` (`collectedAt`/`publishedAt`), `order`, `page`, `limit` (máx. 100). |
| GET    | `/api/articles/:id`         | Artigo completo, incluindo `rewrittenContent`.                                                                                                                                                                                |
| PATCH  | `/api/articles/:id`         | Edita `title`, `sourceSummary` e/ou `tags` (JSON). Só para itens em `fila`; caso contrário `409`.                                                                                                                             |
| POST   | `/api/articles/:id/discard` | `fila`/`erro` → `descartado`.                                                                                                                                                                                                 |
| POST   | `/api/articles/:id/retry`   | `erro` → `fila`, zerando `tentativas` e `erro_msg`.                                                                                                                                                                           |
| POST   | `/api/articles/retry-all`   | Reprocessa todos os itens em `erro`. Retorna `{ "data": { "affected" } }`.                                                                                                                                                    |
| POST   | `/api/articles/unstick`     | Devolve à fila os `processando` há mais de 10 minutos. Retorna `{ "data": { "affected", "olderThanMinutes" } }`.                                                                                                              |
| GET    | `/api/logs`                 | Últimas linhas de `execucoes_log`. Query: `flow`, `status` (`ok`/`erro`), `limit` (padrão 200, máx. 500).                                                                                                                     |
| POST   | `/api/auth/login`           | Formulário (`password`, `next`) ou JSON (`{ "password" }`). Define o cookie de sessão.                                                                                                                                        |
| POST   | `/api/auth/logout`          | Limpa o cookie de sessão.                                                                                                                                                                                                     |

Os campos da API usam nomes em inglês mapeados para as colunas do NewsBot: `title` → `titulo`, `originalUrl` → `url_original`, `wpPostId` → `post_id_wp`, `source` → `fonte`, `sourceSummary` → `resumo_fonte`, `wpCategoryId` → `categoria_wp`, `rewrittenContent` → `conteudo_reescrito`, `summary` → `resumo`, `category` → `categoria`, `collectedAt` → `data_coleta`, `publishedAt` → `data_publicacao`, `attempts` → `tentativas`, `errorMessage` → `erro_msg`. Os valores de `status` são os mesmos do banco.

Exemplo:

```bash
curl "http://localhost:3000/api/articles?status=fila,processando&q=vacina&limit=5"
curl -X PATCH http://localhost:3000/api/articles/59 \
  -H "Content-Type: application/json" \
  -d '{"title":"Título revisado antes da reescrita","tags":"saúde, vacinas"}'
```

## Testes

```bash
npm test          # Vitest, 43 testes
npm run lint      # ESLint (config do Next)
npm run format:check
npm run typecheck # tsc --noEmit
npm run build
```

Os testes rodam em modo demo, sem banco:

- `tests/metrics.test.ts`: contadores, limites de "hoje" e "7 dias", 14 dias do gráfico, agrupamentos, limite do top de fontes e dos últimos publicados.
- `tests/demo-repository.test.ts`: geração determinística, paginação, filtros (status, fonte, categoria, busca sem acento, período), ordenação e todas as ações com suas regras de status.
- `tests/api.test.ts`: Route Handlers chamados com `Request` (health, listagem, validação, detalhe, PATCH, discard, retry, retry-all, unstick, metrics, logs).
- `tests/sanitize.test.ts`: remoção de scripts e atributos perigosos do HTML da IA.
- `tests/session.test.ts`: assinatura, expiração e redirecionamento seguro da sessão.

A implementação MySQL compartilha as interfaces e os schemas de validação com a demo, mas não é exercitada na CI por falta de um banco; ver "próximos passos".

## Estrutura de pastas

```
.
├── .github/workflows/ci.yml       lint, format, typecheck, test, build
├── Dockerfile                     multi-stage com saída standalone
├── docker-compose.yml             painel + MySQL 8 com schema e migration
├── newsbot_schema.sql             schema do NewsBot (para o compose)
├── sql/001_painel.sql             migration opcional: status 'descartado'
├── src/
│   ├── middleware.ts              proteção por sessão assinada
│   ├── app/
│   │   ├── (painel)/              layout com navegação + páginas
│   │   ├── api/                   Route Handlers
│   │   └── login/                 página de login
│   ├── components/
│   │   ├── articles/              edição, link do WordPress, célula de título
│   │   ├── charts/                ColumnChart, BarList
│   │   ├── layout/                Sidebar, NavLinks, DemoBanner
│   │   └── ui/                    StatTile, StatusBadge, Pagination, FilterForm, ...
│   └── lib/
│       ├── api/                   http (envelopes), schemas (zod), client
│       ├── auth/session.ts        HMAC do cookie
│       ├── repositories/          types, index, demo/, mysql/
│       ├── metrics.ts · queue.ts · sanitize.ts · format.ts · env.ts
└── tests/                         Vitest
```

## Decisões e próximos passos

**Decisões**

- Route Handlers em vez de Server Actions para a escrita: a API fica visível, documentável e testável com `Request`/`Response`, e pode ser consumida por outros clientes (um futuro app, um script, o próprio n8n).
- Repositório por interface com duas implementações: desacopla as páginas do banco, permite o modo demo público e isola o SQL em um único lugar auditável.
- Métricas em função pura (`computeMetrics`) alimentada por uma consulta leve que exclui o `conteudo_reescrito` (MEDIUMTEXT).
- Descartar é uma transição de status, não um `DELETE`: preserva histórico e não exige permissão de exclusão no banco.
- "Travado" usa `data_coleta` como referência porque o schema não registra a hora da mudança de status; o limite de 10 minutos é folgado para o tempo típico de reescrita.
- Autenticação por senha única com cookie assinado por HMAC (Web Crypto, sem dependências): suficiente para um painel operacional de uso interno, com `timingSafeEqual` na comparação e proteção contra open redirect no pós-login.
- `conteudo_reescrito` passa por `sanitize-html` com lista de tags permitidas antes de ser renderizado; um dos artigos do modo demo carrega `<script>` e `onclick` de propósito para demonstrar isso.
- Gráficos em HTML/CSS próprios, sem biblioteca: uma série, um tom, rótulo direto apenas no maior valor, tooltip acessível por teclado e versão em tabela.
- Datas interpretadas no fuso do servidor (`TZ`), que deve ser o mesmo do n8n; evita conversões ambíguas de `DATETIME`.

**Próximos passos**

- Coluna `atualizado_em` (com `ON UPDATE CURRENT_TIMESTAMP`) para medir "travado" com precisão e exibir a duração de cada etapa.
- Testes de integração da implementação MySQL na CI com um serviço `mysql:8` e os arquivos SQL deste repositório.
- Atualização automática da visão geral e da fila (polling leve ou SSE) sem perder os filtros.
- Registro das ações do painel em `execucoes_log` (quem descartou ou reprocessou o quê) para auditoria.
- Múltiplos usuários com papéis (leitura e operação) quando mais de uma pessoa operar o NewsBot.
