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

  // Snapshot do momento do login
  preencherCarteirinha(userInfo);
  preencherModal(userInfo);
  window.currentUser = userInfo;

  // Tenta buscar dados atualizados no backend (se tiver id)
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

  // Aplica regra de expiração com a melhor info que tivermos
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

  // Atualiza label de ano letivo com base na validade
  const anoLabel = document.getElementById('anoLetivoLabel');
  if (anoLabel && user.validade) {
    const [year, month] = String(user.validade).split('-');
    const m = parseInt(month, 10);
    const semestre = m <= 6 ? '1º semestre' : '2º semestre';
    anoLabel.textContent = `${semestre} · ${year}`;
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
}

function aplicarRegrasDeExpiracao(user) {
  const validadeDate = user.validade ? new Date(user.validade) : null;
  const today = new Date();

  // flag vinda da API OU cálculo local pela data
  const isExpired =
    user.isExpired === true ||
    (validadeDate && validadeDate < today);

  const statusBadge = document.getElementById('statusCarteirinha');
  const validadeEl = document.getElementById('validade');
  const validadeModalEl = document.getElementById('validadeModal');
  const btnAcessar = document.getElementById('abrirCarteirinha');
  const modalExp = document.getElementById('modalExpirada');

  if (isExpired) {
    // badge vermelha
    if (statusBadge) {
      statusBadge.textContent = 'Carteirinha expirada';
      statusBadge.classList.remove('badge-ativa');
      statusBadge.classList.add('badge-expirada');
    }

    if (validadeEl) validadeEl.style.color = 'red';
    if (validadeModalEl) validadeModalEl.style.color = 'red';

    if (btnAcessar) {
      btnAcessar.style.opacity = '0.5';
      btnAcessar.style.pointerEvents = 'none';
    }

    if (modalExp) {
      modalExp.style.display = 'flex';
    }
  } else {
    // badge verde
    if (statusBadge) {
      statusBadge.textContent = 'Carteirinha ativa';
      statusBadge.classList.remove('badge-expirada');
      statusBadge.classList.add('badge-ativa');
    }

    if (validadeEl) validadeEl.style.color = '';
    if (validadeModalEl) validadeModalEl.style.color = '';

    if (btnAcessar) {
      btnAcessar.style.opacity = '1';
      btnAcessar.style.pointerEvents = 'auto';
    }

    if (modalExp) {
      modalExp.style.display = 'none';
    }
  }
}

// listeners específicos do modal de carteirinha expirada
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

  // Modal de aviso "uso acadêmico"
  const aviso = document.getElementById('aviso');
  const btnAviso = document.getElementById('btnAviso');
  if (aviso && btnAviso) {
    btnAviso.addEventListener('click', () => {
      aviso.style.display = 'none';
    });
  }

  // Abrir / fechar modal da carteirinha completa (fallback caso modalCarteirinha.js não trate)
  const abrirCarteirinha = document.getElementById('abrirCarteirinha');
  const modal = document.getElementById('modal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const menu = document.getElementById('menu');

  if (abrirCarteirinha && modal) {
    abrirCarteirinha.addEventListener('click', () => {
      const user = window.currentUser;
      if (!user) {
        alert('Dados do usuário não encontrados. Faça login novamente.');
        window.location.href = '/login';
        return;
      }
      modal.style.display = 'flex';
      if (menu) menu.style.display = 'none';
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      if (menu) menu.style.display = 'block';
    });
  }

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
      if (menu) menu.style.display = 'block';
    }
  });
});
