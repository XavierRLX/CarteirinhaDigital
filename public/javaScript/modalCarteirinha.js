document
  .getElementById("abrirCarteirinha")
  .addEventListener("click", function () {
    const nome = userInfo.nomePerfil;
    const dia = new Date().toLocaleDateString("pt-BR");
    const hora = new Date().toLocaleTimeString("pt-BR");

    // Função para enviar o email
    const sendEmail = () => {
      getLocationAndSendEmail(nome, dia, hora, "Não aplicável", "Não aplicável");
      document.getElementById("modal").style.display = "flex";
      document.getElementById("menu").style.display = "none";
    };

    // Apenas enviar o email sem localização
    sendEmail();
  });

document.getElementById("closeModalBtn").addEventListener("click", function () {
  document.getElementById("modal").style.display = "none";
  document.getElementById("menu").style.display = "inline";
});

window.addEventListener("click", function (event) {
  if (event.target === document.getElementById("modal")) {
    document.getElementById("modal").style.display = "none";
  }
});

// Aviso
document.getElementById("btnAviso").addEventListener("click", function () {
  document.getElementById("aviso").style.display = "none";
});
