import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Users, Check, X } from 'lucide-react';

const Salas = () => {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalas();
  }, []);

  const loadSalas = async () => {
    try {
      const response = await api.get('/salas/');
      setSalas(response.data);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Salas</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {salas.map((sala) => (
          <div key={sala.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {sala.nome}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    Capacidade: {sala.capacidade} pessoas
                  </div>
                </div>
              </div>

              {sala.recursos && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recursos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {sala.recursos.split(',').map((recurso, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {recurso.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  {sala.ativa ? (
                    <>
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-700">Disponível</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-700">Indisponível</span>
                    </>
                  )}
                </div>
                
                <a
                  href={`/nova-reserva?sala=${sala.id}`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  Reservar
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {salas.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma sala encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Não há salas cadastradas no sistema.
          </p>
        </div>
      )}
    </div>
  );
};

export default Salas;
