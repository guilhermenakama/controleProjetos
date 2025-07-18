import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Upload, Download, BarChart3, FileSpreadsheet } from 'lucide-react';

const ProjectControlChart = () => {
  const [projectName, setProjectName] = useState('Meu Projeto');
  const [initialBacklog, setInitialBacklog] = useState(50);
  const [events, setEvents] = useState([
    { id: 1, date: '2024-01-01', type: 'inicial', completed: 0, added: 50, description: 'Backlog inicial' }
  ]);
  const [newEvent, setNewEvent] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'completado',
    completed: 0,
    added: 0,
    description: ''
  });
  const [chartData, setChartData] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    generateChartData();
  }, [events, initialBacklog]);

  const generateChartData = () => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    let totalCompleted = 0;
    let totalAdded = initialBacklog;
    let remaining = initialBacklog;

    const data = sortedEvents.map((event, index) => {
      if (event.type === 'completado') {
        totalCompleted += event.completed;
        remaining -= event.completed;
      } else if (event.type === 'adicionado') {
        totalAdded += event.added;
        remaining += event.added;
      }

      return {
        date: event.date,
        dateFormatted: new Date(event.date).toLocaleDateString('pt-BR'),
        totalAdded: totalAdded,
        totalCompleted: totalCompleted,
        remaining: remaining,
        description: event.description
      };
    });

    setChartData(data);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadStatus('Carregando planilha...');
      
      // Importar SheetJS
      const XLSX = await import('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      
      // Ler o arquivo
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      
      // Pegar a primeira planilha
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      console.log('Dados carregados:', jsonData);
      
      // Processar os dados
      const processedEvents = [];
      let newInitialBacklog = initialBacklog;
      
      jsonData.forEach((row, index) => {
        // Detectar diferentes formatos de colunas
        const date = row['Data'] || row['DATE'] || row['data'] || row['Date'];
        const type = row['Tipo'] || row['TYPE'] || row['tipo'] || row['Type'];
        const completed = Number(row['Completados'] || row['COMPLETED'] || row['completados'] || row['Completed'] || 0);
        const added = Number(row['Adicionados'] || row['ADDED'] || row['adicionados'] || row['Added'] || 0);
        const description = row['Descrição'] || row['DESCRIPTION'] || row['descrição'] || row['Description'] || '';
        
        // Se for backlog inicial
        if (type === 'inicial' || type === 'INICIAL' || type === 'initial') {
          newInitialBacklog = added;
          processedEvents.push({
            id: index + 1,
            date: formatDate(date),
            type: 'inicial',
            completed: 0,
            added: added,
            description: description || 'Backlog inicial'
          });
        }
        // Se for item completado
        else if (type === 'completado' || type === 'COMPLETADO' || type === 'completed') {
          processedEvents.push({
            id: index + 1,
            date: formatDate(date),
            type: 'completado',
            completed: completed,
            added: 0,
            description: description
          });
        }
        // Se for item adicionado
        else if (type === 'adicionado' || type === 'ADICIONADO' || type === 'added') {
          processedEvents.push({
            id: index + 1,
            date: formatDate(date),
            type: 'adicionado',
            completed: 0,
            added: added,
            description: description
          });
        }
      });
      
      // Atualizar o estado
      if (processedEvents.length > 0) {
        setEvents(processedEvents);
        setInitialBacklog(newInitialBacklog);
        setUploadStatus(`✅ Planilha carregada com sucesso! ${processedEvents.length} eventos importados.`);
      } else {
        setUploadStatus('❌ Nenhum dado válido encontrado na planilha.');
      }
      
    } catch (error) {
      console.error('Erro ao carregar planilha:', error);
      setUploadStatus('❌ Erro ao carregar planilha. Verifique o formato.');
    }
    
    // Limpar o input
    event.target.value = '';
  };

  const formatDate = (date) => {
    if (!date) return new Date().toISOString().split('T')[0];
    
    // Se já está no formato YYYY-MM-DD
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    
    // Se é um objeto Date do Excel
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    // Se é um número serial do Excel
    if (typeof date === 'number') {
      const excelDate = new Date((date - 25569) * 86400 * 1000);
      return excelDate.toISOString().split('T')[0];
    }
    
    // Tentar parsear como string
    try {
      const parsedDate = new Date(date);
      return parsedDate.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const downloadTemplate = () => {
    const template = `Data,Tipo,Completados,Adicionados,Descrição
2024-01-01,inicial,0,50,Backlog inicial
2024-01-15,completado,5,0,Sprint 1 - Funcionalidades básicas
2024-02-01,completado,8,0,Sprint 2 - Interface usuário
2024-02-15,adicionado,0,10,Novas funcionalidades solicitadas
2024-03-01,completado,12,0,Sprint 3 - Integração API`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_controle_projetos.csv';
    link.click();
  };

  const addEvent = () => {
    if (newEvent.date && (newEvent.completed > 0 || newEvent.added > 0)) {
      const event = {
        id: Date.now(),
        ...newEvent,
        completed: Number(newEvent.completed),
        added: Number(newEvent.added)
      };
      setEvents([...events, event]);
      setNewEvent({
        date: new Date().toISOString().split('T')[0],
        type: 'completado',
        completed: 0,
        added: 0,
        description: ''
      });
    }
  };

  const removeEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const currentStats = chartData.length > 0 ? chartData[chartData.length - 1] : {
    totalAdded: initialBacklog,
    totalCompleted: 0,
    remaining: initialBacklog
  };

  const completionPercentage = currentStats.totalAdded > 0 ? 
    Math.round((currentStats.totalCompleted / currentStats.totalAdded) * 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <BarChart3 className="text-blue-600" />
          Controle de Projetos
        </h1>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="text-xl font-semibold text-gray-600 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none"
          placeholder="Nome do projeto"
        />
      </div>

      {/* Upload de Planilha */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="text-blue-600" />
          Importar Planilha Excel
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carregar Planilha (.xlsx, .xls, .csv)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {uploadStatus && (
              <p className="mt-2 text-sm text-gray-600">{uploadStatus}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Baixar Template
            </label>
            <button
              onClick={downloadTemplate}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Baixar Template CSV
            </button>
          </div>
        </div>
        
        {/* Instruções */}
        <div className="mt-4 p-4 bg-blue-100 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Formato da Planilha:</h3>
          <div className="text-sm text-blue-800">
            <p><strong>Colunas obrigatórias:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>Data:</strong> Formato YYYY-MM-DD ou DD/MM/YYYY</li>
              <li><strong>Tipo:</strong> "inicial", "completado" ou "adicionado"</li>
              <li><strong>Completados:</strong> Número de itens completados</li>
              <li><strong>Adicionados:</strong> Número de itens adicionados</li>
              <li><strong>Descrição:</strong> Descrição do evento</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-blue-700 mb-1">Total de Itens</h3>
          <p className="text-2xl font-bold text-blue-800">{currentStats.totalAdded}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-green-700 mb-1">Completados</h3>
          <p className="text-2xl font-bold text-green-800">{currentStats.totalCompleted}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-orange-700 mb-1">Restantes</h3>
          <p className="text-2xl font-bold text-orange-800">{currentStats.remaining}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-purple-700 mb-1">Progresso</h3>
          <p className="text-2xl font-bold text-purple-800">{completionPercentage}%</p>
        </div>
      </div>

      {/* Gráfico Principal */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Evolução do Projeto</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dateFormatted" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalAdded" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total de Itens"
              />
              <Line 
                type="monotone" 
                dataKey="totalCompleted" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Itens Completados"
              />
              <Line 
                type="monotone" 
                dataKey="remaining" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Itens Restantes"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Entrada Manual de Dados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Configuração Manual</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backlog Inicial
              </label>
              <input
                type="number"
                value={initialBacklog}
                onChange={(e) => setInitialBacklog(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Adicionar Evento Manual</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="completado">Itens Completados</option>
                  <option value="adicionado">Itens Adicionados</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {newEvent.type === 'completado' ? 'Qtd Completados' : 'Qtd Adicionados'}
                </label>
                <input
                  type="number"
                  value={newEvent.type === 'completado' ? newEvent.completed : newEvent.added}
                  onChange={(e) => setNewEvent({
                    ...newEvent,
                    [newEvent.type === 'completado' ? 'completed' : 'added']: Number(e.target.value),
                    [newEvent.type === 'completado' ? 'added' : 'completed']: 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição do evento"
                />
              </div>
            </div>
            <button
              onClick={addEvent}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Adicionar Evento
            </button>
          </div>
        </div>
      </div>

      {/* Histórico de Eventos */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Eventos</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Data</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Tipo</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Quantidade</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Descrição</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {events
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((event) => (
                  <tr key={event.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-2 px-4">
                      {new Date(event.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.type === 'completado' 
                          ? 'bg-green-100 text-green-800' 
                          : event.type === 'adicionado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.type === 'completado' ? 'Completado' : 
                         event.type === 'adicionado' ? 'Adicionado' : 'Inicial'}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {event.type === 'completado' ? event.completed : event.added}
                    </td>
                    <td className="py-2 px-4">{event.description}</td>
                    <td className="py-2 px-4">
                      {event.type !== 'inicial' && (
                        <button
                          onClick={() => removeEvent(event.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectControlChart;
