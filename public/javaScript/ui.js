// ui.js - componente simples de alertas reutilizáveis usando Bootstrap

(function () {
  /**
   * Exibe um alerta flutuante no canto superior direito.
   * type: 'success' | 'error' | 'warning' | 'info'
   */
  function showAlert(message, type = 'info', timeout = 4000) {
    const containerId = 'alert-container';
    let container = document.getElementById(containerId);

    // Se não existir o container, cria
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className =
        'position-fixed top-0 end-0 p-3 d-flex flex-column gap-2';
      container.style.zIndex = '2000';
      document.body.appendChild(container);
    }

    const alertDiv = document.createElement('div');

    const bsType = {
      success: 'success',
      error: 'danger',
      warning: 'warning',
      info: 'info',
    }[type] || 'info';

    alertDiv.className =
      'alert alert-' + bsType + ' shadow-sm mb-0 fade show';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.textContent = message;

    container.appendChild(alertDiv);

    // remove sozinho depois do timeout
    setTimeout(() => {
      alertDiv.classList.remove('show');
      alertDiv.classList.add('hide');
      setTimeout(() => {
        alertDiv.remove();
        if (container.children.length === 0) {
          container.remove();
        }
      }, 150);
    }, timeout);
  }

  // expõe globalmente
  window.showAlert = showAlert;
})();
