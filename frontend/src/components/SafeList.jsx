import React from 'react';

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
    try {
      // Primeiro, verificar se já é um array válido
      if (Array.isArray(items)) {
        return items.filter(item => item != null); // Remove null/undefined
      }
      
      // Se é null ou undefined, retornar array vazio
      if (items == null) {
        return [];
      }
      
      // Se é um objeto, tentar converter
      if (items && typeof items === 'object') {
        // Verificar se tem propriedades de array-like
        if ('length' in items && typeof items.length === 'number') {
          // Tentar converter array-like object
          try {
            return Array.from(items).filter(item => item != null);
          } catch (error) {
            console.warn('Falha ao converter array-like object:', error);
          }
        }
        
        // Tentar extrair valores do objeto
        const values = Object.values(items);
        const validValues = values.filter(item => 
          item != null && 
          typeof item === 'object' && 
          !Array.isArray(item)
        );
        
        return validValues.length > 0 ? validValues : [];
      }
      
      // Se é string, tentar fazer parse JSON
      if (typeof items === 'string' && items.trim()) {
        try {
          const parsed = JSON.parse(items.trim());
          if (Array.isArray(parsed)) {
            return parsed.filter(item => item != null);
          }
        } catch (error) {
          console.warn('Falha ao fazer parse JSON de string:', error);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao processar items em SafeList:', error, items);
      return [];
    }
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
          // Validar se o item é válido para renderização
          if (item == null) {
            return null;
          }
          
          // Gerar uma chave única e segura
          const itemKey = React.useMemo(() => {
            if (item.id !== undefined && item.id !== null) {
              return `item-${item.id}`;
            }
            if (item.key !== undefined && item.key !== null) {
              return `key-${item.key}`;
            }
            if (typeof item === 'object' && item.constructor === Object) {
              // Para objetos simples, usar uma chave baseada no conteúdo
              try {
                const keyString = JSON.stringify(item).substring(0, 50);
                return `obj-${index}-${keyString.replace(/[^a-zA-Z0-9]/g, '')}`;
              } catch (error) {
                return `obj-${index}`;
              }
            }
            return `index-${index}`;
          }, [item, index]);
          
          try {
            const renderedItem = renderItem(item, index);
            
            // Verificar se o renderItem retornou algo válido
            if (renderedItem == null) {
              return null;
            }
            
            return (
              <div key={itemKey}>
                {renderedItem}
              </div>
            );
          } catch (error) {
            console.error('Erro ao renderizar item:', error, { item, index });
            return (
              <div key={`error-${itemKey}`} className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                <p>Erro ao renderizar item {index + 1}</p>
                <details className="mt-2 text-xs">
                  <summary>Detalhes do erro</summary>
                  <pre>{error.message}</pre>
                </details>
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
        <details className="mt-2 text-xs">
          <summary>Detalhes do erro</summary>
          <pre>{error.message}</pre>
        </details>
      </div>
    );
  }
};

export default SafeList;
