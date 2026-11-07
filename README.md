# 🎓 UPA – Carteirinha Digital

Sistema de **carteirinha digital acadêmica fictícia** da **Universidade Pedro de Alcântara (UPA)**.  
Projeto focado em prática de FullStack, com autenticação, upload de imagens, renovação de carteirinha e painel administrativo.

> ⚠️ **Aviso importante**  
> Este sistema é **exclusivamente para fins acadêmicos / estudo**.  
> Não deve ser utilizado como documento oficial, nem para comprovação acadêmica real.

---

## Visão de engenharia

**Tipo:** projeto acadêmico de estudo Full Stack, com dados e instituição fictícios.

O objetivo foi exercitar um fluxo completo com **Node.js/Express**, operações CRUD, autenticação, upload de arquivos e persistência em PostgreSQL via Supabase. O projeto é útil para avaliar fundamentos de API, sessões, modelagem de dados e organização de fluxos administrativos.

| Aspecto | Implementação de estudo |
| --- | --- |
| Backend | Node.js e Express |
| Banco e arquivos | Supabase PostgreSQL e Storage |
| Controle de acesso | Fluxos de login e painel administrativo |
| Operação | Cadastro, emissão, consulta e renovação de carteirinhas |
| Interface | HTML, CSS, JavaScript e Bootstrap |

### Limitações e cuidados

- **Não é um serviço de identificação oficial.** Não utilizar dados pessoais reais para avaliar o projeto.
- **Não homologado para produção.** Autenticação, tratamento de arquivos, dependências, autorização e políticas de banco exigem auditoria de segurança antes de qualquer uso real.
- O repositório precisa de manutenção de higiene Git: há dependências `node_modules` versionadas historicamente, que devem ser removidas do índice e do histórico conforme o caso. Adicionar `.gitignore` não remove arquivos já rastreados.
- O `package.json` possui scripts `start` e `dev`; não há uma suíte automatizada de testes declarada, portanto não se deve anunciar cobertura de testes inexistente.

### Execução para análise local

**Pré-requisitos:** Node.js 18+, npm e um ambiente Supabase de desenvolvimento configurado com credenciais próprias.

```bash
npm ci
npm run dev
```

Use variáveis de ambiente fora do controle de versão. Antes de executar fluxos administrativos, revise as configurações e controles do backend.

---

## ✨ Funcionalidades

- ✅ Cadastro público de usuário com:
  - Foto de perfil
  - Curso, campus, matrícula, CPF, telefone, data de nascimento
  - Geração automática da validade da carteirinha por semestre

- ✅ Login com email + senha

- ✅ Carteirinha digital:
  - Visualização dos dados principais
  - Modal com carteirinha completa (CPF, nascimento, curso, campus etc.)
  - Destaque de **carteirinha ativa / expirada**
  - Bloqueio de acesso à carteirinha quando expirada

- ✅ Pedido de renovação:
  - Upload de **comprovante de pagamento** (imagem)
  - Campo de **mensagem/observação** para o usuário
  - Informação de prazo: **retorno em até 24h a 48h**

- ✅ Painel Admin:
  - CRUD completo de usuários (criar, editar, inativar, excluir)
  - Upload/atualização de foto
  - Filtro por status (active, inactive, pending, expired)
  - Busca por nome, email ou matrícula
  - Listagem e análise de **renovações de carteirinha**
  - Aprovar/recusar renovações com ajuste automático de validade

- ✅ Integração com **Supabase**:
  - Tabelas para usuários e renovações
  - Buckets de storage para fotos e comprovantes

- ✅ Preparado para **PWA**:
  - Manifesto web (`manifest.webmanifest`)
  - Estrutura pronta para service worker
  - Permite instalação no celular como “app”

---

## 🧱 Stack

- **Backend:** Node.js + Express
- **Banco de dados:** Supabase (PostgreSQL)
- **Storage de arquivos:** Supabase Storage
- **Auth / senha:** `bcryptjs`
- **Upload de arquivos:** `multer` (memória) + Supabase Storage
- **Email (suporte / notificações):** `nodemailer` (via `emailRoutes`)
- **Frontend:** HTML + CSS + JavaScript puro + Bootstrap 5
- **PWA:** Manifest + (service worker opcional)

---

## 📁 Estrutura do Projeto

Resumo da estrutura esperada:

```bash
upa-carteirinha/
├─ server.js
├─ package.json
├─ .env
├─ public/
│  ├─ html/
│  │  ├─ index.html              # Landing page / home
│  │  ├─ login.html              # Tela de login
│  │  ├─ cadastroPublico.html    # Cadastro de usuário
│  │  ├─ carteirinhaDigital.html # Tela principal da carteirinha
│  │  ├─ cadastroUsu.html        # Painel admin (gerenciar usuários)
│  │  └─ renovacaoCarteirinha.html
│  ├─ style/
│  │  └─ styleCD.css
│  ├─ javaScript/
│  │  ├─ dadosUser.js
│  │  ├─ formatacao.js
│  │  ├─ modalCarteirinha.js
│  │  ├─ adminUsers.js
│  │  ├─ ui.js
│  │  ├─ verificaLocal.js
│  │  └─ sendEmail.js
│  ├─ manifest.webmanifest       # Manifest PWA
│  └─ icons/                     # Ícones para PWA
├─ Routes/
│  └─ emailRoutes.js
└─ ...
