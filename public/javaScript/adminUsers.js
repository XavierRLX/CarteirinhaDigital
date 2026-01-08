// public/javaScript/adminUsers.js
// Painel Admin - Usuários + Renovações
// - Salva senha do admin no localStorage
// - Badge do sino com pendências
// - Modal do sino listando quem enviou renovação pendente
// - Coluna "Criado em" (usa users.created_at)
// - Modal por usuário (histórico de renovações)
// OBS: exige o HTML atualizado (cadastroUsu.html) com:
//  - #renewalsBell, #renewalsBadge
//  - #pendingRenewalsModal + #pendingRenewalsTableBody
//  - #renewalsModal + #renewalsTableBody
//  - tabela com 8 colunas (inclui "Criado em")

/* -------------------------------------------------------------
   Auth admin (localStorage)
------------------------------------------------------------- */
const ADMIN_STORAGE_KEY = 'adminPassword';
let ADMIN_PASSWORD = '';

function getSavedAdminPassword() {
  return localStorage.getItem(ADMIN_STORAGE_KEY) || '';
}
function saveAdminPassword(password) {
  localStorage.setItem(ADMIN_STORAGE_KEY, password);
}
function clearAdminPassword() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

/**
 * Pede senha 1x e salva no localStorage.
 * Importante: se o backend retornar 401 em qualquer fetch, limpamos e pedimos de novo.
 */
function solicitarSenhaAdmin() {
  const saved = getSavedAdminPassword();
  if (saved) {
    ADMIN_PASSWORD = saved;
    return true;
  }

  const inputPassword = prompt('Por favor, insira a senha de administrador:');
  if (!inputPassword) {
    showAlert('Acesso cancelado.', 'warning');
    window.location.href = '/login';
    return false;
  }

  ADMIN_PASSWORD = inputPassword;
  saveAdminPassword(inputPassword);
  return true;
}

/* -------------------------------------------------------------
   Utils
------------------------------------------------------------- */

// validade < hoje => expirada
function computeIsExpired(validade) {
  if (!validade) return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return validade < todayStr;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncate(str, max = 80) {
  if (!str) return '';
  return str.length <= max ? str : str.slice(0, max - 3) + '...';
}

function formatDateTimeBR(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR');
}

function formatDateBR(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

/**
 * Helper de fetch com header admin e tratamento de 401
 */
async function adminFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('x-admin-password', ADMIN_PASSWORD);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // senha inválida/expirada: limpa e recarrega pra pedir de novo
    clearAdminPassword();
    showAlert('Senha de admin inválida. Digite novamente.', 'warning');
    window.location.reload();
    // interrompe o fluxo
    throw new Error('ADMIN_UNAUTHORIZED');
  }

  return res;
}

/* -------------------------------------------------------------
   State
------------------------------------------------------------- */
let usersCache = [];
let editingUserId = null;

// modal renovações por usuário
let currentRenewalsUserId = null;
let renewalsModalInstance = null;

// sino / pendências
let pendingModalInstance = null;

/* -------------------------------------------------------------
   Pending renewals (sininho)
------------------------------------------------------------- */
function getRenewalsBadgeEl() {
  return document.getElementById('renewalsBadge');
}

