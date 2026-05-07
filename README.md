# Rastreamento Polo Shopping

Sistema de rastreamento de itens e pessoas do Polo Shopping.

## Funcionalidades

- Rastreamento visual em mapa interativo
- Múltiplos andares (Térreo, 1º Piso, 2º Piso, Externo)
- Diferentes tipos de registros (pessoas, segurança, itens)
- Status dos registros (ativo, inativo, alerta, em movimento)
- Filtros por tipo e status
- Histórico de atividades
- Exportação de dados em CSV
- Modo escuro
- Suporte PWA (Progressive Web App)
- Zoom e movimentação do mapa
- Persistência local com LocalStorage

## Como Usar

1. Abra o arquivo `index.html` em um servidor web
2. Selecione o tipo de registro
3. Preencha o nome (opcional)
4. Escolha o status
5. Clique no mapa para adicionar o registro

## Requisitos

- Servidor web (Apache, Nginx, etc.) ou servidor de desenvolvimento
- Navegador moderno com suporte a JavaScript ES6+
- Conexão com internet (para carregar ícones Font Awesome)

## Tecnologias

- HTML5
- CSS3 (com variáveis CSS e animações)
- JavaScript (Vanilla)
- Service Worker (PWA)
- LocalStorage
- Font Awesome 6.5

## Instalação

```bash
# Clone o repositório
git clone [url-do-repositorio]

# Entre no diretório
cd appshop

# Inicie um servidor local (exemplo com Python)
python -m http.server 8000

# Ou com Node.js
npx serve