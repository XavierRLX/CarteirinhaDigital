document.getElementById('acessarCarteirinha').addEventListener('click', function () {
  const nome = userInfo.nomePerfil;
  const dia = new Date().toLocaleDateString('pt-BR');
  const hora = new Date().toLocaleTimeString('pt-BR');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      getLocationAndSendEmail(nome, dia, hora, latitude, longitude);
    }, error => {
      console.error('Erro ao obter localização:', error);
      alert('Por favor, permita o acesso à localização nas configurações do seu navegador...');
      getLocationAndSendEmail(nome, dia, hora, 'Não informado', 'Não informado');
    });
  } else {
    alert('Geolocalização não é suportada pelo seu navegador.');
    getLocationAndSendEmail(nome, dia, hora, 'Não informado', 'Não informado');
  }
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('menu').style.display = 'none';
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