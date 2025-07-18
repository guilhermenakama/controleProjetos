import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const ProjectControlChart = () => {
  const [projectName, setProjectName] = useState('Meu Projeto');
  const [selectedPhase, setSelectedPhase] = useState('todas');
  const [selectedView, setSelectedView] = useState('items');
  const [events, setEvents] = useState([
    { 
      id: 1, 
      date: '2024-06-10', 
      description: 'Visita in-loco para mapeamento de necessidades',
      activity: 'Análise de requisitos',
      startTime: '08:30',
      endTime: '13:30',
      duration: 5.0,
      phase: 1,
      responsible: 'Guilherme',
      status: 'Concluído',
      addedAt: '2024-06-01'
    }
  ]);
  const [newEvent, setNewEvent] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    activity: '',
    startTime: '',
    endTime: '',
    duration: 0,
    phase: 1,
    responsible: '',
    status: 'Concluído',
    addedAt: new Date().toISOString().split('T')[0]
  });
  const [chartData, setChartData] = useState([]);
  const [phaseStats, setPhaseStats] = useState({});
  const [hoursStats, setHoursStats] = useState({});
  const [uploadStatus, setUploadStatus] = useState('');
  const [hourlyRate, setHourlyRate] = useState(50);

  // Configuração dinâmica de fases (números)
  const getPhaseConfig = () => {
    const allPhases = [...new Set(events.map(e => e.phase))].sort((a, b) => a - b);
    const config = {};
    
    allPhases.forEach(phase => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
      const bgColors = ['bg-blue-50', 'bg-green-50', 'bg-yellow-50', 'bg-red-50', 'bg-purple-50', 'bg-orange-50'];
      const borderColors = ['border-blue-500', 'border-green-500', 'border-yellow-500', 'border-red-500', 'border-purple-500', 'border-orange-500'];
      
      const colorIndex = (phase - 1) % colors.length;
      config[phase] = {
        name: `Fase ${phase}`,
        color: colors[colorIndex],
        bgColor: bgColors[colorIndex],
        borderColor: borderColors[colorIndex]
      };
    });
    
    return config;
  };

  const phases = getPhaseConfig();

  const statusColors = {
    'Concluído': 'bg-green-100 text-green-800',
    'Em andamento': 'bg-yellow-100 text-yellow-800',
    'Pendente': 'bg-red-100 text-red-800',
    'Cancelado': 'bg-gray-100 text-gray-800'
  };

  useEffect(() => {
    generateChartData();
    generatePhaseStats();
    generateHoursStats();
  }, [events, selectedPhase, selectedView]);

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2024-01-01T${startTime}:00`);
    const end = new Date(`2024-01-01T${endTime}:00`);
    return Math.round(((end - start) / (1000 * 60 * 60)) * 100) / 100;
  };

  const generateChartData = () => {
    const filteredEvents = selectedPhase === 'todas' 
      ? events 
      : events.filter(event => event.phase === parseInt(selectedPhase));
    
    const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let totalItems = 0;
    let completedItems = 0;
    let inProgressItems = 0;
    let totalHours = 0;
    let completedHours = 0;

    const data = sortedEvents.map((event) => {
      totalItems++;
      totalHours += event.duration || 0;
      
      if (event.status === 'Concluído') {
        completedItems++;
        completedHours += event.duration || 0;
      } else if (event.status === 'Em andamento') {
        inProgressItems++;
      }

      return {
        date: event.date,
        dateFormatted: new Date(event.date).toLocaleDateString('pt-BR'),
        totalItems: totalItems,
        completedItems: completedItems,
        inProgressItems: inProgressItems,
        pendingItems: totalItems - completedItems - inProgressItems,
        totalHours: totalHours,
        completedHours: completedHours,
        phase: event.phase,
        description: event.description
      };
    });

    setChartData(data);
  };

  const generatePhaseStats = () => {
    const stats = {};
    
    Object.keys(phases).forEach(phaseKey => {
      const phaseNumber = parseInt(phaseKey);
      const phaseEvents = events.filter(event => event.phase === phaseNumber);
      
      const totalItems = phaseEvents.length;
      const completedItems = phaseEvents.filter(e => e.status === 'Concluído').length;
      const inProgressItems = phaseEvents.filter(e => e.status === 'Em andamento').length;
      const pendingItems = phaseEvents.filter(e => e.status === 'Pendente').length;
      const totalHours = phaseEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
      const completedHours = phaseEvents.filter(e => e.status === 'Concluído').reduce((sum, e) => sum + (e.duration || 0), 0);
      const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      const cost = totalHours * hourlyRate;

      stats[phaseNumber] = {
        totalItems,
        completedItems,
        inProgressItems,
        pendingItems,
        percentage,
        totalHours,
        completedHours,
        cost
      };
    });

    setPhaseStats(stats);
  };

  const generateHoursStats = () => {
    const responsibleStats = {};
    const dailyStats = {};
    
    events.forEach(event => {
      const responsible = event.responsible || 'Não informado';
      const date = event.date;
      const hours = event.duration || 0;
      
      if (!responsibleStats[responsible]) {
        responsibleStats[responsible] = {
          totalHours: 0,
          completedItems: 0,
          inProgressItems: 0,
          cost: 0
        };
      }
      responsibleStats[responsible].totalHours += hours;
      responsibleStats[responsible].cost += hours * hourlyRate;
      
      if (event.status === 'Concluído') {
        responsibleStats[responsible].completedItems++;
      } else if (event.status === 'Em andamento') {
        responsibleStats[responsible].inProgressItems++;
      }
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          totalHours: 0,
          completedItems: 0
        };
      }
      dailyStats[date].totalHours += hours;
      if (event.status === 'Concluído') {
        dailyStats[date].completedItems++;
      }
    });

    setHoursStats({ responsibleStats, dailyStats });
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
    const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const headers = lines[0].split(',').map(h => h.trim());
    const processedEvents = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const date = row['Data'] || row['DATE'] || row['data'] || row['Date'];
      const description = row['Descrição'] || row['DESCRIPTION'] || row['descrição'] || row['Description'] || '';
      const activity = row['Atividade'] || row['ACTIVITY'] || row['atividade'] || row['Activity'] || description;
      const startTime = row['Início'] || row['Horário Inicial'] || row['START_TIME'] || row['horario_inicial'] || row['Start Time'] || '';
      const endTime = row['Fim'] || row['Horário Final'] || row['END_TIME'] || row['horario_final'] || row['End Time'] || '';
      const duration = Number(row['Total Horas Fase'] || row['Duração (h)'] || row['DURATION'] || row['duracao'] || row['Duration'] || row['Horas'] || 0);
      const phase = parseInt(row['Fase'] || row['PHASE'] || row['fase'] || row['Phase'] || 1);
      const responsible = row['Responsável'] || row['RESPONSIBLE'] || row['responsavel'] || row['Responsible'] || '';
      const status = row['Status'] || row['STATUS'] || row['status'] || 'Concluído';
      const addedAt = row['Adicionado em'] || row['ADDED_AT'] || row['adicionado_em'] || row['Added At'] || date;

      if (date && description) {
        processedEvents.push({
          id: i,
          date: formatDate(date),
          description: description,
          activity: activity,
          startTime: startTime,
          endTime: endTime,
          duration: duration || calculateDuration(startTime, endTime),
          phase: phase,
          responsible: responsible,
          status: status,
          addedAt: formatDate(addedAt)
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
    
    if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = date.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    if (typeof date === 'string' && date.match(/^\d{1,2}\/\w{3}$/)) {
      const [day, monthName] = date.split('/');
      const currentYear = new Date().getFullYear();
      const months = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      const month = months[monthName] || '01';
      return `${currentYear}-${month}-${day.padStart(2, '0')}`;
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
    const template = `Data,Descrição,Atividade,Início,Fim,Total Horas Fase,Fase,Responsável,Status,Adicionado em
