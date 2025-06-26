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
    if (!mapaElement || !mapContainerElement) {
        console.error("Elemento do mapa ou contêiner não encontrado.");
        return;
    }

    // Array para armazenar referências aos elementos DOM dos marcadores
    let marcadoresNoMapa = [];
    let markerIdCounter = 0; // Contador para IDs únicos dos marcadores

    function adicionarMarcador(xPercent, yPercent, tipo) {
        const gpsMarker = document.createElement("div");
        markerIdCounter++;
        gpsMarker.id = `marker-${markerIdCounter}`;
        gpsMarker.className = `gps-marker ${tipo}`;
        gpsMarker.style.left = `${xPercent.toFixed(2)}%`;
        gpsMarker.style.top = `${yPercent.toFixed(2)}%`;
        gpsMarker.style.position = "absolute";
        gpsMarker.style.pointerEvents = "auto";
        gpsMarker.setAttribute('role', 'button');
        gpsMarker.setAttribute('tabindex', '0');
        gpsMarker.setAttribute('aria-label', `Marcador tipo ${tipo} na posição ${xPercent.toFixed(0)}%, ${yPercent.toFixed(0)}%`);

        gpsMarker.addEventListener('click', (event) => {
            event.stopPropagation();
            alert(
                `Detalhes do Ponto:\n` +
                `ID: ${gpsMarker.id}\n` +
                `Tipo: ${tipo}\n` +
                `Localização (aprox.): ${xPercent.toFixed(2)}% Leste, ${yPercent.toFixed(2)}% Topo`
            );
        });

        gpsMarker.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                gpsMarker.click();
            }
        });

        mapContainerElement.appendChild(gpsMarker);
        marcadoresNoMapa.push(gpsMarker);
    }

    // Evento de clique no mapa (imagem)
  if (mapaElement) {
    mapContainerElement.style.position = "relative";
    mapaElement.style.display = "block";

    // Só adiciona o evento após a imagem carregar
    if (mapaElement.complete) {
        ativarClick();
    } else {
        mapaElement.addEventListener('load', ativarClick);
    }

    function ativarClick() {
        mapaElement.addEventListener("click", (event) => {
            if (!tipoChamadoSelect) return;
            const rect = mapaElement.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
            const xPercent = (clickX / rect.width) * 100;
            const yPercent = (clickY / rect.height) * 100;
            const tipoSelecionado = tipoChamadoSelect.value;
            if (xPercent >= 0 && xPercent <= 100 && yPercent >= 0 && yPercent <= 100) {
                adicionarMarcador(xPercent, yPercent, tipoSelecionado);
            }
        });
    }
}

    // Limpar todos os pontos
    if (btnLimparPontos) {
        btnLimparPontos.addEventListener("click", () => {
            marcadoresNoMapa.forEach(marker => marker.remove());
            marcadoresNoMapa = [];
            markerIdCounter = 0;
        });
    }
});