# 📊 Sistema de Controle de Projetos

Sistema web para acompanhamento de projetos com gráficos interativos e importação de planilhas Excel.

## 🚀 Funcionalidades

- 📊 Gráficos interativos de progresso do projeto
- 📁 Importação de planilhas Excel/CSV
- 📈 Acompanhamento de backlog e items completados
- 🎯 Métricas de progresso em tempo real
- 📱 Interface responsiva para mobile e desktop
- 🔄 Atualização automática de gráficos

## 📋 Como usar

1. **Configure o backlog inicial** - Defina quantos itens seu projeto tem
2. **Adicione eventos** - Registre itens completados ou adicionados
3. **Importe planilhas** - Use Excel/CSV para atualizações em massa
4. **Acompanhe progresso** - Visualize métricas em tempo real

## 📁 Estrutura da Planilha

| Data | Tipo | Completados | Adicionados | Descrição |
|------|------|-------------|-------------|-----------|
| 2024-01-01 | inicial | 0 | 50 | Backlog inicial |
| 2024-01-15 | completado | 5 | 0 | Sprint 1 - Funcionalidades básicas |
| 2024-02-01 | completado | 8 | 0 | Sprint 2 - Interface usuário |
| 2024-02-15 | adicionado | 0 | 10 | Novas funcionalidades solicitadas |

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🚀 Deploy

Este projeto está configurado para deploy automático no Vercel através do GitHub.

## 💻 Tecnologias

- **React 18** - Framework JavaScript
- **Vite** - Build tool rápido
- **Tailwind CSS** - Framework CSS
- **Recharts** - Biblioteca de gráficos
- **Lucide React** - Ícones
- **SheetJS** - Processamento de planilhas

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes
