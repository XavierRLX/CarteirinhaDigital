const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  // Validação de dados (adicione suas validações aqui)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Erro no cadastro:', error);
    // Exibir mensagem de erro para o usuário
  } else {
    console.log('Cadastro realizado com sucesso!');
    // Redirecionar para a tela de login ou outra página
  }
});
