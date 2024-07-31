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

     const validadeDate = new Date (userInfo.validade);
     const today = new Date();

     if (validadeDate < today) {
        document.getElementById('validade').style.color = 'red' ;
     }
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

     const validadeDate = new Date (userInfo.validade);
     const today = new Date();

     if (validadeDate < today) {
        document.getElementById('validadeModal').style.color = 'red' ;
     }
 } ;