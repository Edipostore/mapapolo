document.addEventListener("DOMContentLoaded", () => {
    // Elementos principais
    const mapaElement = document.getElementById("mapa");
    const marcadoresContainer = document.getElementById("marcadores");
    const btnLimparPontos = document.getElementById("btn-limpar-pontos");
    const btnExportar = document.getElementById("btn-exportar");
    const tipoChamadoSelect = document.getElementById("tipo-chamado");
    const listaChamados = document.getElementById("lista-chamados");
    const filtros = document.querySelectorAll("#filtros input[type=checkbox]");
    const modal = document.getElementById("modal-edicao");
    const selectModal = document.getElementById("modal-tipo");
    const btnSalvarModal = document.getElementById("modal-salvar");
    const btnCancelarModal = document.getElementById("modal-cancelar");
    const mapWrapper = document.getElementById("map-wrapper");

    let chamados = JSON.parse(localStorage.getItem("chamados") || "[]");
    let marcadoresNoMapa = [];
    let markerIdCounter = chamados.length ? Math.max(...chamados.map(c => c.id)) + 1 : 1;
    let ultimoPonto = null; // Para centralizar no último ponto ao dar zoom

    // Função para salvar chamados no localStorage
    function salvarChamados() {
        localStorage.setItem("chamados", JSON.stringify(chamados));
    }

    // Função para atualizar a lista lateral
    function atualizarLista() {
        listaChamados.innerHTML = "";
        chamados.forEach(chamado => {
            if (!filtroAtivo(chamado.tipo)) return;
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${iconeTipo(chamado.tipo)} ${chamado.tipo.toUpperCase()}</strong>
                <br>
                <small>${chamado.dataHora}</small>
                <br>
                <button class="editar-chamado" data-id="${chamado.id}"><i class="fa fa-edit"></i> Editar</button>
                <button class="remover-chamado" data-id="${chamado.id}"><i class="fa fa-trash"></i> Remover</button>
            `;
            listaChamados.appendChild(li);
        });

        // Eventos dos botões de editar/remover
        document.querySelectorAll(".editar-chamado").forEach(btn => {
            btn.addEventListener("click", e => {
                const id = Number(btn.getAttribute("data-id"));
                editarChamado(id);
            });
        });
        document.querySelectorAll(".remover-chamado").forEach(btn => {
            btn.addEventListener("click", e => {
                const id = Number(btn.getAttribute("data-id"));
                removerChamado(id);
            });
        });
    }

    // Função para verificar filtro ativo
    function filtroAtivo(tipo) {
        const filtro = Array.from(filtros).find(f => f.value === tipo);
        return filtro && filtro.checked;
    }

    // Função para retornar ícone do tipo
    function iconeTipo(tipo) {
        switch (tipo) {
            case "urgente": return "🚨";
            case "ronda": return "👮";
            case "preventiva": return "🛠️";
            default: return "";
        }
    }

    // Função para adicionar marcador
    function adicionarMarcador(xPercent, yPercent, tipo) {
        const id = markerIdCounter++;
        const dataHora = new Date().toLocaleString();
        const gpsMarker = document.createElement("div");
        gpsMarker.className = `gps-marker ${tipo}`;
        gpsMarker.style.left = `${xPercent}%`;
        gpsMarker.style.top = `${yPercent}%`;
        gpsMarker.setAttribute("data-tooltip", `${tipo.toUpperCase()} - ${dataHora}`);
        gpsMarker.setAttribute("data-id", id);

        gpsMarker.addEventListener("click", (e) => {
            e.stopPropagation();
            editarChamado(id);
        });

        marcadoresContainer.appendChild(gpsMarker);
        marcadoresNoMapa.push(gpsMarker);

        chamados.push({ id, tipo, dataHora, xPercent, yPercent });
        ultimoPonto = { xPercent, yPercent }; // Salva o último ponto
        salvarChamados();
        atualizarLista();
    }

    // Função para remover chamado
    function removerChamado(id) {
        chamados = chamados.filter(c => c.id !== id);
        salvarChamados();
        atualizarLista();
        // Remove marcador do mapa
        const marker = document.querySelector(`.gps-marker[data-id="${id}"]`);
        if (marker) marker.remove();
    }

    // Função para redesenhar marcadores
    function desenharMarcadores() {
        marcadoresContainer.innerHTML = "";
        marcadoresNoMapa = [];
        chamados.forEach(chamado => {
            if (!filtroAtivo(chamado.tipo)) return;
            const gpsMarker = document.createElement("div");
            gpsMarker.className = `gps-marker ${chamado.tipo}`;
            gpsMarker.style.left = `${chamado.xPercent}%`;
            gpsMarker.style.top = `${chamado.yPercent}%`;
            gpsMarker.setAttribute("data-tooltip", `${chamado.tipo.toUpperCase()} - ${chamado.dataHora}`);
            gpsMarker.setAttribute("data-id", chamado.id);

            gpsMarker.addEventListener("click", (e) => {
                e.stopPropagation();
                editarChamado(chamado.id);
            });

            marcadoresContainer.appendChild(gpsMarker);
            marcadoresNoMapa.push(gpsMarker);
        });
    }

    // Evento de clique no mapa para adicionar marcador
    function ativarClick() {
        mapaElement.addEventListener("click", (event) => {
            const rect = mapaElement.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;
            const tipo = tipoChamadoSelect.value;
            if (xPercent >= 0 && xPercent <= 100 && yPercent >= 0 && yPercent <= 100) {
                adicionarMarcador(xPercent, yPercent, tipo);
                desenharMarcadores();
            }
        });
    }

    if (mapaElement.complete) {
        ativarClick();
    } else {
        mapaElement.addEventListener("load", ativarClick);
    }

    // Limpar pontos
    if (btnLimparPontos) {
        btnLimparPontos.addEventListener("click", () => {
            marcadoresNoMapa.forEach(marker => marker.remove());
            marcadoresNoMapa = [];
            chamados = [];
            markerIdCounter = 1;
            ultimoPonto = null;
            salvarChamados();
            atualizarLista();
        });
    }

    // Exportar chamados
    if (btnExportar) {
        btnExportar.addEventListener("click", () => {
            const data = JSON.stringify(chamados, null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "chamados.json";
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Filtros
    filtros.forEach(filtro => {
        filtro.addEventListener("change", () => {
            desenharMarcadores();
            atualizarLista();
        });
    });

    // Função para editar chamado
    function editarChamado(id) {
        if (!modal || !selectModal || !btnSalvarModal || !btnCancelarModal) return;

        const chamado = chamados.find(c => c.id === id);
        if (!chamado) return;

        selectModal.value = chamado.tipo;
        modal.classList.add("show");

        function fecharModal() {
            modal.classList.remove("show");
            document.removeEventListener("keydown", escHandler);
            modal.removeEventListener("click", outsideClick);
            btnSalvarModal.removeEventListener("click", salvar);
            btnCancelarModal.removeEventListener("click", fecharModal);
        }

        function salvar() {
            chamado.tipo = selectModal.value;
            salvarChamados();

            const marker = document.querySelector(`.gps-marker[data-id="${id}"]`);
            if (marker) {
                marker.className = `gps-marker ${chamado.tipo}`;
                marker.setAttribute("data-tooltip", `${chamado.tipo.toUpperCase()} - ${chamado.dataHora}`);
            }

            atualizarLista();
            desenharMarcadores();
            fecharModal();
        }

        function escHandler(e) {
            if (e.key === "Escape") fecharModal();
        }

        function outsideClick(e) {
            if (e.target === modal) fecharModal();
        }

        btnSalvarModal.addEventListener("click", salvar);
        btnCancelarModal.addEventListener("click", fecharModal);
        document.addEventListener("keydown", escHandler);
        modal.addEventListener("click", outsideClick);
    }

    // Inicialização
    desenharMarcadores();
    atualizarLista();

    // --- ZOOM DO MAPA ---
    const btnZoomIn = document.getElementById("zoom-in");
    const btnZoomOut = document.getElementById("zoom-out");
    const btnZoomReset = document.getElementById("zoom-reset");
    let zoomLevel = 1;
    const ZOOM_STEP = 0.2;
    const ZOOM_MIN = 0.5;
    const ZOOM_MAX = 5;

    // Variáveis para arrastar o mapa
    let isDragging = false;
    let startX, startY, lastX = 0, lastY = 0;

    function aplicarZoom() {
        if (mapWrapper) {
            if (zoomLevel === 1) {
                lastX = 0;
                lastY = 0;
                mapWrapper.style.transform = `scale(1)`;
                mapWrapper.classList.remove("grab", "grabbing");
            } else {
                // Centraliza no último ponto adicionado
                if (ultimoPonto) {
                    const rect = mapWrapper.getBoundingClientRect();
                    const pontoX = rect.width * (ultimoPonto.xPercent / 100);
                    const pontoY = rect.height * (ultimoPonto.yPercent / 100);
                    lastX = (rect.width / 2 - pontoX) * zoomLevel;
                    lastY = (rect.height / 2 - pontoY) * zoomLevel;
                }
                mapWrapper.style.transform = `scale(${zoomLevel}) translate(${lastX / zoomLevel}px, ${lastY / zoomLevel}px)`;
                mapWrapper.classList.add("grab");
            }
            mapWrapper.style.transformOrigin = "top left";
        }
    }

    if (btnZoomIn && btnZoomOut && btnZoomReset) {
        btnZoomIn.addEventListener("click", () => {
            zoomLevel = Math.min(zoomLevel + ZOOM_STEP, ZOOM_MAX);
            aplicarZoom();
        });

        btnZoomOut.addEventListener("click", () => {
            zoomLevel = Math.max(zoomLevel - ZOOM_STEP, ZOOM_MIN);
            aplicarZoom();
        });

        btnZoomReset.addEventListener("click", () => {
            zoomLevel = 1;
            aplicarZoom();
        });
    }

    // Arrastar o mapa com o mouse quando estiver com zoom
    if (mapWrapper) {
        mapWrapper.addEventListener("mousedown", (e) => {
            if (zoomLevel === 1) return;
            isDragging = true;
            startX = e.clientX - lastX;
            startY = e.clientY - lastY;
            mapWrapper.classList.add("grabbing");
            mapWrapper.classList.remove("grab");
        });

        mapWrapper.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            lastX = e.clientX - startX;
            lastY = e.clientY - startY;
            mapWrapper.style.transform = `scale(${zoomLevel}) translate(${lastX / zoomLevel}px, ${lastY / zoomLevel}px)`;
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                mapWrapper.classList.remove("grabbing");
                mapWrapper.classList.add("grab");
            }
        });

        mapWrapper.addEventListener("mouseenter", () => {
            if (zoomLevel > 1) mapWrapper.classList.add("grab");
        });
        mapWrapper.addEventListener("mouseleave", () => {
            mapWrapper.classList.remove("grab");
        });

        // Não há pan com scroll (wheel)
    }
});