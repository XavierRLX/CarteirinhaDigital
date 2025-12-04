// server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const emailRoutes = require('./Routes/emailRoutes');

const app = express();
const port = process.env.PORT || 3000;

/* ------------------------------------------------------------------
   1. Middlewares básicos
------------------------------------------------------------------- */
// Para receber JSON e forms (login/cadastro)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Arquivos estáticos (CSS e JS do front)
app.use('/style', express.static(path.join(__dirname, 'public', 'style')));
app.use('/javaScript', express.static(path.join(__dirname, 'public', 'javaScript')));

/* ------------------------------------------------------------------
   2. Supabase clients
------------------------------------------------------------------- */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.warn('⚠️  Variáveis do Supabase não configuradas no .env');
}

// Cliente "público" (se você quiser usar depois no backend sem privilégios de admin)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin – usa service_role, só aqui no backend
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

/* ------------------------------------------------------------------
   3. Proteção simples para rotas de admin
------------------------------------------------------------------- */
const ADMIN_PANEL_PASSWORD = process.env.ADMIN_PANEL_PASSWORD || 'admin1234';

function requireAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (!password || password !== ADMIN_PANEL_PASSWORD) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

/* ------------------------------------------------------------------
   4. Rotas de páginas (HTML)
------------------------------------------------------------------- */
const routes = [
  { path: '/', file: 'index.html' },
  { path: '/login', file: 'login.html' },
  { path: '/carteirinhaDigital', file: 'carteirinhaDigital.html' },
  { path: '/cadastroUsu', file: 'cadastroUsu.html' },
];

routes.forEach((route) => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', route.file));
  });
});

/* ------------------------------------------------------------------
   5. Rotas de API - Autenticação e Usuários
------------------------------------------------------------------- */

/**
 * POST /api/login
 * Body: { email, password }
 * Retorna: { user: {...} } se ok
 */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) {
      console.error('Erro Supabase (login):', error);
      return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }

    const user = users && users[0];

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Usuário não está ativo' });
    }

    // Monta objeto "limpo" para o front
    const safeUser = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      nomePerfil: user.nome_perfil,
      curso: user.curso,
      campus: user.campus,
      matricula: user.matricula,
      cpf: user.cpf,
      numeroTel: user.numero_tel,
      dataNascimento: user.data_nascimento,
      validade: user.validade,
      fotoUrl: user.foto_url,
    };

    return res.json({ user: safeUser });
  } catch (err) {
    console.error('Erro /api/login:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

/**
 * POST /api/admin/users
 * Criação de usuário (usada pela tela de admin)
 * Header: x-admin-password: ADMIN_PANEL_PASSWORD
 */
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const {
      email,
      password,
      nome,
      nomePerfil,
      curso,
      campus,
      matricula,
      cpf,
      numeroTel,
      dataNascimento,
      validade,
      fotoUrl,
      status, // opcional (default 'active' ou 'pending')
    } = req.body;

    if (!email || !password || !nome || !nomePerfil) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash,
        nome,
        nome_perfil: nomePerfil,
        curso,
        campus,
        matricula,
        cpf,
        numero_tel: numeroTel,
        data_nascimento: dataNascimento,
        validade,
        foto_url: fotoUrl,
        status: status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro Supabase (create user):', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('Erro /api/admin/users (POST):', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

/**
 * GET /api/admin/users
 * Lista todos os usuários (para a futura tela de admin)
 * Header: x-admin-password: ADMIN_PANEL_PASSWORD
 */
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro Supabase (list users):', error);
      return res.status(400).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error('Erro /api/admin/users (GET):', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

/* ------------------------------------------------------------------
   6. Rota para salvar localização (mantida do seu código antigo)
------------------------------------------------------------------- */
app.post('/saveLocation', (req, res) => {
  const { latitude, longitude } = req.body;
  console.log(`Localização recebida: Latitude: ${latitude}, Longitude: ${longitude}`);

  // Aqui você pode processar ou armazenar a localização conforme necessário
  res.send('Localização recebida com sucesso');
});

/* ------------------------------------------------------------------
   7. Rotas de email (já existiam)
------------------------------------------------------------------- */
app.use('/email', emailRoutes);

/* ------------------------------------------------------------------
   8. Inicializando o servidor
------------------------------------------------------------------- */
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
