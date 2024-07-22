function sendEmailUse(nome, data, hora) {
    const email = "renanlima2000.aer@gmail.com";
    fetch('/email/useCarterinha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `toEmail=${email}&nome=${nome}&data=${data}&hora=${hora}`
    })
      .then(response => response.text())
      .then(message => {
        console.log('Email enviado:', message);
      })
      .catch(error => {
        console.error('Erro no envio do email:', error);
      });
  }
  