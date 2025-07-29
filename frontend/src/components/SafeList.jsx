import React from 'react';

const SafeList = ({ 
  items = [], 
  renderItem, 
  emptyMessage = "Nenhum item encontrado",
  errorMessage = "Erro ao carregar dados",
  className = ""
}) => {
  // Garantir que items é sempre um array
  const safeItems = React.useMemo(() => {
    if (Array.isArray(items)) {
      return items;
    }
    
    if (items && typeof items === 'object') {
      // Tentar converter objeto em array
      const values = Object.values(items);
      return values.filter(item => item && typeof item === 'object');
    }
    
    return [];
  }, [items]);

  // Se não há renderItem, retornar erro
  if (!renderItem || typeof renderItem !== 'function') {
    return (
      <div className={`text-center py-8 text-red-600 ${className}`}>
        <p>Erro: função de renderização não fornecida</p>
      </div>
    );
  }

  // Se não há itens, mostrar mensagem vazia
  if (safeItems.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Renderizar lista com error boundary para cada item
  try {
    return (
      <div className={className}>
        {safeItems.map((item, index) => {
          try {
            return (
              <div key={item.id || item.key || index}>
                {renderItem(item, index)}
              </div>
            );
          } catch (error) {
            console.error('Erro ao renderizar item:', error, item);
            return (
              <div key={`error-${index}`} className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                <p>Erro ao renderizar item {index + 1}</p>
              </div>
            );
          }
        })}
      </div>
    );
  } catch (error) {
    console.error('Erro ao renderizar lista:', error);
    return (
      <div className={`text-center py-8 text-red-600 ${className}`}>
        <p>{errorMessage}</p>
      </div>
    );
  }
};

export default SafeList;
