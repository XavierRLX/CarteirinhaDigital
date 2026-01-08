// public/javaScript/adminUsers.js

// ⚠️ Precisa bater com ADMIN_PANEL_PASSWORD / variável de ambiente do backend
const ADMIN_STORAGE_KEY = 'adminPassword';
let ADMIN_PASSWORD = '';


let usersCache = [];
let editingUserId = null;

// controle do modal de renovações
let currentRenewalsUserId = null;
let renewalsModalInstance = null;

function getSavedAdminPassword() {
  return localStorage.getItem(ADMIN_STORAGE_KEY) || '';
}

function saveAdminPassword(password) {
  localStorage.setItem(ADMIN_STORAGE_KEY, password);
}

function clearAdminPassword() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}


/* -------------------------------------------------------------
   Helpers
------------------------------------------------------------- */

// validade < hoje => expirada
function computeIsExpired(validade) {
  if (!validade) return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return validade < todayStr;
}

// escapar HTML para evitar XSS quando exibimos observações
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// truncar texto longo
function truncate(str, max = 80) {
  if (!str) return '';
  return str.length <= max ? str : str.slice(0, max - 3) + '...';
}

// prompt simples de autenticação do painel
function solicitarSenhaAdmin() {
  // 1) tenta usar senha salva
  const saved = getSavedAdminPassword();
  if (saved) {
    ADMIN_PASSWORD = saved;
    return true;
  }

  // 2) se não tiver, pede
  const inputPassword = prompt('Por favor, insira a senha de administrador:');
  if (!inputPassword) {
    showAlert('Acesso cancelado.', 'warning');
    window.location.href = '/login';
    return false;
  }

  // 3) salva e usa
  ADMIN_PASSWORD = inputPassword;
  saveAdminPassword(inputPassword);

  return true;
}


/* -------------------------------------------------------------
   Carregar e renderizar usuários
------------------------------------------------------------- */

async function loadUsers() {
  const tbody = document.getElementById('userList');
  const badge = document.getElementById('userCountBadge');

  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-muted py-3">
        Carregando usuários...
      </td>
    </tr>
  `;

  try {
   const response = await fetch('/api/admin/users', {
  method: 'GET',
  headers: { 'x-admin-password': ADMIN_PASSWORD },
});

if (response.status === 401) {
  clearAdminPassword();
  showAlert('Senha de admin inválida. Digite novamente.', 'warning');
  window.location.reload();
  return;
}


    const data = await response.json();

    if (!response.ok) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger py-3">
            Erro ao carregar usuários: ${data.error || 'Erro desconhecido'}
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
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger py-3">
          Erro ao carregar usuários.
        </td>
      </tr>
    `;
  }
}

function renderUserTable() {
  const tbody = document.getElementById('userList');
  const badge = document.getElementById('userCountBadge');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;

  const filtered = usersCache.filter((user) => {
    const text = `${user.nome || ''} ${user.email || ''} ${user.matricula || ''}`.toLowerCase();
    if (search && !text.includes(search)) return false;

    if (statusFilter === 'expired') {
      return user._isExpired === true;
    } else if (statusFilter !== 'all') {
      return user.status === statusFilter;
    }
    return true;
  });

  badge.textContent = `${filtered.length} usuário(s)`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-3">
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

    const statusBadge = `<span class="badge bg-${statusClass}">${user.status}</span>`;
    const expiredBadge = user._isExpired
      ? '<span class="badge bg-danger ms-1">expirada</span>'
      : '';

    tr.innerHTML = `
      <td>${user.nome || ''}</td>
      <td>${user.email || ''}</td>
      <td>${statusBadge}</td>
      <td>${user.numero_tel || ''}</td>
      <td>${user.validade || ''} ${expiredBadge}</td>
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
    const url = isEditing
      ? `/api/admin/users/${editingUserId}`
      : '/api/admin/users';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'x-admin-password': ADMIN_PASSWORD,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showAlert(data.error || 'Erro ao salvar usuário.', 'error');
      return;
    }

    showAlert(
      isEditing ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!',
      'success'
    );

    resetForm();
    loadUsers();
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    showAlert('Erro ao salvar usuário. Tente novamente.', 'error');
  }
}

/* -------------------------------------------------------------
   Funções globais da tabela (usadas nos botões)
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
    const response = await fetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showAlert(data.error || 'Erro ao alterar status.', 'error');
      return;
    }

    showAlert('Status atualizado com sucesso!', 'success');
    loadUsers();
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    showAlert('Erro ao alterar status.', 'error');
  }
};

window.deleteUser = async function (id) {
  if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

  try {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        'x-admin-password': ADMIN_PASSWORD,
      },
    });

    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => ({}));
      showAlert(data.error || 'Erro ao excluir usuário.', 'error');
      return;
    }

    showAlert('Usuário excluído com sucesso.', 'success');
    loadUsers();
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    showAlert('Erro ao excluir usuário.', 'error');
  }
};

/* -------------------------------------------------------------
   Renovações (modal)
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
    const response = await fetch(`/api/admin/users/${userId}/renewals`, {
      headers: {
        'x-admin-password': ADMIN_PASSWORD,
      },
    });
    const data = await response.json().catch(() => []);

    if (!response.ok) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger py-3">
            Erro ao carregar renovações: ${data.error || 'Erro desconhecido'}
          </td>
        </tr>
      `;
    } else {
      renderRenewalsTable(Array.isArray(data) ? data : []);
    }
  } catch (err) {
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
    const createdDate = r.created_at
      ? new Date(r.created_at).toLocaleString('pt-BR')
      : '-';

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
      <td><span class="badge bg-${statusBadgeClass}">${r.status}</span></td>
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

window.approveRenewal = async function (renewalId) {
  if (!confirm('Aprovar esta renovação? A validade será ajustada para o próximo semestre e o usuário ficará ativo.')) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/renewals/${renewalId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD,
      },
      body: JSON.stringify({}),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showAlert(data.error || 'Erro ao aprovar renovação.', 'error');
      return;
    }

    showAlert('Renovação aprovada e validade atualizada.', 'success');
    await loadUsers();
    if (currentRenewalsUserId) {
      viewRenewals(currentRenewalsUserId);
    }
  } catch (err) {
    console.error('Erro ao aprovar renovação:', err);
    showAlert('Erro ao aprovar renovação.', 'error');
  }
};

window.rejectRenewal = async function (renewalId) {
  if (!confirm('Rejeitar esta renovação?')) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/renewals/${renewalId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD,
      },
      body: JSON.stringify({}),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showAlert(data.error || 'Erro ao rejeitar renovação.', 'error');
      return;
    }

    showAlert('Renovação rejeitada.', 'success');
    if (currentRenewalsUserId) {
      viewRenewals(currentRenewalsUserId);
    }
  } catch (err) {
    console.error('Erro ao rejeitar renovação:', err);
    showAlert('Erro ao rejeitar renovação.', 'error');
  }
};

/* -------------------------------------------------------------
   Bootstrap inicial
------------------------------------------------------------- */

window.addEventListener('DOMContentLoaded', () => {
  if (!solicitarSenhaAdmin()) return;

  loadUsers();

  const registerForm = document.getElementById('registerForm');
  registerForm.addEventListener('submit', handleRegisterSubmit);

  document.getElementById('cancelEditBtn').addEventListener('click', resetForm);

  document.getElementById('searchInput').addEventListener('input', renderUserTable);
  document.getElementById('statusFilter').addEventListener('change', renderUserTable);
});


