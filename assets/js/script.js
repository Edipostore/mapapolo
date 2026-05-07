document.addEventListener("DOMContentLoaded", () => {
  // === ELEMENTOS ===
  const mapa = document.getElementById("mapa");
  const marcadores = document.getElementById("marcadores");
  const mapWrapper = document.getElementById("map-wrapper");
  const rastroSvg = document.getElementById("rastro-svg");
  const tipoSelect = document.getElementById("tipo-registro");
  const nomeInput = document.getElementById("nome-registro");
  const statusSelect = document.getElementById("status-registro");
  const btnLimpar = document.getElementById("btn-limpar");
  const lista = document.getElementById("lista-registros");
  const buscaInput = document.getElementById("busca-registro");
  const turnoSelect = document.getElementById("turno-select");
  const btnTheme = document.getElementById("btn-theme");
  const btnExportar = document.getElementById("btn-exportar");
  const toastContainer = document.getElementById("toast-container");

  // Filtros
  const filtrosElements = document.querySelectorAll("#filtros input[type=checkbox]");
  const filtros = Array.from(filtrosElements);

  // Modal
  const modal = document.getElementById("modal-edicao");
  const modalTipo = document.getElementById("modal-tipo");
  const modalNome = document.getElementById("modal-nome");
  const modalStatus = document.getElementById("modal-status");
  const modalObs = document.getElementById("modal-obs");
  const btnSalvar = document.getElementById("modal-salvar");
  const btnCancelar = document.getElementById("modal-cancelar");

  // Contadores
  const countPessoas = document.getElementById("count-pessoas");
  const countItens = document.getElementById("count-itens");
  const countAlertas = document.getElementById("count-alertas");
  const countTotal = document.getElementById("count-total");

  // Andares
  const tabsAndar = document.querySelectorAll(".tab-andar");
  const andarLabel = document.getElementById("andar-atual-label");

  // Historico
  const btnHistorico = document.getElementById("btn-historico");
  const modalHistorico = document.getElementById("modal-historico");
  const listaHistorico = document.getElementById("lista-historico");
  const histData = document.getElementById("hist-data");
  const histTipoFiltro = document.getElementById("hist-tipo-filtro");
  const btnExportarHist = document.getElementById("btn-exportar-hist");
  const btnHistFechar = document.getElementById("hist-fechar");

  // === ESTADO ===
  let registros = [];
  let logAtividades = [];
  let nextId = 1;
  let andarAtual = "terreo";
  let turnoAtual = detectarTurno();

  // Zoom
  const btnZoomIn = document.getElementById("zoom-in");
  const btnZoomOut = document.getElementById("zoom-out");
  const btnZoomReset = document.getElementById("zoom-reset");
  let zoom = 1, panX = 0, panY = 0;
  let dragging = false, dragStartX, dragStartY;

  // Carregar dados
  try {
    const dadosSalvos = localStorage.getItem("registros_v2");
    if (dadosSalvos) {
      registros = JSON.parse(dadosSalvos);
      if (registros.length > 0) {
        nextId = Math.max(...registros.map(r => r.id)) + 1;
      }
    }
  } catch (e) {
    console.error("Erro ao carregar registros:", e);
    registros = [];
  }

  try {
    const logSalvo = localStorage.getItem("log_atividades");
    if (logSalvo) logAtividades = JSON.parse(logSalvo);
  } catch (e) {
    console.error("Erro ao carregar log:", e);
    logAtividades = [];
  }

  // === UTILIDADES ===
  const TIPOS_PESSOA = ["pessoa", "seguranca", "manutencao", "limpeza"];
  const TIPOS_ITEM = ["radio", "chave", "extintor", "camera", "ferramenta", "outro-item"];

  function ehPessoa(tipo) { return TIPOS_PESSOA.includes(tipo); }
  function ehItem(tipo) { return TIPOS_ITEM.includes(tipo); }

  function detectarTurno() {
    const h = new Date().getHours();
    if (h >= 6 && h < 14) return "manha";
    if (h >= 14 && h < 22) return "tarde";
    return "noite";
  }

  function iconeTipo(tipo) {
    const icones = {
      pessoa: "fa-user", seguranca: "fa-shield-halved",
      manutencao: "fa-wrench", limpeza: "fa-broom",
      radio: "fa-walkie-talkie", chave: "fa-key",
      extintor: "fa-fire-extinguisher", camera: "fa-video",
      ferramenta: "fa-screwdriver-wrench", "outro-item": "fa-box"
    };
    return icones[tipo] || "fa-circle";
  }

  // === PERSISTENCIA ===
  function salvar() {
    try {
      localStorage.setItem("registros_v2", JSON.stringify(registros));
    } catch (e) {
      console.error("Erro ao salvar:", e);
      toast("Erro ao salvar dados!", "erro");
    }
  }

  function salvarLog() {
    try {
      localStorage.setItem("log_atividades", JSON.stringify(logAtividades.slice(-1000)));
    } catch (e) {
      console.error("Erro ao salvar log:", e);
    }
  }

  function registrarLog(acao, nome, detalhes) {
    logAtividades.push({
      acao, nome, detalhes: detalhes || "",
      turno: turnoAtual, andar: andarAtual,
      dataHora: new Date().toLocaleString("pt-BR"),
      timestamp: new Date().toISOString()
    });
    salvarLog();
  }

  // === TOAST ===
  function toast(msg, tipo) {
    const el = document.createElement("div");
    el.className = "toast" + (tipo ? " toast-" + tipo : "");
    const icone = tipo === "alerta" ? "fa-triangle-exclamation" : tipo === "sucesso" ? "fa-check" : tipo === "erro" ? "fa-xmark" : "fa-info-circle";
    el.innerHTML = '<i class="fa-solid ' + icone + '"></i> ' + msg;
    toastContainer.appendChild(el);
    setTimeout(function() {
      if (el.parentNode) el.remove();
    }, 3500);
  }

  function alertaSonoro() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 800; gain.gain.value = 0.3;
      osc.start();
      setTimeout(function() { osc.stop(); ctx.close(); }, 200);
    } catch (e) {}
  }

  function verificarAlertas() {
    var alertas = registros.filter(function(r) { return r.status === "alerta" && r.andar === andarAtual; });
    if (alertas.length > 0) {
      toast(alertas.length + " alerta(s) ativo(s) neste andar!", "alerta");
      alertaSonoro();
    }
  }

  // === FILTROS ===
  function filtroAtivo(tipo) {
    var fPessoa = filtros.find(function(f) { return f.value === "pessoa"; });
    var fItem = filtros.find(function(f) { return f.value === "item"; });
    if (ehPessoa(tipo) && fPessoa && !fPessoa.checked) return false;
    if (ehItem(tipo) && fItem && !fItem.checked) return false;
    return true;
  }

  function filtroAlerta(reg) {
    var fAlerta = filtros.find(function(f) { return f.value === "alerta"; });
    if (fAlerta && !fAlerta.checked && reg.status === "alerta") return false;
    return true;
  }

  function filtrarRegistros() {
    var resultado = registros.filter(function(r) { return r.andar === andarAtual; });
    resultado = resultado.filter(function(r) { return filtroAtivo(r.tipo) && filtroAlerta(r); });
    if (buscaInput) {
      var busca = buscaInput.value.trim().toLowerCase();
      if (busca) {
        resultado = resultado.filter(function(r) {
          return r.nome.toLowerCase().indexOf(busca) !== -1 ||
                 r.tipo.toLowerCase().indexOf(busca) !== -1 ||
                 (r.obs && r.obs.toLowerCase().indexOf(busca) !== -1);
        });
      }
    }
    return resultado;
  }

  // === CONTADORES ===
  function atualizarContadores() {
    var ativos = registros.filter(function(r) { return r.andar === andarAtual; });
    countPessoas.textContent = ativos.filter(function(r) { return ehPessoa(r.tipo) && r.status !== "inativo"; }).length;
    countItens.textContent = ativos.filter(function(r) { return ehItem(r.tipo); }).length;
    countAlertas.textContent = ativos.filter(function(r) { return r.status === "alerta"; }).length;
    countTotal.textContent = ativos.length;
  }

  // === RASTRO ===
  function renderRastro() {
    rastroSvg.innerHTML = "";
    var visiveis = filtrarRegistros();
    visiveis.forEach(function(reg) {
      if (!reg.historico || reg.historico.length < 2) return;
      var polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      var rect = rastroSvg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      var pontos = reg.historico.map(function(h) {
        return (h.x / 100) * rect.width + "," + (h.y / 100) * rect.height;
      }).join(" ");
      polyline.setAttribute("points", pontos);
      polyline.style.strokeWidth = (2 / zoom).toString();
      rastroSvg.appendChild(polyline);
    });
  }

  // === RENDER MARCADORES (CORRIGIDO) ===
  function renderMarcadores() {
    marcadores.innerHTML = "";
    var visiveis = filtrarRegistros();
    
    visiveis.forEach(function(reg) {
      var el = document.createElement("div");
      el.className = "gps-marker " + reg.tipo + " status-" + reg.status;
      el.style.position = "absolute";
      el.style.left = reg.x + "%";
      el.style.top = reg.y + "%";
      el.setAttribute("data-tooltip", reg.nome + " (" + reg.status + ")");
      el.setAttribute("data-id", reg.id);
      
      el.addEventListener("click", function(e) {
        e.stopPropagation();
        abrirModal(reg.id);
      });
      
      marcadores.appendChild(el);
    });
    
    ajustarMarcadoresComZoom();
  }

  function ajustarMarcadoresComZoom() {
    var markers = marcadores.querySelectorAll(".gps-marker");
    markers.forEach(function(marker) {
      var scale = 1 / zoom;
      marker.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
    });
  }

  // === RENDER LISTA ===
  function renderLista() {
    lista.innerHTML = "";
    var visiveis = filtrarRegistros();
    if (visiveis.length === 0) {
      lista.innerHTML = '<li style="text-align:center;color:var(--text-muted);border:none;background:none;">Nenhum registro encontrado</li>';
      return;
    }
    visiveis.forEach(function(reg) {
      var li = document.createElement("li");
      li.className = "tipo-" + reg.tipo;
      li.innerHTML = '<div class="registro-header">' +
        '<span class="registro-nome"><i class="fa-solid ' + iconeTipo(reg.tipo) + '"></i> ' + reg.nome + '</span>' +
        '<span class="registro-badge badge-' + reg.status + '">' + reg.status.replace("-", " ") + '</span>' +
        '</div>' +
        '<div class="registro-meta">' + reg.dataHora + ' | Turno: ' + (reg.turno || "-") + (reg.obs ? " | " + reg.obs : "") + '</div>' +
        '<div class="registro-actions">' +
        '<button class="btn-editar" data-id="' + reg.id + '" title="Editar"><i class="fa-solid fa-pen"></i></button>' +
        '<button class="btn-mover" data-id="' + reg.id + '" title="Mover posição"><i class="fa-solid fa-arrows-up-down-left-right"></i></button>' +
        '<button class="btn-remover" data-id="' + reg.id + '" title="Remover"><i class="fa-solid fa-trash"></i></button>' +
        '</div>';
      lista.appendChild(li);
    });
    lista.querySelectorAll(".btn-editar").forEach(function(btn) {
      btn.addEventListener("click", function() { abrirModal(Number(btn.dataset.id)); });
    });
    lista.querySelectorAll(".btn-remover").forEach(function(btn) {
      btn.addEventListener("click", function() { remover(Number(btn.dataset.id)); });
    });
    lista.querySelectorAll(".btn-mover").forEach(function(btn) {
      btn.addEventListener("click", function() { iniciarMovimento(Number(btn.dataset.id)); });
    });
  }

  function render() { renderMarcadores(); renderLista(); renderRastro(); atualizarContadores(); }

  // === ADICIONAR ===
  function adicionar(x, y) {
    var tipo = tipoSelect.value;
    var nome = nomeInput.value.trim() || tipo.charAt(0).toUpperCase() + tipo.slice(1);
    var reg = {
      id: nextId++, tipo: tipo, nome: nome, status: statusSelect.value,
      x: x, y: y, andar: andarAtual, turno: turnoAtual, obs: "",
      dataHora: new Date().toLocaleString("pt-BR"),
      historico: [{ x: x, y: y, dataHora: new Date().toISOString() }]
    };
    registros.push(reg);
    nomeInput.value = "";
    salvar();
    registrarLog("adicionado", nome, "Tipo: " + tipo + ", Status: " + reg.status + ", Andar: " + andarAtual);
    render();
    toast(nome + " adicionado ao mapa", "sucesso");
  }

  // === REMOVER ===
  function remover(id) {
    var reg = registros.find(function(r) { return r.id === id; });
    if (!reg) return;
    if (confirm("Deseja realmente remover " + reg.nome + "?")) {
      registros = registros.filter(function(r) { return r.id !== id; });
      salvar();
      registrarLog("removido", reg.nome, "Tipo: " + reg.tipo);
      render();
      toast(reg.nome + " removido", "erro");
    }
  }

  // === MOVER ===
  var moverIdAtivo = null;
  function iniciarMovimento(id) {
    moverIdAtivo = id;
    toast("Clique no mapa para reposicionar o registro", "alerta");
    mapWrapper.style.cursor = "move";
  }

  // === MODAL ===
  function abrirModal(id) {
    var reg = registros.find(function(r) { return r.id === id; });
    if (!reg) return;
    modalTipo.value = reg.tipo;
    modalNome.value = reg.nome;
    modalStatus.value = reg.status;
    modalObs.value = reg.obs || "";
    modal.classList.remove("hidden");

    function fechar() {
      modal.classList.add("hidden");
      btnSalvar.removeEventListener("click", salvarEdit);
      btnCancelar.removeEventListener("click", fechar);
      document.removeEventListener("keydown", esc);
      modal.removeEventListener("click", fora);
    }

    function salvarEdit() {
      reg.tipo = modalTipo.value;
      reg.nome = modalNome.value.trim() || reg.tipo;
      reg.status = modalStatus.value;
      reg.obs = modalObs.value.trim();
      salvar(); render(); fechar();
      registrarLog("editado", reg.nome, "Tipo: " + reg.tipo + ", Status: " + reg.status);
      toast("Registro atualizado", "sucesso");
    }

    function esc(e) { if (e.key === "Escape") fechar(); }
    function fora(e) { if (e.target === modal) fechar(); }
    btnSalvar.addEventListener("click", salvarEdit);
    btnCancelar.addEventListener("click", fechar);
    document.addEventListener("keydown", esc);
    modal.addEventListener("click", fora);
  }

  // === CLIQUE NO MAPA (CORRIGIDO) ===
  function onMapClick(e) {
    e.preventDefault();
    var rect = mapa.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width) * 100;
    var y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Garantir que está dentro dos limites
    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    if (moverIdAtivo !== null) {
      var reg = registros.find(function(r) { return r.id === moverIdAtivo; });
      if (reg) {
        reg.x = x; reg.y = y;
        if (!reg.historico) reg.historico = [];
        reg.historico.push({ x: x, y: y, dataHora: new Date().toISOString() });
        salvar(); render();
        registrarLog("movido", reg.nome, "Nova posição: " + x.toFixed(1) + "%, " + y.toFixed(1) + "%");
        toast(reg.nome + " movido para nova posição", "sucesso");
      }
      moverIdAtivo = null;
      mapWrapper.style.cursor = zoom > 1 ? "grab" : "crosshair";
      return;
    }

    if (zoom > 1) return;
    adicionar(x, y);
  }

  // Configurar clique no mapa
  mapWrapper.addEventListener("click", onMapClick);

  // === LIMPAR ===
  btnLimpar.addEventListener("click", function() {
    var registrosAndar = registros.filter(function(r) { return r.andar === andarAtual; });
    if (registrosAndar.length === 0) {
      toast("Nenhum registro para limpar neste andar", "alerta");
      return;
    }
    if (!confirm("Remover TODOS os " + registrosAndar.length + " registros do andar " + andarAtual + "?")) return;
    registros = registros.filter(function(r) { return r.andar !== andarAtual; });
    salvar();
    registrarLog("removido", "TODOS", "Limpeza geral do andar: " + andarAtual);
    render();
    toast("Registros limpos", "erro");
  });

  // === FILTROS E BUSCA ===
  filtros.forEach(function(f) { if (f) f.addEventListener("change", render); });
  if (buscaInput) buscaInput.addEventListener("input", render);

  // === ANDARES ===
  tabsAndar.forEach(function(tab) {
    tab.addEventListener("click", function() {
      tabsAndar.forEach(function(t) { t.classList.remove("active"); });
      tab.classList.add("active");
      andarAtual = tab.dataset.andar;
      andarLabel.textContent = tab.textContent;
      render();
    });
  });

  // === TURNO ===
  turnoSelect.value = turnoAtual;
  turnoSelect.addEventListener("change", function() { turnoAtual = turnoSelect.value; });

  // === DARK MODE ===
  var savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  atualizarIconeTema(savedTheme);

  btnTheme.addEventListener("click", function() {
    var atual = document.documentElement.getAttribute("data-theme");
    var novo = atual === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", novo);
    localStorage.setItem("theme", novo);
    atualizarIconeTema(novo);
  });

  function atualizarIconeTema(theme) {
    btnTheme.innerHTML = theme === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }

  // === EXPORTAR CSV ===
  btnExportar.addEventListener("click", function() {
    var dados = registros.filter(function(r) { return r.andar === andarAtual; });
    if (dados.length === 0) { toast("Nenhum dado para exportar", "alerta"); return; }
    var header = "ID,Tipo,Nome,Status,Andar,Turno,Data/Hora,Observação,X%,Y%\n";
    var linhas = dados.map(function(r) {
      return r.id + "," + r.tipo + "," + r.nome + "," + r.status + "," + r.andar + "," + (r.turno || "") + "," + r.dataHora + ',"' + (r.obs || "") + '",' + r.x.toFixed(2) + "," + r.y.toFixed(2);
    }).join("\n");
    var blob = new Blob([header + linhas], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url;
    a.download = "rastreamento_" + andarAtual + "_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click(); URL.revokeObjectURL(url);
    toast("CSV exportado com sucesso!", "sucesso");
  });

  // === ZOOM ===
  function aplicarZoom() {
    mapWrapper.style.transform = "scale(" + zoom + ") translate(" + (panX / zoom) + "px, " + (panY / zoom) + "px)";
    mapWrapper.style.transformOrigin = "center center";
    mapWrapper.style.cursor = zoom > 1 ? (dragging ? "grabbing" : "grab") : (moverIdAtivo !== null ? "move" : "crosshair");
    ajustarMarcadoresComZoom();
  }

  if (btnZoomIn) btnZoomIn.addEventListener("click", function() { zoom = Math.min(zoom + 0.3, 5); aplicarZoom(); });
  if (btnZoomOut) btnZoomOut.addEventListener("click", function() { zoom = Math.max(zoom - 0.3, 1); if (zoom === 1) { panX = 0; panY = 0; } aplicarZoom(); });
  if (btnZoomReset) btnZoomReset.addEventListener("click", function() { zoom = 1; panX = 0; panY = 0; aplicarZoom(); });

  var mapContainer = document.getElementById("map-container");
  if (mapContainer) {
    mapContainer.addEventListener("wheel", function(e) {
      e.preventDefault();
      if (e.deltaY < 0) zoom = Math.min(zoom + 0.15, 5);
      else zoom = Math.max(zoom - 0.15, 1);
      if (zoom === 1) { panX = 0; panY = 0; }
      aplicarZoom();
    }, { passive: false });
  }

  mapWrapper.addEventListener("mousedown", function(e) {
    if (zoom <= 1 || moverIdAtivo !== null) return;
    dragging = true; dragStartX = e.clientX - panX; dragStartY = e.clientY - panY;
    mapWrapper.style.cursor = "grabbing"; e.preventDefault();
  });

  window.addEventListener("mousemove", function(e) {
    if (!dragging) return;
    panX = e.clientX - dragStartX; panY = e.clientY - dragStartY;
    mapWrapper.style.transform = "scale(" + zoom + ") translate(" + (panX / zoom) + "px, " + (panY / zoom) + "px)";
    ajustarMarcadoresComZoom();
  });

  window.addEventListener("mouseup", function() {
    if (dragging) { dragging = false; mapWrapper.style.cursor = zoom > 1 ? "grab" : "crosshair"; }
  });

  // === VERIFICACAO PERIODICA ===
  setInterval(function() {
    var alertas = registros.filter(function(r) { return r.status === "alerta" && r.andar === andarAtual; });
    if (alertas.length > 0) { countAlertas.style.color = "var(--warning)"; countAlertas.style.animation = "pulse 1s infinite"; }
    else { countAlertas.style.color = ""; countAlertas.style.animation = ""; }
  }, 5000);

  // === HISTORICO ===
  function renderHistorico() {
    var logs = [].concat(logAtividades).reverse();
    if (histData && histData.value) logs = logs.filter(function(l) { return l.timestamp && l.timestamp.indexOf(histData.value) === 0; });
    if (histTipoFiltro && histTipoFiltro.value) logs = logs.filter(function(l) { return l.acao === histTipoFiltro.value; });
    listaHistorico.innerHTML = "";
    if (logs.length === 0) {
      listaHistorico.innerHTML = '<li style="justify-content:center;color:var(--text-muted);">Nenhuma atividade registrada</li>';
      return;
    }
    var icones = { adicionado: "fa-plus", editado: "fa-pen", movido: "fa-arrows-up-down-left-right", removido: "fa-trash" };
    logs.slice(0, 200).forEach(function(log) {
      var li = document.createElement("li");
      li.innerHTML = '<div class="hist-icon ' + log.acao + '"><i class="fa-solid ' + (icones[log.acao] || "fa-circle") + '"></i></div>' +
        '<div class="hist-info"><strong>' + log.nome + ' - ' + log.acao + '</strong>' +
        '<small>' + log.dataHora + ' | Turno: ' + log.turno + ' | ' + (log.detalhes || "") + '</small></div>';
      listaHistorico.appendChild(li);
    });
  }

  if (btnHistorico) btnHistorico.addEventListener("click", function() { modalHistorico.classList.remove("hidden"); renderHistorico(); });
  if (btnHistFechar) btnHistFechar.addEventListener("click", function() { modalHistorico.classList.add("hidden"); });
  if (modalHistorico) modalHistorico.addEventListener("click", function(e) { if (e.target === modalHistorico) modalHistorico.classList.add("hidden"); });
  if (histData) histData.addEventListener("change", renderHistorico);
  if (histTipoFiltro) histTipoFiltro.addEventListener("change", renderHistorico);

  if (btnExportarHist) {
    btnExportarHist.addEventListener("click", function() {
      if (logAtividades.length === 0) { toast("Nenhum histórico para exportar", "alerta"); return; }
      var header = "Data/Hora,Ação,Nome,Detalhes,Turno,Andar\n";
      var linhas = logAtividades.map(function(l) {
        return l.dataHora + "," + l.acao + "," + l.nome + ',"' + (l.detalhes || "") + '",' + l.turno + "," + l.andar;
      }).join("\n");
      var blob = new Blob([header + linhas], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url;
      a.download = "historico_" + new Date().toISOString().slice(0, 10) + ".csv";
      a.click(); URL.revokeObjectURL(url);
      toast("Histórico exportado!", "sucesso");
    });
  }

  // === INIT ===
  render();
  setTimeout(verificarAlertas, 2000);
});