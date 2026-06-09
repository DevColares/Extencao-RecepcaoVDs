// Popup Administrativo Privado - SGI Boticário
// Gerencia a lista de URLs de ativação, recursos habilitados e as configurações do Google Sheets.

let urlsPermitidas = [];

document.addEventListener("DOMContentLoaded", () => {
  carregarConfiguracoes();

  // Eventos de URLs de Ativação
  document.getElementById("btn-add-url").addEventListener("click", adicionarUrl);
  document.getElementById("new-url").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      adicionarUrl();
    }
  });

  // Evento do botão de Salvar Planilhas
  document.getElementById("btn-salvar-urls").addEventListener("click", salvarPlanilhas);

  // Eventos do Switch de Modo
  const btnRecepcao = document.getElementById("btn-mode-recepcao");
  const btnCaixa = document.getElementById("btn-mode-caixa");
  const modeSlider = document.getElementById("mode-slider");
  const modeDesc = document.getElementById("mode-desc");

  function setModo(modo) {
    if (modo === "caixa") {
      modeSlider.style.transform = "translateX(100%)";
      btnCaixa.style.color = "var(--boti-primary)";
      btnCaixa.style.fontWeight = "700";
      btnRecepcao.style.color = "var(--boti-text-muted)";
      btnRecepcao.style.fontWeight = "600";
      modeDesc.innerText = "Modo Monitor de Boti Recicla e Cupons Ativo.";
      
      document.getElementById("secao-config-recepcao").style.display = "none";
      document.getElementById("secao-config-caixa").style.display = "block";
      document.getElementById("grupo-url-retirada").style.display = "none";
      document.getElementById("grupo-url-combos").style.display = "flex";
    } else {
      modeSlider.style.transform = "translateX(0)";
      btnRecepcao.style.color = "var(--boti-primary)";
      btnRecepcao.style.fontWeight = "700";
      btnCaixa.style.color = "var(--boti-text-muted)";
      btnCaixa.style.fontWeight = "600";
      modeDesc.innerText = "Modo de Mapeamento, Retirada e Alocação Ativo.";
      
      document.getElementById("secao-config-recepcao").style.display = "block";
      document.getElementById("secao-config-caixa").style.display = "none";
      document.getElementById("grupo-url-retirada").style.display = "flex";
      document.getElementById("grupo-url-combos").style.display = "none";
    }
  }

  btnRecepcao.addEventListener("click", () => {
    setModo("recepcao");
    chrome.storage.local.set({ "vd_modo_principal": "recepcao" }, () => {
      exibirStatus("Modo Recepção ativado!", "#27ae60");
    });
  });

  btnCaixa.addEventListener("click", () => {
    setModo("caixa");
    chrome.storage.local.set({ "vd_modo_principal": "caixa" }, () => {
      exibirStatus("Modo Caixa ativado!", "#27ae60");
    });
  });

  // Eventos de instant-save para os Toggles de Recursos
  document.getElementById("cfg-supervisor").addEventListener("change", (e) => {
    chrome.storage.local.set({ "vd_cfg_supervisor_ativo": e.target.checked }, () => {
      exibirStatus("Mapeamento de Supervisor " + (e.target.checked ? "ativado!" : "desativado!"), "#27ae60");
    });
  });

  document.getElementById("cfg-retirada").addEventListener("change", (e) => {
    chrome.storage.local.set({ "vd_cfg_retirada_ativo": e.target.checked }, () => {
      exibirStatus("Consulta de Retirada Automática " + (e.target.checked ? "ativada!" : "desativada!"), "#27ae60");
    });
  });

  document.getElementById("cfg-recicla").addEventListener("change", (e) => {
    chrome.storage.local.set({ "vd_cfg_recicla_ativo": e.target.checked }, () => {
      exibirStatus("Botão Recicla " + (e.target.checked ? "ativado!" : "desativado!"), "#27ae60");
    });
  });

  document.getElementById("cfg-alocacao").addEventListener("change", (e) => {
    chrome.storage.local.set({ "vd_cfg_alocacao_ativo": e.target.checked }, () => {
      exibirStatus("Botão Alocação " + (e.target.checked ? "ativado!" : "desativado!"), "#27ae60");
    });
  });

  document.getElementById("cfg-combos").addEventListener("change", (e) => {
    chrome.storage.local.set({ "vd_cfg_combos_ativo": e.target.checked }, () => {
      exibirStatus("Notificações de Combo " + (e.target.checked ? "ativadas!" : "desativadas!"), "#27ae60");
    });
  });

  // Exportar função para o escopo global usar na carga inicial
  window.setModoUI = setModo;
});

