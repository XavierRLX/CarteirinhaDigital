function sendEmailUse(nome, data, hora) {
    const email = "renanlima2000.aer@gmail.com";
    console.log('Dados para envio:', { email, nome, data, hora });
  
    fetch('/email/useCarteirinha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `toEmail=${email}&nome=${nome}&data=${data}&hora=${hora}`
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro no envio do email');
      }
      return response.text();
    })
    .then(message => {
      console.log('Email enviado:', message);
    })
    .catch(error => {
      console.error('Erro no envio do email:', error);
    });
  }
  