export const toast = {
  show(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${type === 'success' ? '✓' : '⚠'}</span> ${message}`;
    container.appendChild(t);
    setTimeout(() => {
      t.remove();
    }, 3000);
  },
  success(msg) {
    this.show(msg, 'success');
  },
  error(msg) {
    this.show(msg, 'error');
  }
};
