// server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const emailRoutes = require('./Routes/emailRoutes');
const multer = require('multer');
const { randomUUID } = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

/* ------------------------------------------------------------------
   1. Upload em memória (para fotos de usuário)
------------------------------------------------------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/* ------------------------------------------------------------------
   2. Middlewares básicos
------------------------------------------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Arquivos estáticos (CSS e JS do front)
app.use('/style', express.static(path.join(__dirname, 'public', 'style')));
app.use('/javaScript', express.static(path.join(__dirname, 'public', 'javaScript')));

/* ------------------------------------------------------------------
   3. Supabase clients
------------------------------------------------------------------- */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.warn('⚠️  Variáveis do Supabase não configuradas no .env');
}

// Cliente "público" (reservado, se quiser usar depois)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin – usa service_role, só aqui no backend
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

/* ------------------------------------------------------------------
   4. Helpers
------------------------------------------------------------------- */

// Senha simples para proteger as rotas de admin
const ADMIN_PANEL_PASSWORD = process.env.ADMIN_PANEL_PASSWORD || 'admin1234';

function requireAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (!password || password !== ADMIN_PANEL_PASSWORD) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

// Mapeia o registro do banco para o objeto seguro enviado ao front
function mapUserToSafeUser(user) {
  return {
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
}

// Upload da imagem para o bucket "avatars" e retorna a URL pública
async function uploadUserImage(file) {
  if (!file) {
    throw new Error('Foto é obrigatória');
  }

  if (!file.mimetype.startsWith('image/')) {
    throw new Error('Arquivo de foto inválido. Envie apenas imagens.');
  }

  // extensão baseada no nome original
  const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const filePath = `avatars/${randomUUID()}.${ext}`; // pasta + nome random

  const { error: uploadError } = await supabaseAdmin.storage
    .from('avatars') // mesmo nome do bucket
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) {
    console.error('Erro upload imagem:', uploadError);
    throw new Error('Erro ao salvar foto no storage');
  }

  const { data } = supabaseAdmin.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl; // URL usada no <img src="...">
}

/* ------------------------------------------------------------------
   5. Rotas de páginas (HTML)
------------------------------------------------------------------- */
const routes = [
  { path: '/', file: 'index.html' },
  { path: '/login', file: 'login.html' },
  { path: '/carteirinhaDigital', file: 'carteirinhaDigital.html' },
  { path: '/cadastroUsu', file: 'cadastroUsu.html' },          // admin
  { path: '/cadastroPublico', file: 'cadastroPublico.html' },  // público
];

routes.forEach((route) => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', route.file));
  });
});

/* ------------------------------------------------------------------
   6. Rotas de API - Autenticação e Usuário logado
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
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS',
      });
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) {
      console.error('Erro Supabase (login):', error);
      return res.status(500).json({
        error: 'Erro ao buscar usuário',
        code: 'DB_ERROR',
      });
    }

    const user = users && users[0];

    // usuário não encontrado
    if (!user) {
      return res.status(401).json({
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);

    // senha errada
    if (!passwordOk) {
      return res.status(401).json({
        error: 'Email ou senha inválidos',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // status diferente de active
    if (user.status !== 'active') {
      let msg = 'Usuário não está ativo.';
      let code = 'INACTIVE';

      if (user.status === 'pending') {
        msg = 'Seu cadastro está pendente de aprovação pelo administrador.';
        code = 'PENDING';
      } else if (user.status === 'inactive') {
        msg = 'Seu cadastro ainda não foi ativado. Aguarde o administrador aprovar.';
        code = 'INACTIVE';
      }

      return res.status(403).json({
        error: msg,
        code,
        status: user.status,
      });
    }

    const safeUser = mapUserToSafeUser(user);
    return res.json({ user: safeUser });
  } catch (err) {
    console.error('Erro /api/login:', err);
    return res.status(500).json({
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

// GET /api/me/:id  -> busca dados atualizados do usuário logado
app.get('/api/me/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      // not found
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (error) {
      console.error('Erro Supabase (/api/me):', error);
      return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Seu cadastro não está mais ativo.',
        code: 'INACTIVE',
        status: user.status,
      });
    }

    const safeUser = mapUserToSafeUser(user);
    return res.json({ user: safeUser });
  } catch (err) {
    console.error('Erro /api/me/:id:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

/* ------------------------------------------------------------------
   7. Rotas de API - Admin (CRUD de usuários)
------------------------------------------------------------------- */

