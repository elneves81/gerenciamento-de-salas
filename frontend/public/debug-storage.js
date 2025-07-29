// Configuração de localStorage para debug
window.debugLocalStorage = () => {
  console.log('=== DEBUG LOCALSTORAGE ===');
  
  // Listar todas as chaves
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value);
  }
  
  // Verificar chaves específicas
  const keys = ['accessToken', 'refreshToken', 'user'];
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value);
    
    if (value && value !== 'undefined') {
      try {
        const parsed = JSON.parse(value);
        console.log(`${key} parsed:`, parsed);
      } catch (e) {
        console.error(`Erro ao fazer parse de ${key}:`, e);
      }
    }
  });
};

// Limpar localStorage problemático
window.clearProblematicData = () => {
  const keys = ['accessToken', 'refreshToken', 'user'];
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value === 'undefined' || value === null || value === '') {
      localStorage.removeItem(key);
      console.log(`Removido ${key} problemático`);
    }
  });
};

// Auto-executar limpeza
window.clearProblematicData();

console.log('Debug localStorage carregado. Use window.debugLocalStorage() para debugar.');
