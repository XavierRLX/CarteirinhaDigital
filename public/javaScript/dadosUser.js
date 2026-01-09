// dadosUser.js

document.addEventListener('DOMContentLoaded', async () => {
  const stored = localStorage.getItem('userInfo');
  if (!stored) {
    alert('Você precisa fazer login novamente.');
    window.location.href = '/login';
    return;
  }

  let userInfo;
  try {
    userInfo = JSON.parse(stored);
  } catch (e) {
    console.error('Erro ao ler userInfo do localStorage:', e);
    alert('Erro ao carregar dados do usuário. Faça login novamente.');
    window.location.href = '/login';
    return;
  }

  if (!userInfo.email) {
    alert('Dados do usuário incompletos. Faça login novamente.');
    window.location.href = '/login';
    return;
  }

  // snapshot do momento do login
  preencherCarteirinha(userInfo);
  preencherModal(userInfo);
  window.currentUser = userInfo;

  // tenta buscar dados atualizados no backend (se tiver id)
  if (!userInfo.id) {
    console.warn('userInfo.id está vazio; usando apenas dados locais.');
    aplicarRegrasDeExpiracao(userInfo);
    return;
  }

  try {
    const resp = await fetch(`/api/me/${encodeURIComponent(userInfo.id)}`);
    const body = await resp.json().catch(() => ({}));

    if (resp.ok && body.user) {
      // atualiza com dados frescos do banco
      userInfo = body.user;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      window.currentUser = userInfo;

      preencherCarteirinha(userInfo);
      preencherModal(userInfo);
    } else if (resp.status === 403) {
      alert(body.error || 'Seu cadastro não está ativo.');
      window.location.href = '/login';
      return;
    } else if (resp.status === 404) {
      console.warn('Usuário não encontrado no /api/me. Usando dados locais.');
    } else if (!resp.ok) {
      console.warn('Falha ao atualizar dados do /api/me:', body.error || resp.status);
    }
  } catch (err) {
    console.warn('Erro ao chamar /api/me, usando dados locais:', err);
  }

  // no final, aplica sempre a regra de expiração com a melhor info que tivermos
  aplicarRegrasDeExpiracao(userInfo);
});

function preencherCarteirinha(user) {
  document.getElementById('nome').textContent = user.nomePerfil || '';
  document.getElementById('email').textContent = user.email || '';
  document.getElementById('imgUsu').src = user.fotoUrl || '';
  document.getElementById('numeroTel').textContent = formatNumeroTel(user.numeroTel || '');
  document.getElementById('curso').textContent = user.curso || '';
  document.getElementById('matricula').textContent = formatMatricula(user.matricula || '');
  document.getElementById('validade').textContent = formatValidade(user.validade || '');

  const validadeDate = user.validade ? new Date(user.validade) : null;
  const today = new Date();

  if (validadeDate && validadeDate < today) {
    document.getElementById('validade').style.color = 'red';
  } else {
    document.getElementById('validade').style.color = '';
  }
}

function preencherModal(user) {
  document.getElementById('fotoUrlModal').src = user.fotoUrl || '';
  document.getElementById('nomeCompletoModal').textContent = user.nome || '';
  document.getElementById('cpfModal').textContent = formatCPF(user.cpf || '');
  document.getElementById('dataNascimentoModal').textContent = formatDate(user.dataNascimento || '');
  document.getElementById('matriculaModal').textContent = formatMatricula(user.matricula || '');
  document.getElementById('validadeModal').textContent = formatValidade(user.validade || '');
  document.getElementById('cursoModal').textContent = user.curso || '';
  document.getElementById('campusModal').textContent = user.campus || '';

  const validadeDate = user.validade ? new Date(user.validade) : null;
  const today = new Date();

  if (validadeDate && validadeDate < today) {
    document.getElementById('validadeModal').style.color = 'red';
  } else {
    document.getElementById('validadeModal').style.color = '';
  }
}

