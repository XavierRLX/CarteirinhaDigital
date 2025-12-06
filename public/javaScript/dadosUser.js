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

  // flag vinda da API OU cálculo local pela data
  const isExpired =
    user.isExpired === true ||
    (validadeDate && validadeDate < today);

  if (!isExpired) {
    return;
  }

  // desabilita botão "Acessar Carteirinha"
  const btnAcessar = document.getElementById('abrirCarteirinha');
  if (btnAcessar) {
    btnAcessar.style.opacity = '0.5';
    btnAcessar.style.pointerEvents = 'none';
  }

  // mostra modal de carteirinha expirada, se existir no HTML
  const modalExp = document.getElementById('modalExpirada');
  if (modalExp) {
    modalExp.style.display = 'flex';
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
});
