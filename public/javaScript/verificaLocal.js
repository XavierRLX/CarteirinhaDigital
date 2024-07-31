// Função para verificar e pedir permissão para acessar a localização
function checkAndRequestLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          // A localização está ativa
          console.log("Localização ativada. Latitude: " + position.coords.latitude + ", Longitude: " + position.coords.longitude);
        },
        function(error) {
          if (error.code === error.PERMISSION_DENIED) {
            // Permissão negada, solicitar permissão
            requestLocationPermission();
          }
        }
      );
    } else {
      console.log("Geolocalização não está disponível neste navegador.");
    }
  }
  
  // Função para solicitar permissão para acessar a localização
  function requestLocationPermission() {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        // Permissão concedida
        console.log("Permissão concedida. Latitude: " + position.coords.latitude + ", Longitude: " + position.coords.longitude);
      },
      function(error) {
        if (error.code === error.PERMISSION_DENIED) {
          console.log("Permissão negada pelo usuário.");
        } else {
          console.log("Erro ao tentar obter a localização: " + error.message);
        }
      }
    );
  }
  
  // Chamar a função para verificar e pedir permissão assim que a página carregar
  window.onload = checkAndRequestLocation;
  