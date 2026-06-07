// SGI Boticário - Alocação, Recicla e Supervisor
// Script de Conteúdo Injetado (Content Script)
// Autor: Andelison (Adaptado para Extensão Nativa Chrome/Edge com Filtro de URL Seguro)

// --- VERIFICAÇÃO DE URL PARA ATIVAÇÃO SILENCIOSA E DISCRETA ---
const urlAtual = window.location.href;

chrome.storage.local.get(["vd_urls_permitidas"], (data) => {
    const urlsPermitidas = data.vd_urls_permitidas || [];
    let deveAtivar = false;

    if (urlsPermitidas.length === 0) {
        // Padrão de fábrica se nenhuma URL customizada foi cadastrada no popup privado
        if (urlAtual.includes("/Paginas/GestaoRede/")) {
            deveAtivar = true;
        }
    } else {
        // Verifica se a URL atual contém algum dos caminhos cadastrados privadamente
        for (let padrao of urlsPermitidas) {
            if (urlAtual.includes(padrao)) {
                deveAtivar = true;
                break;
            }
        }
    }

    // Só inicializa a interface e monitoramento se a página atual for autorizada
    if (deveAtivar) {
        inicializarExtensao();
    }
});

// --- LÓGICA PRINCIPAL DA EXTENSÃO ---
function inicializarExtensao() {
    // Remove o painel antigo caso o script seja recarregado
    const painelAntigo = document.getElementById("painelVD");
    if (painelAntigo) painelAntigo.remove();

    const painel = document.createElement("div");
    painel.id = "painelVD";
    painel.innerHTML = `
      <!-- CAIXA DE CONFIGURAÇÕES -->
      <div id="vd-config-box">
        <div>
          <label>Tamanho do Painel</label>
          <select id="vd-escala">
            <option value="0.7">70%</option>
            <option value="0.8">80%</option>
            <option value="0.9">90%</option>
            <option value="1">100% (Padrão)</option>
            <option value="1.1">110%</option>
            <option value="1.2">120%</option>
          </select>
        </div>
        <hr id="vd-hr-sup">

        <div id="vd-secao-supervisor">
          <label>Mapear Supervisor x Estrutura</label>
          <div class="vd-col">
            <input type="text" id="vd-est-nome" placeholder="Estrutura (Ex: Setor 1)">
            <input type="text" id="vd-sup-nome" placeholder="Nome do Supervisor">
            <button id="vd-salvar-sup" class="btn-salvar-config">Adicionar Mapeamento</button>
          </div>
          <label style="margin-top: 10px;">Mapeamentos Ativos</label>
          <div id="vd-lista-mapeamentos" class="vd-lista-scroll"></div>
        </div>
        <hr id="vd-hr">

        <div>
          <label>Recebido Por (Lançamento)</label>
          <select id="vd-select"><option value="">-- Selecione --</option></select>
        </div>
        <div>
          <label style="margin-top: 10px;">Cadastrar Usuário</label>
          <div class="vd-row">
            <input type="text" id="vd-novo" placeholder="Nome...">
            <button id="vd-salvar" class="btn-salvar-config" style="width: auto;">Salvar</button>
          </div>
          <label style="margin-top: 10px;">Usuários Salvos</label>
          <div id="vd-lista-usuarios" class="vd-lista-scroll"></div>
        </div>
        <div id="vd-status"></div>
      </div>

      <!-- BOTÕES PRINCIPAIS -->
      <div id="botoes-container">
        <div id="vd-sup-display">SUPERVISOR<span id="vd-sup-nome-text">-</span></div>
        <div class="linha-boti">
          <button id="vd-gear" title="Configurações">⚙️</button>
          <button id="vd-enviar-pill" class="btn-sgi">Lançar Recicla</button>
        </div>
        <button id="btn-whatsapp" class="btn-sgi">Solicitar Alocação</button>
        <button id="btn-retirada" class="btn-sgi">Consultar Retirada</button>
      </div>
    `;

    // TOAST DO WINDOWS (FORA DO CONTAINER ESCALÁVEL PARA NÃO SOFRER ZOOM E FICAR PERFEITO NA TELA)
    const toastHtml = document.createElement("div");
    toastHtml.id = "vd-toast-container";
    toastHtml.innerHTML = `
        <div class="vd-toast-header">
            <span>Aviso do SGI Boticário</span>
            <span id="vd-toast-close" style="cursor:pointer; font-size:14px; padding: 0 4px;">✖</span>
        </div>
        <div class="vd-toast-body">
            Supervisor identificado na estrutura:<br>
            <b id="vd-toast-sup-nome" style="font-size: 15px; color: #005A9E; display: block; margin-top: 5px;"></b>
        </div>
        <button id="vd-toast-btn-wa" class="vd-toast-btn">📲 Avisar no WhatsApp</button>
    `;

    document.body.appendChild(painel);
    document.body.appendChild(toastHtml);

    // --- CONFIGURAÇÕES PADRÃO (VALORES DE BACKUP) ---
    const URL_RETIRADA_PADRAO = "https://script.google.com/a/macros/grupogerbera.com.br/s/AKfycbwZbqWfdYsMlTWbDe4qmLIWGxNGinX1i2AIxRPlfY5vdOjHAg_4jIP5OiJqKHq7851g/exec";
    const URL_RECICLA_PADRAO = "https://script.google.com/macros/s/AKfycbxBDmkbgMzdAoAmolR6daKABWZ0YhM2arzC_mcSkbPT6_RIrXdvef7phLa2U2FtE2U3/exec";

    // --- ESTADOS DO STORAGE DA EXTENSÃO ---
    let configScale = "1";
    let configSupervisores = {};
    let configUsuarios = [];
    let configUrlRecicla = "";
    let configUrlRetirada = "";
    let configSupervisorAtivo = true;
    let configRetiradaAtivo = true;
    let configReciclaAtivo = true;
    let configAlocacaoAtivo = true;

    let ultimoNomeConsultado = "";
    let notificacaoEnviada = false; // Garante que a notificação apite só 1 vez por revendedor

    // --- ATRIBUINDO EVENTOS ---
    document.getElementById("vd-gear").addEventListener("click", vdToggleConfig);
    document.getElementById("vd-salvar").addEventListener("click", vdCadastrar);
    document.getElementById("vd-salvar-sup").addEventListener("click", vdSalvarSupervisor);
    document.getElementById("vd-enviar-pill").addEventListener("click", vdEnviar);
    document.getElementById("btn-whatsapp").addEventListener("click", abrirWhatsApp);
    document.getElementById("btn-retirada").addEventListener("click", () => verificarRetirada(false));
    document.getElementById("vd-toast-close").addEventListener("click", () => {
        document.getElementById("vd-toast-container").classList.remove("show");
    });

    document.getElementById("vd-escala").addEventListener("change", (e) => {
        const escala = e.target.value;
        chrome.storage.local.set({ "vd_escala": escala }, () => {
            configScale = escala;
            aplicarEscala(escala);
        });
    });

    // --- MONITOR AUTOMÁTICO (DENTRO DA INICIALIZAÇÃO) ---
    setInterval(() => {
        const nomInput = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
        const nomeAtual = nomInput ? nomInput.value.trim() : "";

        if (nomeAtual !== "" && nomeAtual !== ultimoNomeConsultado) {
            ultimoNomeConsultado = nomeAtual;
            notificacaoEnviada = false; // Reseta a flag para o novo revendedor
            verificarRetirada(true);
            verificarSupervisor();
        }
    }, 1000);

    // --- FUNÇÃO PARA APLICAR O ZOOM/ESCALA ---
    function aplicarEscala(valor) {
        document.getElementById("painelVD").style.transform = `scale(${valor})`;
    }

    // --- CARREGAR CONFIGURAÇÕES VIA API DO CHROME STORAGE ---
    function carregarConfiguracoesIniciais() {
        chrome.storage.local.get([
            "vd_escala",
            "vd_supervisores",
            "vd_usuarios",
            "vd_url_recicla",
            "vd_url_retirada",
            "vd_cfg_supervisor_ativo",
            "vd_cfg_retirada_ativo",
            "vd_cfg_recicla_ativo",
            "vd_cfg_alocacao_ativo"
        ], (data) => {
            // Escala/Zoom
            configScale = data.vd_escala || "1";
            document.getElementById("vd-escala").value = configScale;
            aplicarEscala(configScale);

            // Mapeamento de Supervisores
            configSupervisores = data.vd_supervisores || {};
            renderMapeamentos();

            // Lista de Usuários
            configUsuarios = data.vd_usuarios || [];
            carregarSelectUsuarios();
            renderUsuarios();

            // Planilhas
            configUrlRecicla = data.vd_url_recicla || "";
            configUrlRetirada = data.vd_url_retirada || "";

            // Toggles de Recursos (Assume true por padrão)
            configSupervisorAtivo = data.vd_cfg_supervisor_ativo !== false;
            configRetiradaAtivo = data.vd_cfg_retirada_ativo !== false;
            configReciclaAtivo = data.vd_cfg_recicla_ativo !== false;
            configAlocacaoAtivo = data.vd_cfg_alocacao_ativo !== false;

            // Aplica as visibilidades condicionais baseadas nos Toggles do popup
            aplicarConfiguracoesVisuais();

            // Executa verificação inicial (se já houver conteúdo carregado na tela)
            verificarSupervisor();
        });
    }

    // Oculta ou mostra dinamicamente os recursos na interface
    function aplicarConfiguracoesVisuais() {
        // 1. Botão de Lançar Recicla (linha de botões)
        const btnRecicla = document.getElementById("vd-enviar-pill");
        if (btnRecicla) {
            btnRecicla.style.display = configReciclaAtivo ? "flex" : "none";
        }

        // 2. Display do Supervisor (flutuante acima dos botões)
        const divSupervisor = document.getElementById("vd-sup-display");
        if (divSupervisor) {
            divSupervisor.style.display = "none"; // começa oculto, exibido apenas por verificarSupervisor()
        }

        // 3. Seção inteira de Mapeamento de Supervisor dentro do menu ⚙️
        const secaoSupervisor = document.getElementById("vd-secao-supervisor");
        const hrSupervisor = document.getElementById("vd-hr-sup");
        if (secaoSupervisor) secaoSupervisor.style.display = configSupervisorAtivo ? "block" : "none";
        if (hrSupervisor) hrSupervisor.style.display = configSupervisorAtivo ? "block" : "none";

        // 4. Botão de Consultar Retirada (na tela principal)
        const btnRetirada = document.getElementById("btn-retirada");
        if (btnRetirada) {
            btnRetirada.style.display = configRetiradaAtivo ? "flex" : "none";
        }

        // 5. Botão de Solicitar Alocação (na tela principal)
        const btnWhatsapp = document.getElementById("btn-whatsapp");
        if (btnWhatsapp) {
            btnWhatsapp.style.display = configAlocacaoAtivo ? "flex" : "none";
        }
    }

    function getUrlRecicla() {
        return configUrlRecicla || URL_RECICLA_PADRAO;
    }

    function getUrlRetirada() {
        return configUrlRetirada || URL_RETIRADA_PADRAO;
    }

    // === GERENCIAMENTO DE SUPERVISORES ===
    function renderMapeamentos() {
        const lista = document.getElementById("vd-lista-mapeamentos");
        lista.innerHTML = "";

        if (Object.keys(configSupervisores).length === 0) {
            lista.innerHTML = "<div style='color:#777; text-align:center; padding: 10px;'>Nenhum mapeamento salvo.</div>";
            return;
        }

        for (let chave in configSupervisores) {
            const item = document.createElement("div");
            item.className = "vd-item-lista";
            item.innerHTML = `
                <div style="flex:1;"><b>${chave}</b><br><span style="color:#c5a059">${configSupervisores[chave]}</span></div>
                <button class="vd-btn-del" data-chave="${chave}" title="Excluir">❌</button>
            `;
            lista.appendChild(item);
        }

        document.querySelectorAll("#vd-lista-mapeamentos .vd-btn-del").forEach(btn => {
            btn.addEventListener("click", function() {
                const chave = this.getAttribute("data-chave");
                deletarMapeamento(chave);
            });
        });
    }

    function deletarMapeamento(chave) {
        delete configSupervisores[chave];
        chrome.storage.local.set({ "vd_supervisores": configSupervisores }, () => {
            renderMapeamentos();
            verificarSupervisor();
            vdStatus("Mapeamento removido!", "#ef4444");
        });
    }

    function vdSalvarSupervisor() {
        const est = document.getElementById("vd-est-nome").value.trim().toUpperCase();
        const sup = document.getElementById("vd-sup-nome").value.trim().toUpperCase();

        if (!est || !sup) { 
            vdStatus("⚠️ Preencha estrutura e supervisor!", "#ef4444"); 
            return; 
        }

        configSupervisores[est] = sup;
        chrome.storage.local.set({ "vd_supervisores": configSupervisores }, () => {
            document.getElementById("vd-est-nome").value = "";
            document.getElementById("vd-sup-nome").value = "";
            vdStatus("Mapeamento Salvo!", "#27ae60");

            renderMapeamentos();
            verificarSupervisor();
        });
    }

    // === GERENCIAMENTO DE USUÁRIOS ===
    function carregarSelectUsuarios() {
        const select = document.getElementById("vd-select");
        const atual = select.value;
        select.innerHTML = '<option value="">-- Selecione --</option>';
        configUsuarios.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u; opt.text = u;
            if (u === atual) opt.selected = true;
            select.appendChild(opt);
        });
    }

    function renderUsuarios() {
        const lista = document.getElementById("vd-lista-usuarios");
        lista.innerHTML = "";

        if (configUsuarios.length === 0) {
            lista.innerHTML = "<div style='color:#777; text-align:center; padding: 10px;'>Nenhum usuário salvo.</div>";
            return;
        }

        configUsuarios.forEach(nome => {
            const item = document.createElement("div");
            item.className = "vd-item-lista";
            item.innerHTML = `
                <div style="flex:1;"><b>${nome}</b></div>
                <button class="vd-btn-del" data-nome="${nome}" title="Excluir">❌</button>
            `;
            lista.appendChild(item);
        });

        document.querySelectorAll("#vd-lista-usuarios .vd-btn-del").forEach(btn => {
            btn.addEventListener("click", function() {
                const nome = this.getAttribute("data-nome");
                deletarUsuario(nome);
            });
        });
    }

    function deletarUsuario(nome) {
        configUsuarios = configUsuarios.filter(u => u !== nome);
        chrome.storage.local.set({ "vd_usuarios": configUsuarios }, () => {
            const select = document.getElementById("vd-select");
            if (select.value === nome) select.value = "";

            carregarSelectUsuarios();
            renderUsuarios();
            vdStatus("Usuário removido!", "#ef4444");
        });
    }

    function vdCadastrar() {
      const input = document.getElementById("vd-novo");
      const nome = input.value.trim().toUpperCase();
      if (!nome) { 
          vdStatus("⚠️ Digite um nome!", "#ef4444"); 
          return; 
      }
      if (configUsuarios.includes(nome)) { 
          vdStatus("⚠️ Já cadastrado!", "#ef4444"); 
          return; 
      }
      
      configUsuarios.push(nome);
      chrome.storage.local.set({ "vd_usuarios": configUsuarios }, () => {
          input.value = "";

          carregarSelectUsuarios();
          renderUsuarios();

          document.getElementById("vd-select").value = nome;
          vdStatus("Cadastrado com sucesso!", "#27ae60");
      });
    }

    // === VERIFICAÇÕES DE DADOS E EVENTOS ===
    function verificarSupervisor() {
        // Se o mapeamento de supervisor estiver desativado no popup, silencia completamente
        if (!configSupervisorAtivo) {
            const displayBox = document.getElementById("vd-sup-display");
            if (displayBox) displayBox.style.display = "none";
            return;
        }

        const estInput = document.getElementById("ContentPlaceHolder1_descEstruturaComercialAtual_Tb1");
        const estruturaAtual = estInput ? estInput.value.trim().toUpperCase() : "";
        const displayBox = document.getElementById("vd-sup-display");
        const displayText = document.getElementById("vd-sup-nome-text");

        if (!estruturaAtual) {
            displayBox.style.display = "none";
            return;
        }

        let supervisorEncontrado = "Não Mapeado";

        for (let chave in configSupervisores) {
            if (estruturaAtual.includes(chave)) {
                supervisorEncontrado = configSupervisores[chave];
                break;
            }
        }

        displayText.innerText = supervisorEncontrado;
        displayBox.style.display = "block";
        displayText.style.color = (supervisorEncontrado === "Não Mapeado") ? "#ef4444" : "#0a3d28";

        if (supervisorEncontrado !== "Não Mapeado" && !notificacaoEnviada) {
            notificacaoEnviada = true;
            dispararToastWindows(supervisorEncontrado);
        }
    }

    function dispararToastWindows(nomeSupervisor) {
        const codInput = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_codigoEntradaNumero_Tb1");
        const nomInput = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
        const cod = codInput ? codInput.value.trim() : "";
        const nomeRev = nomInput ? nomInput.value.trim() : "";

        const toast = document.getElementById("vd-toast-container");
        document.getElementById("vd-toast-sup-nome").innerText = nomeSupervisor;

        const btnWa = document.getElementById("vd-toast-btn-wa");
        btnWa.onclick = () => {
            let msg = `Olá ${nomeSupervisor}, o revendedor ${cod} - ${nomeRev} esta no ER.`;
            window.location.href = `whatsapp://send?text=${encodeURIComponent(msg)}`;
            toast.classList.remove("show");
        };

        toast.classList.add("show");
        setTimeout(() => {
            if (toast.classList.contains("show")) {
                toast.classList.remove("show");
            }
        }, 10000);
    }

    function verificarRetirada(isAutomatico) {
      // Se for verificação automática provocada pelo timer e a verificação automática estiver desativada no popup, ignora
      if (isAutomatico && !configRetiradaAtivo) {
          return;
      }

      const nomInput = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
      const nomeRevendedor = nomInput ? nomInput.value.trim() : "";
      if (!nomeRevendedor) return;

      const btn = document.getElementById("btn-retirada");
      const textoOriginal = "Consultar Retirada";
      btn.innerText = "Consultando...";
      btn.disabled = true;
      btn.style.background = "#ffffff"; btn.style.color = "#c5a059"; btn.style.borderColor = "#c5a059";

      const urlCompleta = getUrlRetirada() + "?nome=" + encodeURIComponent(nomeRevendedor);

      chrome.runtime.sendMessage({
          action: "fetch",
          url: urlCompleta,
          options: { method: "GET" }
      }, function(response) {
          btn.disabled = false;
          
          if (chrome.runtime.lastError || !response || !response.success) {
              console.error("Erro na consulta de retirada:", chrome.runtime.lastError || response);
              btn.innerText = "Erro Conexão";
              setTimeout(() => {
                  btn.innerText = textoOriginal; 
                  btn.style.background = ""; btn.style.color = ""; btn.style.borderColor = ""; 
              }, 3000);
              return;
          }

          try {
              const data = JSON.parse(response.text);
              if (data.temRetirada) {
                  btn.innerText = "TEM RETIRADA!";
                  btn.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"; 
                  btn.style.color = "#ffffff"; 
                  btn.style.borderColor = "transparent";
              } else {
                  btn.innerText = "Sem Retirada";
                  btn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)"; 
                  btn.style.color = "#ffffff"; 
                  btn.style.borderColor = "transparent";
              }
          } catch(e) {
              console.error("Erro ao analisar resposta de retirada:", e);
              btn.innerText = "Erro nos dados"; 
              btn.style.background = "#7f8c8d"; btn.style.color = "#ffffff"; btn.style.borderColor = "#7f8c8d";
          }
      });
    }

    function abrirWhatsApp() {
      const codInput = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_codigoEntradaNumero_Tb1");
      const nomInput = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
      let cod = codInput ? codInput.value.trim() : ""; 
      let nome = nomInput ? nomInput.value.trim() : "";
      
      if (!cod || !nome) { 
          alert("⚠️ Carregue o revendedor no SGI primeiro!"); 
          return; 
      }
      let mensagem = `${cod} - ${nome}\nPor gentileza fazer a alocação.`;
      window.location.href = `whatsapp://send?text=${encodeURIComponent(mensagem)}`;
    }

    function vdToggleConfig() {
      const box = document.getElementById("vd-config-box");
      box.style.display = (box.style.display === "flex") ? "none" : "flex";
    }

    function vdStatus(msg, cor = "#27ae60") {
      const el = document.getElementById("vd-status"); 
      el.style.color = cor; el.innerText = msg;
      setTimeout(() => el.innerText = "", 3000);
    }

    function vdEnviar() {
      const usuario = document.getElementById("vd-select").value;
      if (!usuario) {
        document.getElementById("vd-config-box").style.display = "flex";
        vdStatus("⚠️ Selecione um usuário acima!", "#ef4444"); 
        return;
      }
      const cod = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_codigoEntradaNumero_Tb1");
      const nom = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
      
      if (!cod || !nom || !cod.value) { 
          alert("⚠️ Campos do SGI não encontrados ou vazios!"); 
          return; 
      }

      const dados = { codigo: cod.value, nome: nom.value, usuario };
      const btn = document.getElementById("vd-enviar-pill"); 
      const textoOriginal = btn.innerHTML;
      btn.innerText = "Enviando..."; 
      btn.disabled = true;

      chrome.runtime.sendMessage({
          action: "fetch",
          url: getUrlRecicla(),
          options: {
              method: "POST",
              headers: {
                  "Content-Type": "text/plain"
              },
              body: JSON.stringify(dados)
          }
      }, function(response) {
          btn.disabled = false;
          
          if (chrome.runtime.lastError || !response || !response.success) {
              console.error("Erro ao enviar Recicla:", chrome.runtime.lastError || response);
              btn.innerHTML = textoOriginal;
              alert("❌ Erro ao enviar para a planilha!");
              return;
          }

          btn.innerText = "LANÇADO!"; 
          btn.classList.add("enviado");
          document.getElementById("vd-config-box").style.display = "none";
          setTimeout(() => { 
              btn.innerHTML = textoOriginal; 
              btn.classList.remove("enviado"); 
          }, 2500);
      });
    }

    // Inicia a carga de dados armazenados de forma assíncrona
    carregarConfiguracoesIniciais();
}
