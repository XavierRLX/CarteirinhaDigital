function sendEmailUse(nome, data, hora, latitude, longitude) {
  const email = "renanlima2000.aer@gmail.com";
  console.log('Dados para envio:', { email, nome, data, hora, latitude, longitude });

  fetch('/email/useCarteirinha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `toEmail=${email}&nome=${nome}&data=${data}&hora=${hora}&latitude=${latitude}&longitude=${longitude}`
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

function getLocationAndSendEmail(nome, data, hora) {
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    sendEmailUse(nome, data, hora, latitude, longitude);
  }, error => {
    console.error('Erro ao obter localização:', error);
    alert('Ative a localização para acessar a carteirinha.');
  });
} else {
  alert('Geolocalização não é suportada pelo seu navegador.');
}
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
  } else {
    console.log("Geolocalização não é suportada neste navegador.");
  }
}

function showPosition(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

  // Aqui você pode usar a localização como necessário, por exemplo, enviar para o servidor
  sendLocationToServer(latitude, longitude);
}

function showError(error) {
  switch(error.code) {
    case error.PERMISSION_DENIED:
      console.log("Usuário recusou a solicitação de geolocalização.");
      break;
    case error.POSITION_UNAVAILABLE:
      console.log("Informações de localização não disponíveis.");
      break;
    case error.TIMEOUT:
      console.log("A solicitação para obter a localização expirou.");
      break;
    case error.UNKNOWN_ERROR:
      console.log("Ocorreu um erro desconhecido.");
      break;
  }
}

function sendLocationToServer(latitude, longitude) {
  // Envie a localização para o servidor usando fetch ou outra técnica
  fetch('/saveLocation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ latitude, longitude })
  })
  .then(response => response.text())
  .then(message => {
    console.log('Localização enviada:', message);
  })
  .catch(error => {
    console.error('Erro ao enviar localização:', error);
  });
}

// Chame getUserLocation quando necessário
getUserLocation();