// Carrega todas as configurações salvas no armazenamento nativo
function carregarConfiguracoes() {
  chrome.storage.local.get([
    "vd_urls_permitidas",
    "vd_url_recicla",
    "vd_url_retirada",
    "vd_url_combos",
    "vd_modo_principal",
    "vd_cfg_supervisor_ativo",
    "vd_cfg_retirada_ativo",
    "vd_cfg_recicla_ativo",
    "vd_cfg_alocacao_ativo",
    "vd_cfg_combos_ativo"
  ], (data) => {
    // 1. URLs de Ativação
    urlsPermitidas = data.vd_urls_permitidas || [];
    renderUrls();

    // 2. URLs das Planilhas (Apps Scripts)
    document.getElementById("popup-url-recicla").value = data.vd_url_recicla || "";
    document.getElementById("popup-url-retirada").value = data.vd_url_retirada || "";
    document.getElementById("popup-url-combos").value = data.vd_url_combos || "";

    // 3. Status dos Recursos (Se for undefined, assume true)
    document.getElementById("cfg-supervisor").checked = data.vd_cfg_supervisor_ativo !== false;
    document.getElementById("cfg-retirada").checked = data.vd_cfg_retirada_ativo !== false;
    document.getElementById("cfg-recicla").checked = data.vd_cfg_recicla_ativo !== false;
    document.getElementById("cfg-alocacao").checked = data.vd_cfg_alocacao_ativo !== false;
    document.getElementById("cfg-combos").checked = data.vd_cfg_combos_ativo !== false;

    // 4. Status do Modo Principal
    const modoPrincipal = data.vd_modo_principal || "recepcao";
    if (window.setModoUI) {
      window.setModoUI(modoPrincipal);
    }
  });
}

// Salva as configurações de planilhas do Sheets
function salvarPlanilhas() {
  const urlRecicla = document.getElementById("popup-url-recicla").value.trim();
  const urlRetirada = document.getElementById("popup-url-retirada").value.trim();
  const urlCombos = document.getElementById("popup-url-combos").value.trim();

  chrome.storage.local.set({
    "vd_url_recicla": urlRecicla,
    "vd_url_retirada": urlRetirada,
    "vd_url_combos": urlCombos
  }, () => {
    exibirStatus("Configurações das planilhas salvas!", "#27ae60");
  });
}

// Renderiza a lista de URLs de ativação na interface
function renderUrls() {
  const container = document.getElementById("url-list-container");
  container.innerHTML = "";

  if (urlsPermitidas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        O painel está ativo apenas na URL padrão:<br>
        <b style="color:#0a3d28;">/Paginas/GestaoRede/</b><br>
        <span style="font-size: 10px; color: #888; display: block; margin-top: 4px;">
          Digite caminhos adicionais acima se desejar expandir a atuação.
        </span>
      </div>
    `;
    return;
  }

  urlsPermitidas.forEach((url, index) => {
    const item = document.createElement("div");
    item.className = "url-item";
    item.innerHTML = `
      <span>${escapeHTML(url)}</span>
      <button class="btn-del" data-index="${index}" title="Excluir">❌</button>
    `;
    container.appendChild(item);
  });

  // Atribui evento de clique para os botões de deletar
  document.querySelectorAll(".url-list .btn-del").forEach(btn => {
    btn.addEventListener("click", function() {
      const index = parseInt(this.getAttribute("data-index"));
      excluirUrl(index);
    });
  });
}

// Adiciona uma nova URL/Caminho à lista
function adicionarUrl() {
  const input = document.getElementById("new-url");
  const valor = input.value.trim();

  if (!valor) {
    exibirStatus("⚠️ Digite um caminho válido!", "#ef4444");
    return;
  }

  if (urlsPermitidas.includes(valor)) {
    exibirStatus("⚠️ Esse caminho já está na lista!", "#ef4444");
    return;
  }

  urlsPermitidas.push(valor);
  
  chrome.storage.local.set({ "vd_urls_permitidas": urlsPermitidas }, () => {
    input.value = "";
    renderUrls();
    exibirStatus("Caminho adicionado com sucesso!", "#27ae60");
  });
}

// Exclui uma URL da lista
function excluirUrl(index) {
  urlsPermitidas.splice(index, 1);
  
  chrome.storage.local.set({ "vd_urls_permitidas": urlsPermitidas }, () => {
    renderUrls();
    exibirStatus("Caminho removido!", "#ef4444");
  });
}

// Utilitários auxiliares
function exibirStatus(msg, cor) {
  const el = document.getElementById("status-msg");
  el.innerText = msg;
  el.style.color = cor;
  setTimeout(() => {
    el.innerText = "";
  }, 2500);
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
