function sendEmailUse(nome, dia, hora, addressDetails, latitude, longitude) {
  const email = "renanlima2000.aer@gmail.com";
  console.log('Dados para envio:', { email, nome, dia, hora, addressDetails, latitude, longitude });

  const { street, neighborhood, city, state, country, houseNumber } = addressDetails;

  fetch('/email/useCarteirinha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `toEmail=${email}&nome=${nome}&data=${dia}&hora=${hora}&street=${street}&neighborhood=${neighborhood}&city=${city}&state=${state}
    &country=${country}&houseNumber=${houseNumber}&latitude=${latitude}&longitude=${longitude}`
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
};

function getLocationAndSendEmail(nome, dia, hora, latitude, longitude) {
  if (latitude !== 'Não informado' && longitude !== 'Não informado') {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
      .then(response => response.json())
      .then(data => {
        console.log('Dados da localização:', data);
        const address = data.address;
        const addressDetails = {
          houseNumber: address.house_number || 'Desconhecido',
          street: address.road || 'Desconhecida',
          neighborhood: address.suburb || address.neighborhood || 'Desconhecido',
          city: address.city || address.town || address.village || 'Desconhecida',
          state: address.state || 'Desconhecido',
          country: address.country || 'Desconhecido'
        };
        console.log('Detalhes do Endereço:', addressDetails);
        sendEmailUse(nome, dia, hora, addressDetails, latitude, longitude);
      })
      .catch(error => {
        console.error('Erro ao obter dados da localização:', error);
        const addressDetails = {
          houseNumber: 'Não informado',
          street: 'Não informado',
          neighborhood: 'Não informado',
          city: 'Não informado',
          state: 'Não informado',
          country: 'Não informado'
        };
        sendEmailUse(nome, dia, hora, addressDetails, latitude, longitude);
      });
  } else {
    const addressDetails = {
      houseNumber: 'Não informado',
      street: 'Não informado',
      neighborhood: 'Não informado',
      city: 'Não informado',
      state: 'Não informado',
      country: 'Não informado'
    };
    sendEmailUse(nome, dia, hora, addressDetails, latitude, longitude);
  }
};


