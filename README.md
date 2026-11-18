# Rastreamento Polo Shopping

Sistema de rastreamento de itens e pessoas do Polo Shopping.

## Funcionalidades

- Rastreamento visual em mapa interativo
- Mapa original de alta resolução (7811 × 6051), com cores realçadas, inclinação 3D leve e árvores sobre áreas verdes
- Múltiplos andares (Térreo, 1º Piso, 2º Piso, Externo)
- Diferentes tipos de registros (pessoas, segurança, itens)
- Status dos registros (ativo, inativo, alerta, em movimento)
- Filtros por tipo e status
- Histórico de atividades
- Exportação de dados em CSV
- Modo escuro
- Interface responsiva para desktop e celular, com suporte a toque e teclado
- Suporte PWA e uso offline após o primeiro carregamento
- Zoom com renderização em tamanho ampliado e movimentação do mapa, preservando os detalhes do arquivo original
- Persistência local com LocalStorage
- Exportação CSV com escape de campos e proteção contra fórmulas

## Como Usar

1. Inicie um servidor web local ou publique em uma hospedagem com HTTPS
2. Selecione o tipo de registro
3. Preencha o nome (opcional)
4. Escolha o status
5. Clique no mapa para adicionar o registro

## Requisitos

- Servidor web (Apache, Nginx, etc.) ou servidor de desenvolvimento
- Navegador moderno com suporte a JavaScript ES6+
- Conexão com internet (para carregar ícones Font Awesome)
- HTTPS ou `localhost` para habilitar o Service Worker e a instalação como app

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