document
  .getElementById("abrirCarteirinha")
  .addEventListener("click", function () {
    const user = window.currentUser;
    if (!user) {
      alert('Dados do usuário não encontrados. Faça login novamente.');
      window.location.href = '/login';
      return;
    }

    document.getElementById("modal").style.display = "flex";
    document.getElementById("menu").style.display = "none";

    // const nome = user.nomePerfil;
    // const dia = new Date().toLocaleDateString("pt-BR");
    // const hora = new Date().toLocaleTimeString("pt-BR");
    // getLocationAndSendEmail(nome, dia, hora, "Não aplicável", "Não aplicável");
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