function aplicarRegrasDeExpiracao(user) {
  const validadeDate = user.validade ? new Date(user.validade) : null;
  const today = new Date();

  const isExpired =
    user.isExpired === true ||
    (validadeDate && validadeDate < today);

  if (!isExpired) {
    return;
  }

  const btnAcessar = document.getElementById('abrirCarteirinha');
  if (btnAcessar) {
    btnAcessar.style.opacity = '0.5';
    btnAcessar.style.pointerEvents = 'none';
  }

  const modalExp = document.getElementById('modalExpirada');
  if (modalExp) {
    modalExp.style.display = 'flex';
  }
}

// listeners específicos do modal de carteirinha expirada + Meus Dados
document.addEventListener('DOMContentLoaded', () => {
  const modalExp = document.getElementById('modalExpirada');
  const btnRenovar = document.getElementById('btnRenovarCarteirinha');
  const btnFechar = document.getElementById('btnFecharExpirada');

  if (btnRenovar) {
    btnRenovar.addEventListener('click', () => {
      window.location.href = '/renovacaoCarteirinha';
    });
  }

  if (btnFechar) {
    btnFechar.addEventListener('click', () => {
      if (modalExp) {
        modalExp.style.display = 'none';
      }
    });
  }

  // --- NOVO: modal "Meus dados" ---
  const btnMeusDados = document.getElementById('btnMeusDados');
  const modalMeusDados = document.getElementById('modalMeusDados');
  const closeModalMeusDados = document.getElementById('closeModalMeusDados');
  const formMeusDados = document.getElementById('formMeusDados');

  if (btnMeusDados && modalMeusDados && formMeusDados) {
    btnMeusDados.addEventListener('click', () => {
      const user = window.currentUser;
      if (!user) {
        alert('Dados do usuário não encontrados. Faça login novamente.');
        window.location.href = '/login';
        return;
      }

      formMeusDados.nomeCompleto.value = user.nome || '';
      formMeusDados.nomePerfil.value = user.nomePerfil || '';
      formMeusDados.curso.value = user.curso || '';
      formMeusDados.campus.value = user.campus || '';

      modalMeusDados.style.display = 'flex';
    });

    if (closeModalMeusDados) {
      closeModalMeusDados.addEventListener('click', () => {
        modalMeusDados.style.display = 'none';
      });
    }

    window.addEventListener('click', (event) => {
      if (event.target === modalMeusDados) {
        modalMeusDados.style.display = 'none';
      }
    });

    formMeusDados.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = window.currentUser;
  if (!user || !user.id) {
    alert('Não foi possível identificar o usuário. Faça login novamente.');
    window.location.href = '/login';
    return;
  }

  // payload alinhado com o backend (server.js -> PUT /api/me/:id)
  const payload = {
    nome: formMeusDados.nomeCompleto.value.trim(),
    nomePerfil: formMeusDados.nomePerfil.value.trim(),
    curso: formMeusDados.curso.value.trim(),
    campus: formMeusDados.campus.value.trim(),
  };

  try {
    const resp = await fetch(`/api/me/${encodeURIComponent(user.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('Erro na atualização de perfil:', resp.status, body);
      alert(body.error || `Erro ao atualizar dados. Código: ${resp.status}`);
      return;
    }

    // Atualiza cache local e UI
    window.currentUser = body.user;
    localStorage.setItem('userInfo', JSON.stringify(body.user));

    preencherCarteirinha(body.user);
    preencherModal(body.user);

    modalMeusDados.style.display = 'none';
    alert('Dados atualizados com sucesso.');
  } catch (err) {
    console.error('Erro ao atualizar dados (network/fetch):', err);
    alert('Erro ao atualizar dados. Tente novamente.');
  }
});


  }
});

// botão principal para abrir carteirinha
document
  .getElementById('abrirCarteirinha')
  .addEventListener('click', function () {
    const user = window.currentUser;
    if (!user) {
      alert('Dados do usuário não encontrados. Faça login novamente.');
      window.location.href = '/login';
      return;
    }

    document.getElementById('modal').style.display = 'flex';
    document.getElementById('menu').style.display = 'none';
  });

document.getElementById('closeModalBtn').addEventListener('click', function () {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('menu').style.display = 'inline';
});

window.addEventListener('click', function (event) {
  if (event.target === document.getElementById('modal')) {
    document.getElementById('modal').style.display = 'none';
  }
});

// Aviso
document.getElementById('btnAviso').addEventListener('click', function () {
  document.getElementById('aviso').style.display = 'none';
});