/**
 * POST /api/admin/users
 * Criação de usuário (tela de admin)
 * Header: x-admin-password: ADMIN_PANEL_PASSWORD
 */
app.post(
  '/api/admin/users',
  requireAdmin,
  upload.single('foto'),
  async (req, res) => {
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
        status,
      } = req.body;

      if (!email || !password || !nome || !nomePerfil) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      let fotoUrl;
      try {
        fotoUrl = await uploadUserImage(req.file);
      } catch (err) {
        return res.status(400).json({ error: err.message });
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
  }
);

/**
 * GET /api/admin/users
 * Lista todos os usuários (tela de admin)
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

// PUT /api/admin/users/:id – atualizar dados de um usuário
app.put(
  '/api/admin/users/:id',
  requireAdmin,
  upload.single('foto'),
  async (req, res) => {
    try {
      const { id } = req.params;

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
        status,
      } = req.body;

      const updatePayload = {};

      if (email !== undefined) updatePayload.email = email;
      if (nome !== undefined) updatePayload.nome = nome;
      if (nomePerfil !== undefined) updatePayload.nome_perfil = nomePerfil;
      if (curso !== undefined) updatePayload.curso = curso;
      if (campus !== undefined) updatePayload.campus = campus;
      if (matricula !== undefined) updatePayload.matricula = matricula;
      if (cpf !== undefined) updatePayload.cpf = cpf;
      if (numeroTel !== undefined) updatePayload.numero_tel = numeroTel;
      if (dataNascimento !== undefined) updatePayload.data_nascimento = dataNascimento;
      if (validade !== undefined) updatePayload.validade = validade;
      if (status !== undefined) updatePayload.status = status;

      if (password) {
        updatePayload.password_hash = await bcrypt.hash(password, 10);
      }

      if (req.file) {
        try {
          const novaFotoUrl = await uploadUserImage(req.file);
          updatePayload.foto_url = novaFotoUrl;
        } catch (err) {
          return res.status(400).json({ error: err.message });
        }
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro Supabase (update user):', error);
        return res.status(400).json({ error: error.message });
      }

      return res.json(data);
    } catch (err) {
      console.error('Erro /api/admin/users/:id (PUT):', err);
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }
  }
);

// PATCH /api/admin/users/:id/status – atualizar apenas o status
app.patch('/api/admin/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['active', 'inactive', 'pending'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro Supabase (update status):', error);
      return res.status(400).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error('Erro /api/admin/users/:id/status (PATCH):', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// DELETE /api/admin/users/:id – excluir usuário
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro Supabase (delete user):', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('Erro /api/admin/users/:id (DELETE):', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

/* ------------------------------------------------------------------
   8. Cadastro público (/api/public/register)
------------------------------------------------------------------- */

// Cadastro público de usuário - status começa como 'inactive'
app.post('/api/public/register', upload.single('foto'), async (req, res) => {
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
    } = req.body;

    if (!email || !password || !nome || !nomePerfil) {
      return res.status(400).json({
        error: 'Nome, Nome de Perfil, Email e Senha são obrigatórios',
      });
    }

    // evitar email duplicado
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existingError) {
      console.error('Erro Supabase (check existing email):', existingError);
      return res.status(500).json({ error: 'Erro ao validar email' });
    }

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // upload da foto
    let fotoUrl;
    try {
      fotoUrl = await uploadUserImage(req.file);
    } catch (err) {
      return res.status(400).json({ error: err.message });
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
        status: 'inactive', // começa inativo
      })
      .select()
      .single();

    if (error) {
      console.error('Erro Supabase (public register):', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: 'Cadastro realizado. Aguarde ativação pelo administrador.',
      userId: data.id,
    });
  } catch (err) {
    console.error('Erro /api/public/register:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

/* ------------------------------------------------------------------
   9. Rota para salvar localização (legado)
------------------------------------------------------------------- */
app.post('/saveLocation', (req, res) => {
  const { latitude, longitude } = req.body;
  console.log(`Localização recebida: Latitude: ${latitude}, Longitude: ${longitude}`);

  res.send('Localização recebida com sucesso');
});

/* ------------------------------------------------------------------
   10. Rotas de email
------------------------------------------------------------------- */
app.use('/email', emailRoutes);

/* ------------------------------------------------------------------
   11. Inicializando o servidor
------------------------------------------------------------------- */
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
