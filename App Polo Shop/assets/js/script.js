// assets/js/script.js

document.addEventListener("DOMContentLoaded", () => {
    // IDs dos elementos do DOM
    const MAPA_ID = "mapa";
    const MAP_CONTAINER_ID = "map-container";
    const TIPO_CHAMADO_SELECT_ID = "tipo-chamado";
    const BTN_LIMPAR_PONTOS_ID = "btn-limpar-pontos";

    // Seleção dos elementos do DOM
    const mapaElement = document.getElementById(MAPA_ID);
    const mapContainerElement = document.getElementById(MAP_CONTAINER_ID);
    const tipoChamadoSelect = document.getElementById(TIPO_CHAMADO_SELECT_ID);
    const btnLimparPontos = document.getElementById(BTN_LIMPAR_PONTOS_ID);

    // Verificações iniciais para garantir que os elementos essenciais existem
    if (!mapaElement) {
        console.error(`Erro crítico: Elemento do mapa com ID "${MAPA_ID}" não encontrado. A funcionalidade do mapa não funcionará.`);
        return; // Impede a execução do restante do script se o mapa não for encontrado
    }
    if (!mapContainerElement) {
        console.error(`Erro crítico: Elemento contêiner do mapa com ID "${MAP_CONTAINER_ID}" não encontrado. Os marcadores não podem ser posicionados.`);
        return; // Impede a execução se o contêiner do mapa não for encontrado
    }
    if (!tipoChamadoSelect) {
        console.error(`Erro: Elemento select com ID "${TIPO_CHAMADO_SELECT_ID}" não encontrado. A seleção de tipo de chamado não funcionará.`);
        // Pode-se optar por continuar com um tipo padrão ou desabilitar a adição de pontos
    }
    if (!btnLimparPontos) { // Se o botão for opcional, usar console.warn
        console.warn(`Aviso: Botão com ID "${BTN_LIMPAR_PONTOS_ID}" não encontrado. A funcionalidade de limpar pontos não estará disponível.`);
    }

    // Array para armazenar referências aos elementos DOM dos marcadores
    let marcadoresNoMapa = [];
    let markerIdCounter = 0; // Contador para IDs únicos dos marcadores

    /**
     * Cria e adiciona um novo marcador visual ao mapa.
     * @param {number} xPercent - Coordenada X do marcador em porcentagem.
     * @param {number} yPercent - Coordenada Y do marcador em porcentagem.
     * @param {string} tipo - O tipo de chamado (ex: "urgente", "ronda"), usado para aplicar a classe CSS correta.
     */
    function adicionarMarcador(xPercent, yPercent, tipo) {
        const gpsMarker = document.createElement("div");
        markerIdCounter++;
        gpsMarker.id = `marker-${markerIdCounter}`;

        // Aplica as classes CSS:
        // - 'gps-marker': para estilos base (tamanho, forma, posicionamento base, transições)
        // - 'tipo': (ex: 'urgente') para a cor específica do ponto (definida no CSS)
        gpsMarker.className = `gps-marker ${tipo}`;

        // Define a posição do marcador dinamicamente via JavaScript
        gpsMarker.style.left = `${xPercent.toFixed(2)}%`; // Usar toFixed para evitar números muito longos
        gpsMarker.style.top = `${yPercent.toFixed(2)}%`;

        // Armazena dados úteis no próprio elemento para fácil acesso
        gpsMarker.dataset.tipo = tipo;
        gpsMarker.dataset.x = xPercent.toFixed(2);
        gpsMarker.dataset.y = yPercent.toFixed(2);
        gpsMarker.setAttribute('role', 'button'); // Para acessibilidade, já que é clicável
        gpsMarker.setAttribute('tabindex', '0');  // Permite foco via teclado
        gpsMarker.setAttribute('aria-label', `Marcador tipo ${tipo} na posição ${xPercent.toFixed(0)}%, ${yPercent.toFixed(0)}%`);


        // Evento de clique no marcador para exibir informações
        const exibirDetalhesMarcador = () => {
            alert(
                `Detalhes do Ponto:\n` +
                `ID: ${gpsMarker.id}\n` +
                `Tipo: ${gpsMarker.dataset.tipo}\n` +
                `Localização (aprox.): ${gpsMarker.dataset.x}% Leste, ${gpsMarker.dataset.y}% Topo`
            );
        };
        
        gpsMarker.addEventListener('click', (event) => {
            event.stopPropagation(); // Impede que o clique no marcador crie outro ponto no mapa
            exibirDetalhesMarcador();
        });

        // Permite "clicar" com a tecla Enter ou Espaço quando focado (acessibilidade)
        gpsMarker.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault(); // Impede comportamento padrão (ex: rolar a página com Espaço)
                event.stopPropagation();
                exibirDetalhesMarcador();
            }
        });


        mapContainerElement.appendChild(gpsMarker);
        marcadoresNoMapa.push(gpsMarker); // Adiciona à lista para gerenciamento (ex: limpar)

        console.log(`Marcador '${tipo}' (ID: ${gpsMarker.id}) adicionado em: (${xPercent.toFixed(2)}%, ${yPercent.toFixed(2)}%)`);
    }

    // Evento de clique no elemento do mapa para adicionar um novo ponto
    if (mapaElement) {
        mapaElement.addEventListener("click", (event) => {
            if (!tipoChamadoSelect) { // Se o select não existe, não permite adicionar
                console.warn("Não é possível adicionar marcador: seletor de tipo de chamado não encontrado.");
                return;
            }

            const rect = mapaElement.getBoundingClientRect();
            // Calcula as coordenadas do clique relativas ao elemento 'mapa'
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            // Converte as coordenadas para porcentagem em relação às dimensões do 'mapa'
            const xPercent = (clickX / rect.width) * 100;
            const yPercent = (clickY / rect.height) * 100;

            const tipoSelecionado = tipoChamadoSelect.value;

            // Validação simples para garantir que as porcentagens estão dentro dos limites (0-100)
            // Embora o cálculo deva sempre resultar nisso, é uma boa prática defensiva.
            if (xPercent >= 0 && xPercent <= 100 && yPercent >= 0 && yPercent <= 100) {
                adicionarMarcador(xPercent, yPercent, tipoSelecionado);
            } else {
                console.warn("Coordenadas de clique fora dos limites esperados do mapa.", { xPercent, yPercent });
            }
        });
    }


    // Evento para o botão de limpar todos os pontos do mapa
    if (btnLimparPontos) {
        btnLimparPontos.addEventListener("click", () => {
            if (marcadoresNoMapa.length === 0) {
                console.log("Nenhum marcador para remover.");
                // Poderia exibir uma mensagem para o usuário também
                // alert("Não há marcadores no mapa para limpar.");
                return;
            }

            // Confirmação opcional antes de limpar
            // if (!confirm("Tem certeza que deseja remover todos os marcadores do mapa?")) {
            //     return;
            // }

            marcadoresNoMapa.forEach(marker => marker.remove()); // Remove cada marcador do DOM
            marcadoresNoMapa = []; // Limpa o array de referências
            markerIdCounter = 0;   // Opcional: resetar o contador de ID
            console.log("Todos os marcadores foram removidos do mapa.");
        });
    }

    console.log("Sistema de mapa interativo inicializado com sucesso.");
    // Aqui você poderia adicionar funcionalidades futuras, como carregar marcadores salvos.
});