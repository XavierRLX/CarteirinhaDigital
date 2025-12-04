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

  // 1) sempre preenche a tela com o snapshot do login
  preencherCarteirinha(userInfo);
  preencherModal(userInfo);
  window.currentUser = userInfo;

  // 2) tenta buscar dados atualizados no backend (se tiver id)
  if (!userInfo.id) {
    console.warn('userInfo.id está vazio; usando apenas dados locais.');
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
      return;
    }

    // se o backend disser que não está mais ativo, aí sim derruba o acesso
    if (resp.status === 403) {
      alert(body.error || 'Seu cadastro não está ativo.');
      window.location.href = '/login';
      return;
    }

    if (resp.status === 404) {
      console.warn('Usuário não encontrado no /api/me. Usando dados locais.');
      // não derruba o usuário, só segue com o que veio do login
      return;
    }

    console.warn('Falha ao atualizar dados do /api/me:', body.error || resp.status);
  } catch (err) {
    console.warn('Erro ao chamar /api/me, usando dados locais:', err);
  }
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
  }
}
