document.getElementById('abrirCarteirinha').addEventListener('click', function () {
  const nome = userInfo.nomePerfil;
  const dia = new Date().toLocaleDateString('pt-BR');
  const hora = new Date().toLocaleTimeString('pt-BR');

  // Função para processar a localização e enviar o email
  const processLocation = (latitude, longitude) => {
    getLocationAndSendEmail(nome, dia, hora, latitude, longitude);
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('menu').style.display = 'none';
  };

  // Obter localização do usuário
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      processLocation(position.coords.latitude, position.coords.longitude);
    }, error => {
      console.error('Erro ao obter localização:', error);
      alert('Por favor, permita o acesso à localização nas configurações do seu navegador...');
      processLocation('Não informado', 'Não informado');
    });
  } else {
    alert('Geolocalização não é suportada pelo seu navegador.');
    processLocation('Não informado', 'Não informado');
  }
});


document.getElementById('closeModalBtn').addEventListener('click', function () {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('menu').style.display = 'inline'
});

window.addEventListener('click', function (event) {
    if (event.target === document.getElementById('modal')) {
        document.getElementById('modal').style.display = 'none';
    }
});

//Aviso 
document.getElementById('btnAviso').addEventListener('click', function(){
    document.getElementById('aviso').style.display = 'none';
});