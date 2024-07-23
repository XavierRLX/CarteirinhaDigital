document.getElementById('acessarCarteirinha').addEventListener('click', function () {
    const nome = userInfo.nomePerfil;
    const data = new Date().toLocaleDateString('pt-BR');
    const hora = new Date().toLocaleTimeString('pt-BR');
  
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        document.getElementById('modal').style.display = 'flex';
        document.getElementById('menu').style.display = 'none';
        getLocationAndSendEmail(nome, data, hora);
      }, error => {
        console.error('Erro ao obter localização:', error);
        alert('Ative a localização!');
      });
    } else {
      alert('Geolocalização não é suportada pelo seu navegador.');
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