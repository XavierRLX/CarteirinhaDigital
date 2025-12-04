// dadosUser.js

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = localStorage.getItem('userInfo');
    let userInfo = stored ? JSON.parse(stored) : null;

    if (!userInfo || !userInfo.id) {
      alert('Você precisa fazer login novamente.');
      window.location.href = '/login';
      return;
    }

    // tenta buscar dados atualizados no backend
    try {
      const resp = await fetch(`/api/me/${userInfo.id}`);
      const body = await resp.json().catch(() => ({}));

      if (resp.ok) {
        userInfo = body.user;
        // atualiza snapshot salvo
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      } else if (resp.status === 403) {
        alert(body.error || 'Seu cadastro não está ativo.');
        window.location.href = '/login';
        return;
      } else if (resp.status === 404) {
        alert('Usuário não encontrado. Faça login novamente.');
        window.location.href = '/login';
        return;
      } else {
        console.warn('Não foi possível atualizar dados do usuário:', body.error);
        // segue usando o snapshot salvo no localStorage
      }
    } catch (e) {
      console.warn('Falha ao buscar /api/me, usando dados locais:', e);
    }

    // deixa disponível para outros scripts (abrirCarteirinha, sendEmail etc)
    window.currentUser = userInfo;

    preencherCarteirinha(userInfo);
    preencherModal(userInfo);
  } catch (err) {
    console.error('Erro ao inicializar carteirinha:', err);
    alert('Erro ao carregar dados do usuário. Faça login novamente.');
    window.location.href = '/login';
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
