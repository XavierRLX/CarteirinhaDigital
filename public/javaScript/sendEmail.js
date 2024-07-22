document.getElementById('acessarCarteirinha').addEventListener('click', () => {
  const nome = userInfo.nomePerfil;
  const data = new Date().toLocaleDateString('pt-BR');
  const hora = new Date().toLocaleTimeString('pt-BR');

  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
              .then(response => response.json())
              .then(data => {
                  const address = data.address;
                  const addressDetails = {
                      street: address.road || 'Desconhecida',
                      neighborhood: address.suburb || address.neighborhood || 'Desconhecido',
                      city: address.city || address.town || address.village || 'Desconhecida',
                      state: address.state || 'Desconhecido',
                      country: address.country || 'Desconhecido'
                  };
                  sendEmailUse(nome, data, hora, addressDetails);

                  // Mostrar o modal somente após obter a localização
                  document.getElementById('modal').style.display = 'flex';
                  document.getElementById('menu').style.display = 'none';
              })
              .catch(error => {
                  console.error('Erro ao obter dados da localização:', error);
                  alert('Erro ao obter dados da localização.');
              });

      }, error => {
          console.error('Erro ao obter localização:', error);
          alert('Ative a localização para acessar a carteirinha.');
      });
  } else {
      alert('Geolocalização não é suportada pelo seu navegador.');
  }
});

function getLocationAndSendEmail(nome, data, hora) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(response => response.json())
        .then(data => {
          console.log('Dados da localização:', data);
          const address = data.address;
          const addressDetails = {
            street: address.road || 'Desconhecida',
            neighborhood: address.suburb || address.neighborhood || 'Desconhecido',
            city: address.city || address.town || address.village || 'Desconhecida',
            state: address.state || 'Desconhecido',
            country: address.country || 'Desconhecido'
          };
          console.log('Detalhes do Endereço:', addressDetails);
          sendEmailUse(nome, data, hora, addressDetails);
        })
        .catch(error => {
          console.error('Erro ao obter dados da localização:', error);
          alert('Erro ao obter dados da localização.');
        });

    }, error => {
      console.error('Erro ao obter localização:', error);
      alert('Ative a localização para acessar a carteirinha.');
      
    });
  } else {
    alert('Geolocalização não é suportada pelo seu navegador.');
  }
}
