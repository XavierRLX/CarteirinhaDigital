 // Recupera as informações do usuário do localStorage e exibe na página
 const userInfo = JSON.parse(localStorage.getItem('userInfo'));
 if (userInfo) {
     document.getElementById('nome').innerHTML = `${userInfo.nomePerfil} `;
     document.getElementById('email').innerHTML = `${userInfo.email} `;
     document.getElementById('imgUsu').src = userInfo.fotoUrl;
     document.getElementById('numeroTel').innerHTML = formatNumeroTel(userInfo.numeroTel);
     document.getElementById('curso').innerHTML = `${userInfo.curso} `;
     document.getElementById('validade').innerHTML = formatValidade(userInfo.validade);
     document.getElementById('matricula').innerHTML = formatMatricula(userInfo.matricula);
 } else {
     alert('Informações do usuário não encontradas');
     window.location.href = 'cadastroUsu.html'; // Redireciona para a página de cadastro se as informações não forem encontradas
 } ;

 const userInfoModal = JSON.parse(localStorage.getItem('userInfo'));
 if (userInfo) {
     document.getElementById('fotoUrlModal').src = `${userInfoModal.fotoUrl}`
     document.getElementById('nomeCompletoModal').innerHTML = `${userInfoModal.nome}`
     document.getElementById('cpfModal').innerHTML = formatCPF(userInfo.cpf);
     document.getElementById('dataNascimentoModal').innerHTML = formatDate(userInfo.dataNascimento);
     document.getElementById('matriculaModal').innerHTML = formatMatricula(userInfo.matricula);
     document.getElementById('validadeModal').innerHTML = formatValidade(userInfo.validade);
     document.getElementById('cursoModal').innerHTML = `${userInfoModal.curso}`
     document.getElementById('campusModal').innerHTML = `${userInfoModal.campus}`
 } ;

//  document.getElementById('acessarCarteirinha').addEventListener('click', () => {
//     const nome = userInfo.nomePerfil;
//     const data = new Date().toLocaleDateString('pt-BR');
//     const hora = new Date().toLocaleTimeString('pt-BR'); 
//     sendEmailUse(nome, data, hora);
//   });