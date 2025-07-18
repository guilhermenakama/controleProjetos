import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ProjectControlChart = () => {
  const [projectName, setProjectName] = useState('Meu Projeto');
  const [initialBacklog, setInitialBacklog] = useState(50);
  const [selectedPhase, setSelectedPhase] = useState('todas'); // 'todas', 'fase1', 'fase2', 'fase3'
  const [events, setEvents] = useState([
    { id: 1, date: '2024-01-01', type: 'inicial', completed: 0, added: 20, phase: 'fase1', description: 'Backlog inicial - Fase 1' },
    { id: 2, date: '2024-01-01', type: 'inicial', completed: 0, added: 20, phase: 'fase2', description: 'Backlog inicial - Fase 2' },
    { id: 3, date: '2024-01-01', type: 'inicial', completed: 0, added: 10, phase: 'fase3', description: 'Backlog inicial - Fase 3' }
  ]);
  const [newEvent, setNewEvent] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'completado',
    completed: 0,
    added: 0,
    phase: 'fase1',
    description: ''
  });
  const [chartData, setChartData] = useState([]);
  const [phaseStats, setPhaseStats] = useState({});
  const [uploadStatus, setUploadStatus] = useState('');

  const phases = {
    'fase1': { name: 'Fase 1', color: '#3b82f6', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' },
    'fase2': { name: 'Fase 2', color: '#10b981', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
    'fase3': { name: 'Fase 3', color: '#f59e0b', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-500' }
  };

  useEffect(() => {
    generateChartData();
    generatePhaseStats();
  }, [events, initialBacklog, selectedPhase]);

  const generateChartData = () => {
    const filteredEvents = selectedPhase === 'todas' 
      ? events 
      : events.filter(event => event.phase === selectedPhase);
    
    const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
    let totalCompleted = 0;
    let totalAdded = 0;
    let remaining = 0;

    // Calcular backlog inicial para a fase selecionada
    if (selectedPhase === 'todas') {
      totalAdded = events.filter(e => e.type === 'inicial').reduce((sum, e) => sum + e.added, 0);
      remaining = totalAdded;
    } else {
      const initialEvent = events.find(e => e.type === 'inicial' && e.phase === selectedPhase);
      totalAdded = initialEvent ? initialEvent.added : 0;
      remaining = totalAdded;
    }

    const data = sortedEvents.map((event) => {
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
        remaining: Math.max(0, remaining),
        phase: event.phase,
        description: event.description
      };
    });

    setChartData(data);
  };

  const generatePhaseStats = () => {
    const stats = {};
    
    Object.keys(phases).forEach(phaseKey => {
      const phaseEvents = events.filter(event => event.phase === phaseKey);
      const initialEvent = phaseEvents.find(e => e.type === 'inicial');
      const totalAdded = phaseEvents.reduce((sum, e) => sum + e.added, 0);
      const totalCompleted = phaseEvents.filter(e => e.type === 'completado').reduce((sum, e) => sum + e.completed, 0);
      const remaining = Math.max(0, totalAdded - totalCompleted);
      const percentage = totalAdded > 0 ? Math.round((totalCompleted / totalAdded) * 100) : 0;

      stats[phaseKey] = {
        totalAdded,
        totalCompleted,
        remaining,
        percentage
      };
    });

    setPhaseStats(stats);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadStatus('Carregando planilha...');
      const text = await file.text();
      const processedEvents = parseCSV(text);
      
      if (processedEvents.length > 0) {
        setEvents(processedEvents);
        setUploadStatus(`✅ Planilha carregada com sucesso! ${processedEvents.length} eventos importados.`);
      } else {
        setUploadStatus('❌ Nenhum dado válido encontrado na planilha.');
      }
    } catch (error) {
      console.error('Erro ao carregar planilha:', error);
      setUploadStatus('❌ Erro ao carregar planilha. Verifique o formato CSV.');
    }
    
    event.target.value = '';
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const processedEvents = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const date = row['Data'] || row['DATE'] || row['data'] || row['Date'];
      const type = (row['Tipo'] || row['TYPE'] || row['tipo'] || row['Type'] || '').toLowerCase();
      const completed = Number(row['Completados'] || row['COMPLETED'] || row['completados'] || row['Completed'] || 0);
      const added = Number(row['Adicionados'] || row['ADDED'] || row['adicionados'] || row['Added'] || 0);
      const phase = (row['Fase'] || row['PHASE'] || row['fase'] || row['Phase'] || 'fase1').toLowerCase();
      const description = row['Descrição'] || row['DESCRIPTION'] || row['descrição'] || row['Description'] || '';

      if (date && type && (completed > 0 || added > 0)) {
        processedEvents.push({
          id: i,
          date: formatDate(date),
          type: type,
          completed: completed,
          added: added,
          phase: phase,
          description: description
        });
      }
    }

    return processedEvents;
  };

  const formatDate = (date) => {
    if (!date) return new Date().toISOString().split('T')[0];
    
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return parsedDate.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const downloadTemplate = () => {
    const template = `Data,Tipo,Completados,Adicionados,Fase,Descrição
2024-01-01,inicial,0,20,fase1,Backlog inicial - Fase 1
2024-01-01,inicial,0,20,fase2,Backlog inicial - Fase 2
2024-01-01,inicial,0,10,fase3,Backlog inicial - Fase 3
2024-01-15,completado,5,0,fase1,Sprint 1 - Autenticação
2024-02-01,completado,8,0,fase1,Sprint 2 - Dashboard
2024-02-15,adicionado,0,5,fase2,Novas funcionalidades solicitadas
2024-03-01,completado,3,0,fase2,Sprint 3 - Relatórios
2024-03-15,completado,2,0,fase3,Sprint 4 - Testes finais`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_controle_projetos_fases.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        phase: 'fase1',
        description: ''
      });
    }
  };

  const removeEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const getCurrentStats = () => {
    if (selectedPhase === 'todas') {
      const totalAdded = Object.values(phaseStats).reduce((sum, phase) => sum + phase.totalAdded, 0);
      const totalCompleted = Object.values(phaseStats).reduce((sum, phase) => sum + phase.totalCompleted, 0);
      const remaining = Object.values(phaseStats).reduce((sum, phase) => sum + phase.remaining, 0);
      const percentage = totalAdded > 0 ? Math.round((totalCompleted / totalAdded) * 100) : 0;
      return { totalAdded, totalCompleted, remaining, percentage };
    } else {
      return phaseStats[selectedPhase] || { totalAdded: 0, totalCompleted: 0, remaining: 0, percentage: 0 };
    }
  };

  const currentStats = getCurrentStats();

  const pieData = Object.entries(phaseStats).map(([phase, stats]) => ({
    name: phases[phase].name,
    value: stats.percentage,
    color: phases[phase].color
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            📊 Controle de Projetos
          </h1>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-xl font-semibold text-gray-600 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none transition-colors"
            placeholder="Nome do projeto"
          />
        </div>

        {/* Phase Filter */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📈 Filtrar por Fase</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPhase('todas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPhase === 'todas'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Todas as Fases
            </button>
            {Object.entries(phases).map(([key, phase]) => (
              <button
                key={key}
                onClick={() => setSelectedPhase(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPhase === key
                    ? `${phase.bgColor} text-gray-800 ring-2 ring-opacity-50`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedPhase === key ? phase.color + '20' : '',
                  borderColor: selectedPhase === key ? phase.color : ''
                }}
              >
                {phase.name}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Overview */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🎯 Visão Geral das Fases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(phases).map(([key, phase]) => (
                <div key={key} className={`${phase.bgColor} p-4 rounded-lg border ${phase.borderColor}`}>
                  <h3 className="font-semibold text-gray-800 mb-2">{phase.name}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Total:</span> {phaseStats[key]?.totalAdded || 0}</p>
                    <p><span className="font-medium">Concluído:</span> {phaseStats[key]?.totalCompleted || 0}</p>
                    <p><span className="font-medium">Restante:</span> {phaseStats[key]?.remaining || 0}</p>
                    <p><span className="font-medium">Progresso:</span> {phaseStats[key]?.percentage || 0}%</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center">
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Progresso']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📁 Importar Planilha
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carregar Planilha CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
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
                  ⬇️ Baixar Template CSV
                </button>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="p-6 bg-blue-50 rounded-b-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Formato da Planilha CSV:</h3>
            <div className="text-sm text-blue-800">
              <p><strong>Colunas obrigatórias:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>Data:</strong> Formato YYYY-MM-DD</li>
                <li><strong>Tipo:</strong> "inicial", "completado" ou "adicionado"</li>
                <li><strong>Completados:</strong> Número de itens completados</li>
                <li><strong>Adicionados:</strong> Número de itens adicionados</li>
                <li><strong>Fase:</strong> "fase1", "fase2" ou "fase3"</li>
                <li><strong>Descrição:</strong> Descrição do evento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total de Itens</h3>
                <p className="text-2xl font-bold text-blue-600">{currentStats.totalAdded}</p>
                <p className="text-xs text-gray-500">
                  {selectedPhase === 'todas' ? 'Todas as fases' : phases[selectedPhase]?.name}
                </p>
              </div>
              <div className="w-3 h-12 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Completados</h3>
                <p className="text-2xl font-bold text-green-600">{currentStats.totalCompleted}</p>
                <p className="text-xs text-gray-500">
                  {selectedPhase === 'todas' ? 'Todas as fases' : phases[selectedPhase]?.name}
                </p>
              </div>
              <div className="w-3 h-12 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Restantes</h3>
                <p className="text-2xl font-bold text-orange-600">{currentStats.remaining}</p>
                <p className="text-xs text-gray-500">
                  {selectedPhase === 'todas' ? 'Todas as fases' : phases[selectedPhase]?.name}
                </p>
              </div>
              <div className="w-3 h-12 bg-orange-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Progresso</h3>
                <p className="text-2xl font-bold text-purple-600">{currentStats.percentage}%</p>
                <p className="text-xs text-gray-500">
                  {selectedPhase === 'todas' ? 'Todas as fases' : phases[selectedPhase]?.name}
                </p>
              </div>
              <div className="w-3 h-12 bg-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📈 Evolução do Projeto - {selectedPhase === 'todas' ? 'Todas as Fases' : phases[selectedPhase]?.name}
            </h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
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
        </div>

        {/* Manual Entry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">⚙️ Configuração Manual</h2>
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">➕ Adicionar Evento</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                  <select
                    value={newEvent.phase}
                    onChange={(e) => setNewEvent({...newEvent, phase: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fase1">Fase 1</option>
                    <option value="fase2">Fase 2</option>
                    <option value="fase3">Fase 3</option>
                  </select>
                </div>
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
              <button
                onClick={addEvent}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                ➕ Adicionar Evento
              </button>
            </div>
          </div>
        </div>

        {/* Events History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Histórico de Eventos</h2>
            <div className="table-container overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fase</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Quantidade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Descrição</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {events
                    .filter(event => selectedPhase === 'todas' || event.phase === selectedPhase)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${phases[event.phase]?.bgColor} text-gray-800`}>
                          {phases[event.phase]?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
                        {event.type === 'completado' ? event.completed : event.added}
                      </td>
                      <td className="py-3 px-4">{event.description}</td>
                      <td className="py-3 px-4">
                        {event.type !== 'inicial' && (
                          <button
                            onClick={() => removeEvent(event.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            🗑️
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
    </div>
  );
};

export default ProjectControlChart;
