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
  const TIPOS_PESSOA = ["pessoa", "seguranca", "manutencao", "limpeza"];
  const TIPOS_ITEM = ["radio", "chave", "extintor", "camera", "ferramenta", "outro-item"];
  const TIPOS_VALIDOS = [...TIPOS_PESSOA, ...TIPOS_ITEM];
  const STATUS_VALIDOS = ["ativo", "inativo", "alerta", "em-movimento"];
  const ANDARES_VALIDOS = ["terreo", "piso1", "piso2", "externo"];
  const TURNOS_VALIDOS = ["manha", "tarde", "noite"];

  function validarRegistros(valor) {
    if (!Array.isArray(valor)) return [];
    return valor.flatMap(function(reg) {
      if (!reg || !Number.isInteger(reg.id) || reg.id < 1 ||
          !TIPOS_VALIDOS.includes(reg.tipo) || typeof reg.nome !== "string" ||
          !STATUS_VALIDOS.includes(reg.status) || !ANDARES_VALIDOS.includes(reg.andar) ||
          !Number.isFinite(reg.x) || reg.x < 0 || reg.x > 100 ||
          !Number.isFinite(reg.y) || reg.y < 0 || reg.y > 100) return [];
      var historico = Array.isArray(reg.historico) ? reg.historico.flatMap(function(ponto) {
        if (!ponto || !Number.isFinite(ponto.x) || ponto.x < 0 || ponto.x > 100 ||
            !Number.isFinite(ponto.y) || ponto.y < 0 || ponto.y > 100) return [];
        return [{ x: ponto.x, y: ponto.y, dataHora: typeof ponto.dataHora === "string" ? ponto.dataHora : "" }];
      }) : [];
      return [{
        id: reg.id,
        tipo: reg.tipo,
        nome: reg.nome.slice(0, 120),
        status: reg.status,
        x: reg.x,
        y: reg.y,
        andar: reg.andar,
        turno: TURNOS_VALIDOS.includes(reg.turno) ? reg.turno : "",
        obs: typeof reg.obs === "string" ? reg.obs.slice(0, 500) : "",
        dataHora: typeof reg.dataHora === "string" ? reg.dataHora : "",
        historico: historico.slice(-500)
      }];
    });
  }

  function validarHistorico(valor) {
    if (!Array.isArray(valor)) return [];
    return valor.flatMap(function(log) {
      if (!log || !["adicionado", "editado", "movido", "removido"].includes(log.acao) ||
          typeof log.nome !== "string") return [];
      return [{
        acao: log.acao,
        nome: log.nome.slice(0, 120),
        detalhes: typeof log.detalhes === "string" ? log.detalhes.slice(0, 500) : "",
        turno: TURNOS_VALIDOS.includes(log.turno) ? log.turno : "",
        andar: ANDARES_VALIDOS.includes(log.andar) ? log.andar : "",
        dataHora: typeof log.dataHora === "string" ? log.dataHora : "",
        timestamp: typeof log.timestamp === "string" ? log.timestamp : ""
      }];
    }).slice(-1000);
  }

  // Zoom
  const btnZoomIn = document.getElementById("zoom-in");
  const btnZoomOut = document.getElementById("zoom-out");
  const btnZoomReset = document.getElementById("zoom-reset");
  let zoom = 1, panX = 0, panY = 0;
  let dragging = false, dragStartX, dragStartY;
  let suppressNextClick = false;

  // Carregar dados
  try {
    const dadosSalvos = localStorage.getItem("registros_v2");
    if (dadosSalvos) registros = validarRegistros(JSON.parse(dadosSalvos));
    nextId = registros.reduce(function(maior, reg) { return Math.max(maior, reg.id); }, 0) + 1;
  } catch (e) {
    console.error("Erro ao carregar registros:", e);
    registros = [];
  }

  try {
    const logSalvo = localStorage.getItem("log_atividades");
    if (logSalvo) logAtividades = validarHistorico(JSON.parse(logSalvo));
  } catch (e) {
    console.error("Erro ao carregar log:", e);
    logAtividades = [];
  }

  // === UTILIDADES ===
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
      toast("Não foi possível salvar o histórico.", "erro");
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
    const icon = document.createElement("i");
    icon.className = "fa-solid " + icone;
    icon.setAttribute("aria-hidden", "true");
    el.append(icon, document.createTextNode(" " + String(msg)));
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
    } catch (e) {
      console.warn("Não foi possível reproduzir o alerta sonoro:", e);
    }
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
    rastroSvg.replaceChildren();
    var visiveis = filtrarRegistros();
    visiveis.forEach(function(reg) {
      if (!reg.historico || reg.historico.length < 2) return;
      var polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      var width = rastroSvg.clientWidth;
      var height = rastroSvg.clientHeight;
      if (width === 0 || height === 0) return;
      var pontos = reg.historico.map(function(h) {
        return (h.x / 100) * width + "," + (h.y / 100) * height;
      }).join(" ");
      polyline.setAttribute("points", pontos);
      polyline.style.strokeWidth = "2";
      rastroSvg.appendChild(polyline);
    });
  }

  // === RENDER MARCADORES (CORRIGIDO) ===
  function renderMarcadores() {
    marcadores.replaceChildren();
    var visiveis = filtrarRegistros();
    
    visiveis.forEach(function(reg) {
      var el = document.createElement("div");
      el.className = "gps-marker " + reg.tipo + " status-" + reg.status;
      el.style.position = "absolute";
      el.style.left = reg.x + "%";
      el.style.top = reg.y + "%";
      el.setAttribute("data-tooltip", reg.nome + " (" + reg.status + ")");
      el.setAttribute("data-id", reg.id);
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", reg.nome + ", status " + reg.status + ". Abrir edição.");
      el.addEventListener("click", function(e) {
        e.stopPropagation();
        abrirModal(reg.id);
      });
      el.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          abrirModal(reg.id);
        }
      });

      marcadores.appendChild(el);
    });
    
    ajustarMarcadoresComZoom();
  }

  function ajustarMarcadoresComZoom() {
    var markers = marcadores.querySelectorAll(".gps-marker");
    markers.forEach(function(marker) {
      marker.style.transform = "translate(-50%, -50%)";
    });
  }

  // === RENDER LISTA ===
  function renderLista() {
    lista.replaceChildren();
    var visiveis = filtrarRegistros();
    if (visiveis.length === 0) {
      var vazio = document.createElement("li");
      vazio.className = "empty-state";
      vazio.textContent = "Nenhum registro encontrado";
      lista.appendChild(vazio);
      return;
    }
    visiveis.forEach(function(reg) {
      var li = document.createElement("li");
      li.className = "tipo-" + reg.tipo;
      var header = document.createElement("div");
      header.className = "registro-header";
      var nome = document.createElement("span");
      nome.className = "registro-nome";
      var icone = document.createElement("i");
      icone.className = "fa-solid " + iconeTipo(reg.tipo);
      icone.setAttribute("aria-hidden", "true");
      nome.append(icone, document.createTextNode(" " + reg.nome));
      var badge = document.createElement("span");
      badge.className = "registro-badge badge-" + reg.status;
      badge.textContent = reg.status.replace("-", " ");
      header.append(nome, badge);

      var meta = document.createElement("div");
      meta.className = "registro-meta";
      meta.textContent = reg.dataHora + " | Turno: " + (reg.turno || "-") + (reg.obs ? " | " + reg.obs : "");
      var actions = document.createElement("div");
      actions.className = "registro-actions";
      [
        ["btn-editar", "Editar", "fa-pen"],
        ["btn-mover", "Mover posição", "fa-arrows-up-down-left-right"],
        ["btn-remover", "Remover", "fa-trash"]
      ].forEach(function(config) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = config[0];
        button.dataset.id = String(reg.id);
        button.title = config[1];
        button.setAttribute("aria-label", config[1] + " " + reg.nome);
        var icon = document.createElement("i");
        icon.className = "fa-solid " + config[2];
        icon.setAttribute("aria-hidden", "true");
        button.appendChild(icon);
        actions.appendChild(button);
      });
      li.append(header, meta, actions);
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
    var focoAnterior = document.activeElement;
    var dialogo = modal.querySelector('[role="dialog"]');
    modalTipo.value = reg.tipo;
    modalNome.value = reg.nome;
    modalStatus.value = reg.status;
    modalObs.value = reg.obs || "";
    modal.classList.remove("hidden");
    modalNome.focus();

    function fechar() {
      modal.classList.add("hidden");
      btnSalvar.removeEventListener("click", salvarEdit);
      btnCancelar.removeEventListener("click", fechar);
      document.removeEventListener("keydown", esc);
      modal.removeEventListener("click", fora);
      if (focoAnterior && focoAnterior.isConnected && typeof focoAnterior.focus === "function") {
        focoAnterior.focus();
      } else {
        var botaoEditar = lista.querySelector('.btn-editar[data-id="' + reg.id + '"]');
        if (botaoEditar) botaoEditar.focus();
      }
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

    function esc(e) {
      if (e.key === "Escape") fechar();
      if (e.key === "Tab" && dialogo) {
        var campos = Array.from(dialogo.querySelectorAll("button, input, select")).filter(function(el) {
          return !el.disabled && el.offsetParent !== null;
        });
        if (campos.length === 0) return;
        var primeiro = campos[0];
        var ultimo = campos[campos.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    }
    function fora(e) { if (e.target === modal) fechar(); }
    btnSalvar.addEventListener("click", salvarEdit);
    btnCancelar.addEventListener("click", fechar);
    document.addEventListener("keydown", esc);
    modal.addEventListener("click", fora);
  }

  // === CLIQUE NO MAPA (CORRIGIDO) ===
  function onMapClick(e) {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    e.preventDefault();
    var x = (e.offsetX / mapWrapper.clientWidth) * 100;
    var y = (e.offsetY / mapWrapper.clientHeight) * 100;
    
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
      tabsAndar.forEach(function(t) {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      andarAtual = tab.dataset.andar;
      andarLabel.textContent = tab.textContent;
      render();
    });
  });

  // === TURNO ===
  turnoSelect.value = turnoAtual;
  turnoSelect.addEventListener("change", function() { turnoAtual = turnoSelect.value; });

  // === DARK MODE ===
  var savedTheme = "light";
  try {
    savedTheme = localStorage.getItem("theme") || "light";
  } catch (e) {
    console.error("Erro ao carregar tema:", e);
  }
  if (savedTheme !== "dark" && savedTheme !== "light") savedTheme = "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  atualizarIconeTema(savedTheme);

  btnTheme.addEventListener("click", function() {
    var atual = document.documentElement.getAttribute("data-theme");
    var novo = atual === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", novo);
    try {
      localStorage.setItem("theme", novo);
    } catch (e) {
      console.error("Erro ao salvar tema:", e);
      toast("Não foi possível salvar sua preferência de tema.", "erro");
    }
    atualizarIconeTema(novo);
  });

  function atualizarIconeTema(theme) {
    var icon = document.createElement("i");
    icon.className = "fa-solid " + (theme === "dark" ? "fa-sun" : "fa-moon");
    icon.setAttribute("aria-hidden", "true");
    btnTheme.replaceChildren(icon);
    btnTheme.setAttribute("aria-label", theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro");
  }

  function csvField(value) {
    var text = String(value == null ? "" : value);
    if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function baixarCsv(nomeArquivo, cabecalho, linhas) {
    var conteudo = "\uFEFF" + [cabecalho, ...linhas].map(function(linha) {
      return linha.map(csvField).join(",");
    }).join("\r\n");
    var url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8;" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  }

  // === EXPORTAR CSV ===
  btnExportar.addEventListener("click", function() {
    var dados = registros.filter(function(r) { return r.andar === andarAtual; });
    if (dados.length === 0) { toast("Nenhum dado para exportar", "alerta"); return; }
    baixarCsv(
      "rastreamento_" + andarAtual + "_" + new Date().toISOString().slice(0, 10) + ".csv",
      ["ID", "Tipo", "Nome", "Status", "Andar", "Turno", "Data/Hora", "Observação", "X%", "Y%"],
      dados.map(function(r) {
        return [r.id, r.tipo, r.nome, r.status, r.andar, r.turno, r.dataHora, r.obs, r.x.toFixed(2), r.y.toFixed(2)];
      })
    );
    toast("CSV exportado com sucesso!", "sucesso");
  });

  // === ZOOM ===
  function definirTransformacaoMapa() {
    var inclinacao = getComputedStyle(mapContainer).getPropertyValue("--map-tilt").trim() || "6deg";
    mapWrapper.style.width = (zoom * 100) + "%";
    mapWrapper.style.height = (zoom * 100) + "%";
    mapWrapper.style.setProperty("--map-zoom", String(zoom));
    mapWrapper.style.transform = "translate(-50%, -50%) rotateX(" + inclinacao + ") translate(" + panX + "px, " + panY + "px)";
    mapWrapper.style.transformOrigin = "center center";
  }

  function aplicarZoom() {
    definirTransformacaoMapa();
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

  mapWrapper.addEventListener("pointerdown", function(e) {
    if (zoom <= 1 || moverIdAtivo !== null || e.button !== 0 || e.target.closest(".gps-marker")) return;
    dragging = true; dragStartX = e.clientX - panX; dragStartY = e.clientY - panY;
    if (mapWrapper.setPointerCapture) mapWrapper.setPointerCapture(e.pointerId);
    mapWrapper.style.cursor = "grabbing"; e.preventDefault();
  });

  window.addEventListener("pointermove", function(e) {
    if (!dragging) return;
    panX = e.clientX - dragStartX; panY = e.clientY - dragStartY;
    definirTransformacaoMapa();
    ajustarMarcadoresComZoom();
  });

  window.addEventListener("pointerup", function() {
    if (dragging) {
      dragging = false;
      suppressNextClick = true;
      mapWrapper.style.cursor = zoom > 1 ? "grab" : "crosshair";
      window.setTimeout(function() { suppressNextClick = false; }, 500);
    }
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
    listaHistorico.replaceChildren();
    if (logs.length === 0) {
      var vazio = document.createElement("li");
      vazio.className = "empty-state";
      vazio.textContent = "Nenhuma atividade registrada";
      listaHistorico.appendChild(vazio);
      return;
    }
    var icones = { adicionado: "fa-plus", editado: "fa-pen", movido: "fa-arrows-up-down-left-right", removido: "fa-trash" };
    logs.slice(0, 200).forEach(function(log) {
      var li = document.createElement("li");
      var histIcon = document.createElement("div");
      histIcon.className = "hist-icon " + log.acao;
      var icon = document.createElement("i");
      icon.className = "fa-solid " + icones[log.acao];
      icon.setAttribute("aria-hidden", "true");
      histIcon.appendChild(icon);
      var info = document.createElement("div");
      info.className = "hist-info";
      var title = document.createElement("strong");
      title.textContent = log.nome + " - " + log.acao;
      var details = document.createElement("small");
      details.textContent = log.dataHora + " | Turno: " + log.turno + " | " + log.detalhes;
      info.append(title, details);
      li.append(histIcon, info);
      listaHistorico.appendChild(li);
    });
  }

  var focoAnteriorHistorico = null;
  function fecharHistorico() {
    modalHistorico.classList.add("hidden");
    if (focoAnteriorHistorico && typeof focoAnteriorHistorico.focus === "function") focoAnteriorHistorico.focus();
  }
  function abrirHistorico() {
    focoAnteriorHistorico = document.activeElement;
    modalHistorico.classList.remove("hidden");
    renderHistorico();
    histData.focus();
  }
  if (btnHistorico) btnHistorico.addEventListener("click", abrirHistorico);
  if (btnHistFechar) btnHistFechar.addEventListener("click", fecharHistorico);
  if (modalHistorico) modalHistorico.addEventListener("click", function(e) {
    if (e.target === modalHistorico) fecharHistorico();
  });
  if (modalHistorico) modalHistorico.addEventListener("keydown", function(e) {
    if (e.key === "Escape") fecharHistorico();
    if (e.key === "Tab") {
      var dialogo = modalHistorico.querySelector('[role="dialog"]');
      var campos = Array.from(dialogo.querySelectorAll("button, input, select")).filter(function(el) {
        return !el.disabled && el.offsetParent !== null;
      });
      var primeiro = campos[0];
      var ultimo = campos[campos.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
  });
  if (histData) histData.addEventListener("change", renderHistorico);
  if (histTipoFiltro) histTipoFiltro.addEventListener("change", renderHistorico);

  if (btnExportarHist) {
    btnExportarHist.addEventListener("click", function() {
      if (logAtividades.length === 0) { toast("Nenhum histórico para exportar", "alerta"); return; }
      baixarCsv(
        "historico_" + new Date().toISOString().slice(0, 10) + ".csv",
        ["Data/Hora", "Ação", "Nome", "Detalhes", "Turno", "Andar"],
        logAtividades.map(function(l) { return [l.dataHora, l.acao, l.nome, l.detalhes, l.turno, l.andar]; })
      );
      toast("Histórico exportado!", "sucesso");
    });
  }

  // === INIT ===
  aplicarZoom();
  render();
  setTimeout(verificarAlertas, 2000);
  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register(new URL("./sw.js", document.baseURI))
      .catch(function(error) { console.error("Erro ao registrar o Service Worker:", error); });
  }
});