10/Jun,Visita in-loco para mapeamento de necessidades,Análise de requisitos,08:30,13:30,5.0,1,Guilherme,Concluído,01/Jun
18/Jun,Visita in-loco para mapeamento de processos de venda,Análise de processos,09:00,13:00,4.0,1,Guilherme,Concluído,01/Jun
19/Jun,Desenho do Fluxo de Automação de Pedido de Vendas,Desenho de fluxos,20:00,22:00,2.0,1,Guilherme,Concluído,01/Jun
20/Jun,Desenho do Fluxo de Automação de Cobrança,Desenho de fluxos,18:00,20:00,2.0,1,Guilherme,Concluído,01/Jun
08/Jul,Alinhamento com time técnico,Reunião de alinhamento,18:30,21:00,2.5,2,Time Técnico,Concluído,01/Jul
11/Jul,Reunião com Patricia da Mercos,Reunião externa,11:30,12:20,0.8,2,Guilherme,Concluído,01/Jul
14/Jul,Fluxo de confirmação de pedido,Desenvolvimento,16:00,18:00,2.0,2,Time Técnico,Concluído,01/Jul
15/Jul,Fluxo de confirmação de pedido,Desenvolvimento,17:00,19:00,2.0,2,Time Técnico,Em andamento,01/Jul
17/Jul,Fluxo de confirmação de pedido,Desenvolvimento,16:30,18:30,2.0,2,Time Técnico,Pendente,01/Jul
18/Jul,Fluxo de extração de informação do audio,Desenvolvimento,09:00,14:00,5.0,3,Time Técnico,Em andamento,01/Jul
18/Jul,Fluxo de busca de informações na base vetorial,Desenvolvimento,14:00,17:00,3.0,3,Time Técnico,Pendente,01/Jul
18/Jul,Criação do database externo de índice,Desenvolvimento,08:00,10:00,2.0,3,Time Técnico,Pendente,01/Jul`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_controle_projetos_status.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addEvent = () => {
    if (newEvent.date && newEvent.description) {
      const duration = calculateDuration(newEvent.startTime, newEvent.endTime);
      const event = {
        id: Date.now(),
        ...newEvent,
        duration: duration || newEvent.duration,
        phase: parseInt(newEvent.phase)
      };
      setEvents([...events, event]);
      setNewEvent({
        date: new Date().toISOString().split('T')[0],
        description: '',
        activity: '',
        startTime: '',
        endTime: '',
        duration: 0,
        phase: 1,
        responsible: '',
        status: 'Concluído',
        addedAt: new Date().toISOString().split('T')[0]
      });
    }
  };

  const removeEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const getCurrentStats = () => {
    if (selectedPhase === 'todas') {
      const totalItems = Object.values(phaseStats).reduce((sum, phase) => sum + phase.totalItems, 0);
      const completedItems = Object.values(phaseStats).reduce((sum, phase) => sum + phase.completedItems, 0);
      const inProgressItems = Object.values(phaseStats).reduce((sum, phase) => sum + phase.inProgressItems, 0);
      const pendingItems = Object.values(phaseStats).reduce((sum, phase) => sum + phase.pendingItems, 0);
      const totalHours = Object.values(phaseStats).reduce((sum, phase) => sum + phase.totalHours, 0);
      const totalCost = Object.values(phaseStats).reduce((sum, phase) => sum + phase.cost, 0);
      const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      return { totalItems, completedItems, inProgressItems, pendingItems, percentage, totalHours, totalCost };
    } else {
      const phaseNumber = parseInt(selectedPhase);
      return phaseStats[phaseNumber] || { totalItems: 0, completedItems: 0, inProgressItems: 0, pendingItems: 0, percentage: 0, totalHours: 0, totalCost: 0 };
    }
  };

  const currentStats = getCurrentStats();

  const hoursChartData = Object.entries(hoursStats.responsibleStats || {}).map(([name, stats]) => ({
    name,
    hours: stats.totalHours,
    completedItems: stats.completedItems,
    inProgressItems: stats.inProgressItems,
    cost: stats.cost
  }));

  const pieData = Object.entries(phaseStats).map(([phase, stats]) => ({
    name: phases[phase]?.name || `Fase ${phase}`,
    value: stats.percentage,
    color: phases[phase]?.color || '#6b7280'
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            📊 Controle de Projetos por Status
          </h1>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-xl font-semibold text-gray-600 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none transition-colors"
            placeholder="Nome do projeto"
          />
        </div>

        {/* Controls */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Fase</label>
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
                  >
                    {phase.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visualização</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedView('items')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedView === 'items'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📊 Por Itens
                </button>
                <button
                  onClick={() => setSelectedView('hours')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedView === 'hours'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⏱️ Por Horas
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor/Hora (R$)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Phase Overview */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🎯 Visão Geral das Fases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(phases).map(([key, phase]) => (
                <div key={key} className={`${phase.bgColor} p-4 rounded-lg border ${phase.borderColor}`}>
                  <h3 className="font-semibold text-gray-800 mb-2">{phase.name}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Total:</span> {phaseStats[key]?.totalItems || 0}</p>
                    <p><span className="font-medium">Concluído:</span> {phaseStats[key]?.completedItems || 0}</p>
                    <p><span className="font-medium">Em andamento:</span> {phaseStats[key]?.inProgressItems || 0}</p>
                    <p><span className="font-medium">Pendente:</span> {phaseStats[key]?.pendingItems || 0}</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total de Itens</h3>
                <p className="text-2xl font-bold text-blue-600">{currentStats.totalItems}</p>
              </div>
              <div className="w-3 h-12 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Concluídos</h3>
                <p className="text-2xl font-bold text-green-600">{currentStats.completedItems}</p>
              </div>
              <div className="w-3 h-12 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Em Andamento</h3>
                <p className="text-2xl font-bold text-yellow-600">{currentStats.inProgressItems}</p>
              </div>
              <div className="w-3 h-12 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Pendentes</h3>
                <p className="text-2xl font-bold text-red-600">{currentStats.pendingItems}</p>
              </div>
              <div className="w-3 h-12 bg-red-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total de Horas</h3>
                <p className="text-2xl font-bold text-purple-600">{currentStats.totalHours?.toFixed(1) || '0.0'}h</p>
              </div>
              <div className="w-3 h-12 bg-purple-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Custo Total</h3>
                <p className="text-2xl font-bold text-orange-600">R$ {currentStats.totalCost?.toFixed(0) || '0'}</p>
              </div>
              <div className="w-3 h-12 bg-orange-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📈 Evolução por Status
              </h2>
              <div className="h-80">
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
                    <Tooltip />
                    <Legend />
                    {selectedView === 'items' ? (
                      <>
                        <Line type="monotone" dataKey="completedItems" stroke="#10b981" strokeWidth={2} name="Concluídos" />
                        <Line type="monotone" dataKey="inProgressItems" stroke="#f59e0b" strokeWidth={2} name="Em Andamento" />
                        <Line type="monotone" dataKey="pendingItems" stroke="#ef4444" strokeWidth={2} name="Pendentes" />
                      </>
                    ) : (
                      <>
                        <Line type="monotone" dataKey="totalHours" stroke="#8b5cf6" strokeWidth={2} name="Total de Horas" />
                        <Line type="monotone" dataKey="completedHours" stroke="#10b981" strokeWidth={2} name="Horas Concluídas" />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                👥 Horas por Responsável
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hoursChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'hours' ? `${value}h` : 
                      name === 'cost' ? `R$ ${value.toFixed(0)}` : value,
                      name === 'hours' ? 'Horas' : 
                      name === 'cost' ? 'Custo' : 'Itens'
                    ]} />
                    <Legend />
                    <Bar dataKey="hours" fill="#3b82f6" name="Horas" />
                    <Bar dataKey="completedItems" fill="#10b981" name="Concluídos" />
                    <Bar dataKey="inProgressItems" fill="#f59e0b" name="Em Andamento" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📁 Importar Planilha com Status
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
          
          <div className="p-6 bg-blue-50 rounded-b-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Formato da Planilha CSV:</h3>
            <div className="text-sm text-blue-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Campos obrigatórios:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Data:</strong> Data da atividade</li>
                  <li><strong>Descrição:</strong> Descrição da atividade</li>
                  <li><strong>Fase:</strong> Número da fase (1, 2, 3, ...)</li>
                  <li><strong>Status:</strong> Concluído/Em andamento/Pendente</li>
                </ul>
              </div>
              <div>
                <p><strong>Campos opcionais:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Início/Fim:</strong> Horários (HH:MM)</li>
                  <li><strong>Total Horas Fase:</strong> Duração em horas</li>
                  <li><strong>Responsável:</strong> Nome da pessoa</li>
                  <li><strong>Adicionado em:</strong> Data de adição</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">➕ Adicionar Atividade Manual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <input
                type="text"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descrição da atividade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
              <input
                type="number"
                value={newEvent.phase}
                onChange={(e) => setNewEvent({...newEvent, phase: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário Inicial</label>
              <input
                type="time"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário Final</label>
              <input
                type="time"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
              <input
                type="text"
                value={newEvent.responsible}
                onChange={(e) => setNewEvent({...newEvent, responsible: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do responsável"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={newEvent.status}
                onChange={(e) => setNewEvent({...newEvent, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Concluído">Concluído</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Pendente">Pendente</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adicionado em</label>
              <input
                type="date"
                value={newEvent.addedAt}
                onChange={(e) => setNewEvent({...newEvent, addedAt: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={addEvent}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              ➕ Adicionar Atividade
            </button>
          </div>
        </div>

        {/* Events History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Histórico de Atividades</h2>
            <div className="table-container overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Data</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Fase</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Descrição</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Horário</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Horas</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Responsável</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Adicionado em</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Custo</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {events
                    .filter(event => selectedPhase === 'todas' || event.phase === parseInt(selectedPhase))
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${phases[event.phase]?.bgColor || 'bg-gray-100'} text-gray-800`}>
                          {phases[event.phase]?.name || `Fase ${event.phase}`}
                        </span>
                      </td>
                      <td className="py-3 px-2 max-w-40">
                        <div className="truncate" title={event.description}>
                          {event.description}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {event.startTime && event.endTime && (
                          <div className="text-xs">
                            {event.startTime} - {event.endTime}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-medium">{event.duration?.toFixed(1) || '0.0'}h</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs">{event.responsible}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status] || 'bg-gray-100 text-gray-800'}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs">
                          {new Date(event.addedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs font-medium text-green-600">
                          R$ {((event.duration || 0) * hourlyRate).toFixed(0)}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => removeEvent(event.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          🗑️
                        </button>
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
