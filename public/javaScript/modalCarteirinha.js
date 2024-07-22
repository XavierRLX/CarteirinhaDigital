document.getElementById('acessarCarteirinha').addEventListener('click', function () {
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('menu').style.display = 'none';
});

document.getElementById('acessarCarteirinha').addEventListener('click', () => {
    const nome = userInfo.nomePerfil;
    const data = new Date().toLocaleDateString('pt-BR');
    const hora = new Date().toLocaleTimeString('pt-BR'); 
    getLocationAndSendEmail(nome, data, hora);
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