async function refreshRenewalsBadge() {
  const badge = getRenewalsBadgeEl();
  if (!badge) return;

  try {
    const res = await adminFetch('/api/admin/renewals/pending', { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;

    const count = Number(data.pendingCount || 0);
    badge.textContent = String(count);
    badge.classList.toggle('d-none', count === 0);
  } catch (e) {
    // silêncio no polling (exceto o 401 que já tratamos no adminFetch)
  }
}

async function openPendingRenewalsModal() {
  const modalEl = document.getElementById('pendingRenewalsModal');
  const tbody = document.getElementById('pendingRenewalsTableBody');
  if (!modalEl || !tbody) return;

  // instancia modal
  if (!pendingModalInstance) {
    pendingModalInstance = new bootstrap.Modal(modalEl);
  }

  // loading
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-muted py-3">Carregando...</td>
    </tr>
  `;

  try {
    const res = await adminFetch('/api/admin/renewals/pending', { method: 'GET' });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger py-3">
            Erro ao carregar pendências: ${escapeHtml(data.error || 'Erro desconhecido')}
          </td>
        </tr>
      `;
      pendingModalInstance.show();
      return;
    }

    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted py-3">
            Nenhuma renovação pendente no período atual.
          </td>
        </tr>
      `;
      pendingModalInstance.show();
      return;
    }

    tbody.innerHTML = '';
    items.forEach((it) => {
      const tr = document.createElement('tr');

      const createdAt = formatDateTimeBR(it.createdAt);
      const nome = escapeHtml(it?.user?.nome || '-');
      const email = escapeHtml(it?.user?.email || '-');
      const validade = escapeHtml(it?.user?.validade || '-');
      const obs = it.mensagem ? escapeHtml(truncate(it.mensagem, 80)) : '';

      tr.innerHTML = `
        <td>${createdAt}</td>
        <td>${nome}</td>
        <td>${email}</td>
        <td>${validade}</td>
        <td>${obs ? `<span title="${escapeHtml(it.mensagem)}">${obs}</span>` : '<span class="text-muted small">-</span>'}</td>
        <td>
          <a href="${it.proofUrl}" target="_blank" class="btn btn-outline-secondary btn-sm">
            Abrir
          </a>
        </td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-success" onclick="approveRenewal('${it.id}')">Aprovar</button>
            <button type="button" class="btn btn-outline-danger" onclick="rejectRenewal('${it.id}')">Rejeitar</button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    pendingModalInstance.show();
  } catch (e) {
    if (e?.message === 'ADMIN_UNAUTHORIZED') return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger py-3">
          Erro ao carregar pendências.
        </td>
      </tr>
    `;
    pendingModalInstance.show();
  }
}

/* -------------------------------------------------------------
   Carregar e renderizar usuários
------------------------------------------------------------- */
async function loadUsers() {
  const tbody = document.getElementById('userList');

  // agora são 8 colunas
  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center text-muted py-3">
        Carregando usuários...
      </td>
    </tr>
  `;

  try {
    const res = await adminFetch('/api/admin/users', { method: 'GET' });
    const data = await res.json().catch(() => ([]));

    if (!res.ok) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-danger py-3">
            Erro ao carregar usuários: ${escapeHtml(data.error || 'Erro desconhecido')}
          </td>
        </tr>
      `;
      return;
    }

    usersCache = (Array.isArray(data) ? data : []).map((u) => ({
      ...u,
      _isExpired: computeIsExpired(u.validade),
    }));

    renderUserTable();
  } catch (err) {
    if (err?.message === 'ADMIN_UNAUTHORIZED') return;

    console.error('Erro ao carregar usuários:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-danger py-3">
          Erro ao carregar usuários.
        </td>
      </tr>
    `;
  }
}

function renderUserTable() {
  const tbody = document.getElementById('userList');
  const badgeCount = document.getElementById('userCountBadge');

  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('statusFilter')?.value || 'all';

  const filtered = usersCache.filter((user) => {
    const text = `${user.nome || ''} ${user.email || ''} ${user.matricula || ''}`.toLowerCase();
    if (search && !text.includes(search)) return false;

    if (statusFilter === 'expired') return user._isExpired === true;
    if (statusFilter !== 'all') return user.status === statusFilter;

    return true;
  });

  if (badgeCount) badgeCount.textContent = `${filtered.length} usuário(s)`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-3">
          Nenhum usuário encontrado com os filtros atuais.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';

  filtered.forEach((user) => {
    const tr = document.createElement('tr');

    let statusClass = 'secondary';
    if (user.status === 'active') statusClass = 'success';
    else if (user.status === 'pending') statusClass = 'warning';
    else if (user.status === 'inactive') statusClass = 'secondary';

    const statusBadge = `<span class="badge bg-${statusClass}">${escapeHtml(user.status || '')}</span>`;
    const expiredBadge = user._isExpired ? '<span class="badge bg-danger ms-1">expirada</span>' : '';

    const createdAt = formatDateBR(user.created_at);

    tr.innerHTML = `
      <td>${escapeHtml(user.nome || '')}</td>
      <td>${escapeHtml(user.email || '')}</td>
      <td>${statusBadge}</td>
      <td>${escapeHtml(user.numero_tel || '')}</td>
      <td>${escapeHtml(user.validade || '')} ${expiredBadge}</td>
      <td>${createdAt}</td>
      <td>
        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="viewRenewals('${user.id}')">
          Ver pedidos
        </button>
      </td>
      <td>
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-outline-primary" onclick="editUser('${user.id}')">Editar</button>
          <button type="button" class="btn btn-outline-success" onclick="changeStatus('${user.id}', 'active')">Ativar</button>
          <button type="button" class="btn btn-outline-warning" onclick="changeStatus('${user.id}', 'inactive')">Inativar</button>
          <button type="button" class="btn btn-outline-danger" onclick="deleteUser('${user.id}')">Excluir</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* -------------------------------------------------------------
   Formulário de cadastro / edição
------------------------------------------------------------- */
function preencherFormComUsuario(user) {
  const form = document.getElementById('registerForm');

  form.userId.value = user.id;
  form.nome.value = user.nome || '';
  form.nomePerfil.value = user.nome_perfil || '';
  form.email.value = user.email || '';
  form.curso.value = user.curso || '';
  form.campus.value = user.campus || '';
  form.matricula.value = user.matricula || '';
  form.cpf.value = user.cpf || '';
  form.numeroTel.value = user.numero_tel || '';
  form.dataNascimento.value = user.data_nascimento || '';
  form.validade.value = user.validade || '';
  form.password.value = '';
  if (form.foto) form.foto.value = '';
}

function resetForm() {
  const form = document.getElementById('registerForm');
  form.reset();
  form.userId.value = '';
  if (form.foto) form.foto.value = '';
  editingUserId = null;

  document.getElementById('submitBtn').textContent = 'Registrar';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

async function handleRegisterSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const isEditing = !!editingUserId;
  const fotoInput = form.foto;

  const formData = new FormData();

  formData.append('nome', form.nome.value.trim());
  formData.append('nomePerfil', form.nomePerfil.value.trim());
  formData.append('email', form.email.value.trim());
  formData.append('curso', form.curso.value.trim());
  formData.append('campus', form.campus.value.trim());
  formData.append('matricula', form.matricula.value.trim());
  formData.append('cpf', form.cpf.value.trim());
  formData.append('numeroTel', form.numeroTel.value.trim());
  formData.append('dataNascimento', form.dataNascimento.value);
  if (form.validade.value) formData.append('validade', form.validade.value);

  if (!isEditing) {
    if (!form.password.value) {
      showAlert('Senha é obrigatória para novo usuário.', 'warning');
      return;
    }
    formData.append('password', form.password.value);
  } else if (form.password.value) {
    formData.append('password', form.password.value);
  }

  if (!isEditing && (!fotoInput.files || !fotoInput.files[0])) {
    showAlert('Selecione uma foto para o usuário.', 'warning');
    return;
  }

  if (fotoInput.files && fotoInput.files[0]) {
    formData.append('foto', fotoInput.files[0]);
  }

  try {
    const url = isEditing ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await adminFetch(url, { method, body: formData });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showAlert(data.error || 'Erro ao salvar usuário.', 'error');
      return;
    }

    showAlert(isEditing ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!', 'success');

    resetForm();
    loadUsers();
  } catch (err) {
    if (err?.message === 'ADMIN_UNAUTHORIZED') return;

    console.error('Erro ao salvar usuário:', err);
    showAlert('Erro ao salvar usuário. Tente novamente.', 'error');
  }
}

/* -------------------------------------------------------------
   Ações da tabela
------------------------------------------------------------- */
window.editUser = function (id) {
  const user = usersCache.find((u) => u.id === id);
  if (!user) {
    showAlert('Usuário não encontrado.', 'error');
    return;
  }

  editingUserId = id;
  preencherFormComUsuario(user);

  document.getElementById('submitBtn').textContent = 'Salvar alterações';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
};

window.changeStatus = async function (id, newStatus) {
  if (!confirm(`Deseja realmente alterar o status para "${newStatus}"?`)) return;

  try {
    const res = await adminFetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showAlert(data.error || 'Erro ao alterar status.', 'error');
      return;
    }

    showAlert('Status atualizado com sucesso!', 'success');
    loadUsers();
  } catch (err) {
    if (err?.message === 'ADMIN_UNAUTHORIZED') return;

    console.error('Erro ao alterar status:', err);
    showAlert('Erro ao alterar status.', 'error');
  }
};

window.deleteUser = async function (id) {
  if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

  try {
    const res = await adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' });

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      showAlert(data.error || 'Erro ao excluir usuário.', 'error');
      return;
    }

    showAlert('Usuário excluído com sucesso.', 'success');
    loadUsers();
  } catch (err) {
    if (err?.message === 'ADMIN_UNAUTHORIZED') return;

    console.error('Erro ao excluir usuário:', err);
    showAlert('Erro ao excluir usuário.', 'error');
  }
};

/* -------------------------------------------------------------
   Renovações por usuário (modal)
------------------------------------------------------------- */
window.viewRenewals = async function (userId) {
  currentRenewalsUserId = userId;
  const tbody = document.getElementById('renewalsTableBody');

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center text-muted py-3">
        Carregando renovações...
      </td>
    </tr>
  `;

  try {
    const res = await adminFetch(`/api/admin/users/${userId}/renewals`, { method: 'GET' });
    const data = await res.json().catch(() => ([]));

    if (!res.ok) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger py-3">
            Erro ao carregar renovações: ${escapeHtml(data.error || 'Erro desconhecido')}
          </td>
        </tr>
      `;
    } else {
      renderRenewalsTable(Array.isArray(data) ? data : []);
    }
  } catch (err) {
    if (err?.message === 'ADMIN_UNAUTHORIZED') return;

    console.error('Erro ao carregar renovações:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger py-3">
          Erro ao carregar renovações.
        </td>
      </tr>
    `;
  }

  if (!renewalsModalInstance) {
    const modalElement = document.getElementById('renewalsModal');
    renewalsModalInstance = new bootstrap.Modal(modalElement);
  }
  renewalsModalInstance.show();
};

function renderRenewalsTable(renewals) {
  const tbody = document.getElementById('renewalsTableBody');

  if (!renewals.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-3">
          Nenhum pedido de renovação encontrado para este usuário.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';

  renewals.forEach((r) => {
    const tr = document.createElement('tr');

    const createdDate = r.created_at ? formatDateTimeBR(r.created_at) : '-';

    let statusBadgeClass = 'secondary';
    if (r.status === 'pending') statusBadgeClass = 'warning';
    else if (r.status === 'approved') statusBadgeClass = 'success';
    else if (r.status === 'rejected') statusBadgeClass = 'danger';

    const fullObs = r.mensagem || '';
    const obsShort = truncate(fullObs, 80);
    const obsCell = fullObs
      ? `<span title="${escapeHtml(fullObs)}">${escapeHtml(obsShort)}</span>`
      : '<span class="text-muted small">-</span>';

    tr.innerHTML = `
      <td>${createdDate}</td>
      <td><span class="badge bg-${statusBadgeClass}">${escapeHtml(r.status || '')}</span></td>
      <td>
        <a href="${r.proof_url}" target="_blank" class="btn btn-outline-secondary btn-sm">
          Abrir comprovante
        </a>
      </td>
      <td>${obsCell}</td>
      <td>
        ${
          r.status === 'pending'
            ? `<div class="btn-group btn-group-sm" role="group">
                 <button type="button" class="btn btn-outline-success" onclick="approveRenewal('${r.id}')">Aprovar</button>
                 <button type="button" class="btn btn-outline-danger" onclick="rejectRenewal('${r.id}')">Rejeitar</button>
               </div>`
            : '<span class="text-muted small">Nenhuma ação</span>'
        }
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* -------------------------------------------------------------
   Aprovar / Rejeitar (reusa endpoints do backend)
------------------------------------------------------------- */
window.approveRenewal = async function (renewalId) {
  if (!confirm('Aprovar esta renovação? A validade será ajustada para o próximo semestre e o usuário ficará ativo.')) {
    return;
  }

  try {
    const res = await adminFetch(`/api/admin/renewals/${renewalId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showAlert(data.error || 'Erro ao aprovar renovação.', 'error');
      return;
    }

    showAlert('Renovação aprovada e validade atualizada.', 'success');

    // atualiza lista e badges
    await loadUsers();
    await refreshRenewalsBadge();

    // se estiver com algum modal aberto, recarrega conteúdo
    if (pendingModalInstance) {
      const modalEl = document.getElementById('pendingRenewalsModal');
      if (modalEl?.classList.contains('show')) {
        await openPendingRenewalsModal();
      }
    }

    if (currentRenewalsUserId) {
      viewRenewals(currentRenewalsUserId);
    }
  } catch (err) {
    if (err?.message === 'ADMIN_UNAUTHORIZED') return;

    console.error('Erro ao aprovar renovação:', err);
    showAlert('Erro ao aprovar renovação.', 'error');
  }
};

window.rejectRenewal = async function (renewalId) {
  if (!confirm('Rejeitar esta renovação?')) return;

  try {
    const res = await adminFetch(`/api/admin/renewals/${renewalId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showAlert(data.error || 'Erro ao rejeitar renovação.', 'error');
      return;
    }

    showAlert('Renovação rejeitada.', 'success');

    await refreshRenewalsBadge();

    // recarrega os modais se estiverem abertos
    if (pendingModalInstance) {
      const modalEl = document.getElementById('pendingRenewalsModal');
      if (modalEl?.classList.contains('show')) {
        await openPendingRenewalsModal();
      }
    }
    if (currentRenewalsUserId) {
      viewRenewals(currentRenewalsUserId);
    }
  } catch (err) {
    if (err?.message === 'ADMIN_UNAUTHORIZED') return;

    console.error('Erro ao rejeitar renovação:', err);
    showAlert('Erro ao rejeitar renovação.', 'error');
  }
};

/* -------------------------------------------------------------
   Bootstrap inicial
------------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  if (!solicitarSenhaAdmin()) return;

  // Ações do sino
  const bellBtn = document.getElementById('renewalsBell');
  if (bellBtn) {
    bellBtn.addEventListener('click', openPendingRenewalsModal);
  }

  // load inicial
  loadUsers();
  refreshRenewalsBadge();

  // polling do badge (20s)
  setInterval(refreshRenewalsBadge, 20000);

  // form
  const registerForm = document.getElementById('registerForm');
  registerForm.addEventListener('submit', handleRegisterSubmit);

  document.getElementById('cancelEditBtn').addEventListener('click', resetForm);

  document.getElementById('searchInput').addEventListener('input', renderUserTable);
  document.getElementById('statusFilter').addEventListener('change', renderUserTable);
});
