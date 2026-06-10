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

        <div id="vd-secao-recepcao">
          <div>
            <label>📋 Lançado Por (Recepção)</label>
            <select id="vd-select"><option value="">-- Selecione --</option></select>
          </div>
          <div>
            <label style="margin-top: 10px;">Cadastrar Recepção</label>
            <div class="vd-row">
              <input type="text" id="vd-novo" placeholder="Nome...">
              <button id="vd-salvar" class="btn-salvar-config" style="width: auto;">Salvar</button>
            </div>
            <label style="margin-top: 10px;">Recepção Salvos</label>
            <div id="vd-lista-usuarios" class="vd-lista-scroll"></div>
          </div>
        </div>
        <hr id="vd-hr-caixa">
        <div id="vd-secao-caixa">
          <label>📦 Recebido Por (Caixa)</label>
          <select id="vd-select-caixa"><option value="">-- Selecione --</option></select>
          <label style="margin-top: 10px;">Cadastrar Caixa</label>
          <div class="vd-row">
            <input type="text" id="vd-novo-caixa" placeholder="Nome do Caixa...">
            <button id="vd-salvar-caixa" class="btn-salvar-config" style="width: auto;">Salvar</button>
          </div>
          <label style="margin-top: 10px;">Caixas Salvos</label>
          <div id="vd-lista-caixas" class="vd-lista-scroll" style="max-height: 80px;"></div>
          
          <label style="margin-top: 10px;">🎟️ Cupom para Lançamento</label>
          <input type="text" id="vd-cupom-caixa" placeholder="Ex: PROMO10" style="width: 100%; box-sizing: border-box; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        <div id="vd-status"></div>
      </div>

      <!-- BADGE DO MODO CAIXAS (MONITOR) -->
      <div id="vd-monitor-badge" style="display:none; background:#fff; border:2px solid #1a47d4; color:#1a47d4; font-weight:bold; font-size:13px; text-transform:uppercase; padding:8px 15px; text-align:center; font-family:Arial,Helvetica,sans-serif; margin-bottom:6px; box-shadow:0 2px 4px rgba(0,0,0,.05);">⏳ MODO CAIXAS ATIVO</div>

      <!-- BOTÕES PRINCIPAIS -->
      <div id="botoes-container">
        <!-- BOTÕES DA RECEPÇÃO -->
        <div id="botoes-recepcao">
          <div id="vd-sup-display">SUPERVISOR<span id="vd-sup-nome-text">-</span></div>
          <div class="linha-boti">
            <button id="vd-gear" title="Configurações">⚙️</button>
            <button id="vd-enviar-pill" class="btn-sgi">Lançar Recicla</button>
          </div>
          <button id="btn-whatsapp" class="btn-sgi">Solicitar Alocação</button>
          <button id="btn-retirada" class="btn-sgi">Consultar Retirada</button>
        </div>

        <!-- BOTÕES DO CAIXA -->
        <div id="botoes-caixa" style="display:none; flex-direction: row; gap: 6px; align-items: center; justify-content: center;">
          <button id="vd-btn-atualizar-caixa" title="Atualizar Verificação" style="width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid #1a47d4; background: #fff; color: #1a47d4; border-radius: 4px; cursor: pointer; font-size: 16px;">🔄</button>
          <button id="vd-gear-caixa" title="Configurações do Caixa" style="width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid #c5a059; background: #fff; border-radius: 4px; cursor: pointer; font-size: 16px;">⚙️</button>
          <button id="vd-badge-boti-caixa" style="flex: 1; height: 36px; font-size: 11px; font-weight: bold; border: 2px solid #ccc; background: #fff; border-radius: 4px; color: #555; pointer-events: none;">⏳ VERIFICANDO</button>
          <button id="vd-btn-lancar-caixa" style="height: 36px; padding: 0 10px; border: none; background: #1a47d4; color: #fff; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 4px;">➡️ LANÇAR</button>
        </div>
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

    // --- ELEMENTOS DO MODO COMBO (INJETADOS NA TELA) ---
    const estiloCombo = document.createElement("style");
    estiloCombo.innerHTML = `
        #combo-status-ball {
            position: fixed; bottom: 20px; right: 20px; width: 15px; height: 15px; 
            border-radius: 50%; background-color: #ff9800; z-index: 30000;
            box-shadow: 0 0 10px rgba(0,0,0,0.3); transition: background-color 0.3s ease;
            cursor: pointer; 
        }
        #combo-status-ball.carregado { background-color: #4CAF50; }
        #combo-status-ball.erro { background-color: #f44336; }

        #alerta-combo-flutuante {
            position: fixed; top: 20px; right: 20px; width: 280px;
            background: rgba(30, 30, 30, 0.95); backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px); border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2); padding: 15px;
            color: #fff; font-family: 'Segoe UI', sans-serif;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); z-index: 20000;
            transform: translateX(150%); transition: transform 0.3s ease-out;
            text-align: center;
        }
        #alerta-combo-flutuante.show { transform: translateX(0); }
        #alerta-combo-flutuante img { width: 120px; height: 120px; object-fit: contain; border-radius: 8px; background: #fff; margin: 10px 0; }
        
        .codigo-combo-box { 
            font-size: 24px; font-weight: bold; background: rgba(0,0,0,0.6); 
            padding: 10px; border-radius: 6px; margin: 10px 0; 
            border: 2px dashed #FFD700; color: #FFD700; letter-spacing: 2px;
        }

        .btn-acao { 
            padding: 12px; border-radius: 6px; font-weight: bold; 
            cursor: pointer; border: none; margin: 4px 0; width: 100%; 
            transition: 0.2s; font-size: 13px; text-transform: uppercase;
        }
        
        #btn-fechar { background: #f44336; color: white; }
        #btn-fechar:hover { background: #d32f2f; }
    `;
    document.head.appendChild(estiloCombo);

    const statusBall = document.createElement('div');
    statusBall.id = 'combo-status-ball';
    statusBall.title = "Clique para atualizar o Banco de Combos manualmente";
    // Oculta inicialmente, só exibe se o modo caixa + combos estiverem ativos
    statusBall.style.display = "none";
    document.body.appendChild(statusBall);

    const flutuanteCombo = document.createElement('div');
    flutuanteCombo.id = 'alerta-combo-flutuante';
    flutuanteCombo.innerHTML = `
        <h3 style="margin:0; color: #FFD700; font-size: 15px;">🎁 COMBO DISPONÍVEL</h3>
        <img src="" id="foto-combo">
        <div id="nome-combo" style="font-size: 13px; margin-bottom: 5px; line-height: 1.2;"></div>
        <div style="font-size: 11px; opacity: 0.8;">CÓDIGO DO COMBO (DIGITE ABAIXO):</div>
        <div class="codigo-combo-box" id="codigo-combo"></div>
        <div>
            <button type="button" id="btn-fechar" class="btn-acao">FECHAR AVISO E LANÇAR ITEM</button>
        </div>
    `;
    document.body.appendChild(flutuanteCombo);

    // --- CONFIGURAÇÕES PADRÃO (VALORES DE BACKUP) ---
    const URL_RETIRADA_PADRAO = "https://script.google.com/a/macros/grupogerbera.com.br/s/AKfycbwZbqWfdYsMlTWbDe4qmLIWGxNGinX1i2AIxRPlfY5vdOjHAg_4jIP5OiJqKHq7851g/exec";
    const URL_RECICLA_PADRAO = "https://script.google.com/macros/s/AKfycbxBDmkbgMzdAoAmolR6daKABWZ0YhM2arzC_mcSkbPT6_RIrXdvef7phLa2U2FtE2U3/exec";

    // --- ESTADOS DO STORAGE DA EXTENSÃO ---
    let configScale = "1";
    let configSupervisores = {};
    let configUsuarios = [];
    let configUrlRecicla = "";
    let configUrlRetirada = "";
    let configModoPrincipal = "recepcao"; // 'recepcao' ou 'caixa'
    let configUsuariosCaixa = [];
    let configSupervisorAtivo = true;
    let configRetiradaAtivo = true;
    let configReciclaAtivo = true;
    let configAlocacaoAtivo = true;
    let configCombosAtivo = true;

    let ultimoNomeConsultado = "";
    let ultimoNomeMonitorado = "";
    let notificacaoEnviada = false; // Garante que a notificação apite só 1 vez por revendedor

    // --- ATRIBUINDO EVENTOS ---
    document.getElementById("vd-gear").addEventListener("click", vdToggleConfig);
    document.getElementById("vd-gear-caixa").addEventListener("click", vdToggleConfig);
    document.getElementById("vd-salvar").addEventListener("click", vdCadastrar);
    document.getElementById("vd-salvar-sup").addEventListener("click", vdSalvarSupervisor);
    document.getElementById("vd-salvar-caixa").addEventListener("click", vdCadastrarCaixa);
    document.getElementById("vd-cupom-caixa").addEventListener("change", (e) => {
        configCupomCaixa = e.target.value.trim();
        chrome.storage.local.set({ "vd_cupom_caixa": configCupomCaixa }, () => {
            vdStatus("Cupom salvo!", "#27ae60");
        });
    });
    document.getElementById("vd-enviar-pill").addEventListener("click", vdEnviar);
    document.getElementById("btn-whatsapp").addEventListener("click", abrirWhatsApp);
    document.getElementById("btn-retirada").addEventListener("click", () => verificarRetirada(false));
    document.getElementById("vd-toast-close").addEventListener("click", () => {
        document.getElementById("vd-toast-container").classList.remove("show");
    });
    document.getElementById("vd-btn-atualizar-caixa").addEventListener("click", () => {
        ultimoNomeMonitorado = ""; // Força re-verificação
        const nomInput = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
        if (nomInput && nomInput.value.trim() !== "") {
            verificarReciclaCaixa(nomInput.value.trim());
        }
    });
    document.getElementById("vd-btn-lancar-caixa").addEventListener("click", lancarCupomCaixa);

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

            // Modo Caixas: verifica recicla para o revendedor atual
            if (configModoPrincipal === "caixa" && nomeAtual !== ultimoNomeMonitorado) {
                ultimoNomeMonitorado = nomeAtual;
                verificarReciclaCaixa(nomeAtual);
            }
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
            "vd_url_combos",
            "vd_modo_principal",
            "vd_usuarios_caixa",
            "vd_cupom_caixa",
            "vd_cfg_supervisor_ativo",
            "vd_cfg_retirada_ativo",
            "vd_cfg_recicla_ativo",
            "vd_cfg_alocacao_ativo",
            "vd_cfg_combos_ativo"
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

            // Usuários e Cupom do Caixa
            configUsuariosCaixa = data.vd_usuarios_caixa || [];
            configCupomCaixa = data.vd_cupom_caixa || "";
            document.getElementById("vd-cupom-caixa").value = configCupomCaixa;
            carregarSelectCaixas();
            renderCaixas();

            // Modo Principal
            configModoPrincipal = data.vd_modo_principal || "recepcao";

            // Status dos Recursos Individuais
            configSupervisorAtivo = data.vd_cfg_supervisor_ativo !== false;
            configRetiradaAtivo = data.vd_cfg_retirada_ativo !== false;
            configReciclaAtivo = data.vd_cfg_recicla_ativo !== false;
            configAlocacaoAtivo = data.vd_cfg_alocacao_ativo !== false;
            configCombosAtivo = data.vd_cfg_combos_ativo !== false;

            // Aplica as visibilidades condicionais baseadas no Modo
            aplicarConfiguracoesVisuais();
            
            // Inicializa Banco de Combos se estiver no modo caixa
            if (configModoPrincipal === "caixa" && configCombosAtivo) {
                carregarBancoCombos(false);
            }
        });
    }

    // Oculta ou mostra dinamicamente os recursos na interface
    function aplicarConfiguracoesVisuais() {
        const modoRecepcao = configModoPrincipal === "recepcao";
        const modoCaixa = configModoPrincipal === "caixa";

        // Containers de Botões
        document.getElementById("botoes-recepcao").style.display = modoRecepcao ? "block" : "none";
        document.getElementById("botoes-caixa").style.display = modoCaixa ? "flex" : "none";

        if (modoRecepcao) {
            const btnRecicla = document.getElementById("vd-enviar-pill");
            if (btnRecicla) btnRecicla.style.display = configReciclaAtivo ? "flex" : "none";

            const btnRetirada = document.getElementById("btn-retirada");
            if (btnRetirada) btnRetirada.style.display = configRetiradaAtivo ? "flex" : "none";

            const btnWhatsapp = document.getElementById("btn-whatsapp");
            if (btnWhatsapp) btnWhatsapp.style.display = configAlocacaoAtivo ? "flex" : "none";
        }

        // Display do Supervisor (apenas recepção, mas escondido inicialmente)
        const divSupervisor = document.getElementById("vd-sup-display");
        if (divSupervisor) {
            divSupervisor.style.display = "none";
        }

        // Itens do modal de Configuração
        const secaoSupervisor = document.getElementById("vd-secao-supervisor");
        const hrSupervisor = document.getElementById("vd-hr-sup");
        if (secaoSupervisor) secaoSupervisor.style.display = modoRecepcao ? "block" : "none";
        if (hrSupervisor) hrSupervisor.style.display = modoRecepcao ? "block" : "none";

        const secaoCaixa = document.getElementById("vd-secao-caixa");
        const hrCaixa = document.getElementById("vd-hr-caixa");
        if (secaoCaixa) secaoCaixa.style.display = modoCaixa ? "block" : "none";
        if (hrCaixa) hrCaixa.style.display = modoCaixa ? "block" : "none";

        // Oculta os selects de recepção completamente no modo caixa
        const secaoRecepcao = document.getElementById("vd-secao-recepcao");
        if (secaoRecepcao) secaoRecepcao.style.display = modoRecepcao ? "block" : "none";

        const hrMiddle = document.getElementById("vd-hr");
        if (hrMiddle) hrMiddle.style.display = modoRecepcao ? "block" : "none";

        // Status Ball dos Combos
        const ball = document.getElementById("combo-status-ball");
        if (ball) ball.style.display = (modoCaixa && configCombosAtivo) ? "block" : "none";

        // Badge do monitor (vamos desativá-lo pois agora o botão faz as vezes de badge)
        const monitorBadge = document.getElementById("vd-monitor-badge");
        if (monitorBadge) monitorBadge.style.display = "none";

        // Executa verificação inicial
        if (modoRecepcao) {
            verificarSupervisor();
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
        // Se estiver no modo caixa ou o mapeamento de supervisor estiver desativado no popup, silencia
        if (configModoPrincipal !== "recepcao" || !configSupervisorAtivo) {
            const displayBox = document.getElementById("vd-sup-display");
            if (displayBox) displayBox.style.display = "none";
            return;
        }

        // Busca o campo de estrutura comercial por NAME (formato ASP.NET com $) e por ID (formato com _)
        const estInput = document.getElementsByName("ctl00$ContentPlaceHolder1$descEstruturaComercialAtual$Tb1")[0]
                      || document.getElementById("ContentPlaceHolder1_descEstruturaComercialAtual_Tb1")
                      || document.querySelector("input[name$='descEstruturaComercialAtual$Tb1']")
                      || document.querySelector("input[id$='descEstruturaComercialAtual_Tb1']");
        const estruturaAtual = estInput ? estInput.value.trim().toUpperCase() : "";
        const displayBox = document.getElementById("vd-sup-display");
        const displayText = document.getElementById("vd-sup-nome-text");

        if (!estruturaAtual) {
            displayBox.style.display = "none";
            return;
        }

        let supervisorEncontrado = "Não Mapeado";

        // Extrai o último nome/palavra da estrutura (ex: "Setor 20393 - EQUIPE BLOSSOM" → "BLOSSOM")
        const palavras = estruturaAtual.split(/[\s\-]+/).filter(p => p.length > 0);
        const ultimoNomeEstrutura = palavras.length > 0 ? palavras[palavras.length - 1] : "";

        for (let chave in configSupervisores) {
            const chaveUpper = chave.toUpperCase();
            // Compara pelo último nome da estrutura OU pelo includes tradicional
            if (ultimoNomeEstrutura === chaveUpper || estruturaAtual.includes(chaveUpper)) {
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
      // Se for verificação automática provocada pelo timer e não estiver no modo recepcao ou o toggle estiver desligado, ignora
      if (isAutomatico && (configModoPrincipal !== "recepcao" || !configRetiradaAtivo)) {
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

    // === MODO CAIXAS (MONITOR DE RECICLA) ===
    // Verifica na planilha se o revendedor atual tem recicla disponível (mesma lógica do Violentmonkey)
    let monitorNotificacaoEnviada = false;

    function verificarReciclaCaixa(nomeRevendedor) {
        const badge = document.getElementById("vd-badge-boti-caixa");
        if (!badge || configModoPrincipal !== "caixa") return;

        const urlRecicla = getUrlRecicla();
        if (!urlRecicla) return;

        const primeiroNome = nomeRevendedor.split(" ")[0] || "REVENDEDOR";

        // Feedback visual: verificando...
        badge.innerText = "⏳ VERIFICANDO...";
        badge.style.borderColor = "#1a47d4";
        badge.style.color = "#1a47d4";
        badge.style.background = "#fff";
        monitorNotificacaoEnviada = false;

        const urlCompleta = urlRecicla + "?nome=" + encodeURIComponent(nomeRevendedor);

        chrome.runtime.sendMessage({
            action: "fetch",
            url: urlCompleta,
            options: { method: "GET" }
        }, function(response) {
            if (chrome.runtime.lastError || !response || !response.success) {
                badge.innerText = "❌ ERRO DE CONEXÃO";
                badge.style.borderColor = "#c62828";
                badge.style.color = "#c62828";
                return;
            }

            try {
                const dados = JSON.parse(response.text);

                if (dados.utilizado) {
                    // Já utilizou neste ciclo
                    badge.innerText = "🚫 " + primeiroNome + " - JÁ UTILIZOU";
                    badge.style.borderColor = "#c62828";
                    badge.style.color = "#c62828";
                    badge.style.background = "#fff5f5";
                } else if (dados.encontrado) {
                    // TEM recicla!
                    badge.innerText = "⚠️ " + primeiroNome + " TEM BOTI RECICLA!";
                    badge.style.borderColor = "#e65100";
                    badge.style.color = "#e65100";
                    badge.style.background = "#fff8e1";

                    // Dispara notificação nativa (igual Violentmonkey)
                    if (!monitorNotificacaoEnviada) {
                        monitorNotificacaoEnviada = true;
                        dispararNotificacaoMonitor(primeiroNome);
                    }
                } else {
                    // Livre
                    badge.innerText = "✅ " + primeiroNome + " NÃO TEM BOTI";
                    badge.style.borderColor = "#2e7d32";
                    badge.style.color = "#2e7d32";
                    badge.style.background = "#f1f8e9";
                }
            } catch (e) {
                badge.innerText = "❌ ERRO NOS DADOS";
                badge.style.borderColor = "#c62828";
                badge.style.color = "#c62828";
            }
        });
    }

    function dispararNotificacaoMonitor(primeiroNome) {
        if (!("Notification" in window)) return;

        const disparar = () => {
            new Notification("♻️ Boti Recicla Encontrado!", {
                body: `Atenção: ${primeiroNome} TEM BOTI RECICLA disponível!`,
                icon: "https://www.boticario.com.br/favicon.ico"
            });
        };

        if (Notification.permission === "granted") {
            disparar();
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(p => { if (p === "granted") disparar(); });
        }
    }

    // === GERENCIAMENTO DE USUÁRIOS - CAIXA ===
    function carregarSelectCaixas() {
        const select = document.getElementById("vd-select-caixa");
        const atual = select.value;
        select.innerHTML = '<option value="">-- Selecione --</option>';
        configUsuariosCaixa.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u; opt.text = u;
            if (u === atual) opt.selected = true;
            select.appendChild(opt);
        });
    }

    function renderCaixas() {
        const lista = document.getElementById("vd-lista-caixas");
        lista.innerHTML = "";

        if (configUsuariosCaixa.length === 0) {
            lista.innerHTML = "<div style='color:#777; text-align:center; padding: 10px;'>Nenhum caixa salvo.</div>";
            return;
        }

        configUsuariosCaixa.forEach(nome => {
            const item = document.createElement("div");
            item.className = "vd-item-lista";
            item.innerHTML = `
                <div style="flex:1;"><b>${nome}</b></div>
                <button class="vd-btn-del" data-nome="${nome}" title="Excluir">❌</button>
            `;
            lista.appendChild(item);
        });

        document.querySelectorAll("#vd-lista-caixas .vd-btn-del").forEach(btn => {
            btn.addEventListener("click", function() {
                const nome = this.getAttribute("data-nome");
                deletarCaixa(nome);
            });
        });
    }

    function deletarCaixa(nome) {
        configUsuariosCaixa = configUsuariosCaixa.filter(u => u !== nome);
        chrome.storage.local.set({ "vd_usuarios_caixa": configUsuariosCaixa }, () => {
            const select = document.getElementById("vd-select-caixa");
            if (select.value === nome) select.value = "";
            carregarSelectCaixas();
            renderCaixas();
            vdStatus("Caixa removido!", "#ef4444");
        });
    }

    function vdCadastrarCaixa() {
        const input = document.getElementById("vd-novo-caixa");
        const nome = input.value.trim().toUpperCase();
        if (!nome) {
            vdStatus("⚠️ Digite um nome!", "#ef4444");
            return;
        }
        if (configUsuariosCaixa.includes(nome)) {
            vdStatus("⚠️ Já cadastrado!", "#ef4444");
            return;
        }

        configUsuariosCaixa.push(nome);
        chrome.storage.local.set({ "vd_usuarios_caixa": configUsuariosCaixa }, () => {
            input.value = "";
            carregarSelectCaixas();
            renderCaixas();
            document.getElementById("vd-select-caixa").value = nome;
            vdStatus("Caixa cadastrado!", "#27ae60");
        });
    }

    function lancarCupomCaixa() {
        if (!configCupomCaixa) {
            vdStatus("⚠️ Cadastre um cupom nas configurações (⚙️)!", "#ef4444");
            document.getElementById("vd-config-box").style.display = "flex";
            return;
        }

        const usuario = document.getElementById("vd-select-caixa").value;
        if (!usuario) {
            vdStatus("⚠️ Selecione um Recebedor (Caixa) nas configurações!", "#ef4444");
            document.getElementById("vd-config-box").style.display = "flex";
            return;
        }

        // Inserir o cupom no campo do SGI informado
        const campoCupom = document.getElementsByName("ctl00$content$txtCupomDesconto$Tb1")[0] || 
                           document.getElementById("ctl00$content$txtCupomDesconto$Tb1") ||
                           document.getElementById("ctl00_content_txtCupomDesconto_Tb1") ||
                           document.querySelector("input[name$='txtCupomDesconto$Tb1']") ||
                           document.querySelector("input[id$='txtCupomDesconto_Tb1']");

        if (campoCupom) {
            let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(campoCupom, configCupomCaixa);
            } else {
                campoCupom.value = configCupomCaixa;
            }
            campoCupom.dispatchEvent(new Event('input', { bubbles: true }));
            campoCupom.dispatchEvent(new Event('change', { bubbles: true }));

            // Clica no botão para adicionar o cupom
            setTimeout(() => {
                const btnReal = document.querySelector("[id$='content_lbtAdicionarCupomDesconto']") || 
                                document.getElementById("content_lbtAdicionarCupomDesconto") ||
                                document.getElementById("I3");
                
                if (btnReal) {
                    const href = btnReal.getAttribute("href");
                    
                    // Se for um link javascript:, NÃO PODEMOS CLICAR pois o CSP bloqueia.
                    if (href && href.trim().startsWith("javascript:")) {
                        let eventTarget = "";
                        
                        // Tenta extrair o target do __doPostBack('Alvo'
                        const matchDPB = href.match(/__doPostBack\s*\(\s*'([^']+)'/);
                        if (matchDPB) {
                            eventTarget = matchDPB[1];
                        } else {
                            // Tenta extrair do WebForm_PostBackOptions("Alvo"
                            const matchOptions = href.match(/WebForm_PostBackOptions\s*\(\s*"([^"]+)"/);
                            if (matchOptions) {
                                eventTarget = matchOptions[1];
                            } else {
                                // Tenta deduzir o alvo pelo ID (padrão ASP.NET)
                                eventTarget = btnReal.id.replace(/_/g, "$");
                            }
                        }

                        const form = document.forms[0];
                        if (form) {
                            let targetInput = document.getElementById("__EVENTTARGET");
                            if (!targetInput) {
                                targetInput = document.createElement("input");
                                targetInput.type = "hidden";
                                targetInput.name = "__EVENTTARGET";
                                targetInput.id = "__EVENTTARGET";
                                form.appendChild(targetInput);
                            }
                            targetInput.value = eventTarget;

                            let argInput = document.getElementById("__EVENTARGUMENT");
                            if (!argInput) {
                                argInput = document.createElement("input");
                                argInput.type = "hidden";
                                argInput.name = "__EVENTARGUMENT";
                                argInput.id = "__EVENTARGUMENT";
                                form.appendChild(argInput);
                            }
                            argInput.value = "";

                            form.submit();
                        }
                    } else {
                        // Se for um botão normal (não tem javascript: no href), pode clicar
                        btnReal.click();
                    }
                } else {
                    console.warn("Botão de adicionar cupom não encontrado na tela.");
                }
            }, 500);
        } else {
            vdStatus("⚠️ Campo de cupom não encontrado na tela!", "#ef4444");
            console.warn("Campo de cupom ctl00$content$txtCupomDesconto$Tb1 não encontrado.");
        }
        
        const badgeBtn = document.getElementById("vd-btn-lancar-caixa");
        const originalText = badgeBtn.innerText;
        badgeBtn.innerText = "Enviando...";

        // Envia o registro do Recicla da mesma forma que a Recepção envia, mas marcando que foi recebido no Caixa
        const cod = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_codigoEntradaNumero_Tb1");
        const nom = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
        
        let dadosRecicla = { 
            codigo: cod ? cod.value : "", 
            nome: nom ? nom.value : "Caixa Avulso", 
            usuario: usuario, 
            cupom: configCupomCaixa, 
            acao: "baixa_caixa" 
        };

        chrome.runtime.sendMessage({
            action: "fetch",
            url: getUrlRecicla(),
            options: {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(dadosRecicla)
            }
        }, function(response) {
            if (chrome.runtime.lastError || !response || !response.success) {
                console.error("Erro ao enviar Recicla Caixa:", chrome.runtime.lastError || response);
                badgeBtn.innerText = "Erro!";
                setTimeout(() => badgeBtn.innerText = originalText, 2500);
                return;
            }

            badgeBtn.innerText = "LANÇADO ✅";
            // Tenta copiar para a área de transferência caso não consiga injetar
            navigator.clipboard.writeText(configCupomCaixa).then(() => {
                vdStatus(`Cupom ${configCupomCaixa} copiado e registrado!`, "#27ae60");
            }).catch(e => {
                vdStatus("Recicla registrado (Erro ao copiar cupom)", "#c5a059");
            });

            setTimeout(() => badgeBtn.innerText = originalText, 2500);
        });
    }

    // === MODO CAIXAS: NOTIFICAÇÃO PREMIUM DE COMBOS (ESTRUTURA ORIGINAL DO USUÁRIO) ===
    const cacheKey = "bancoCombosBoticario_v9"; 
    const cacheTimeKey = "bancoCombosBoticarioTime_v9";
    let bancoDeCombos = {};
    let carregandoCombos = true;
    let bloqueandoEnterOriginal = false; 
    let ignorarInterceptacao = false;

    function carregarBancoCombos(forcarAtualizacao = false) {
        chrome.storage.local.get(["vd_url_combos"], (data) => {
            const urlPlanilha = data.vd_url_combos;
            if (!urlPlanilha) {
                statusBall.classList.add('erro');
                statusBall.title = "Configure a URL da planilha de Combos nas configurações da extensão.";
                return;
            }

            const cachedData = localStorage.getItem(cacheKey);
            const cachedTime = localStorage.getItem(cacheTimeKey);
            const cacheExpiration = 1000 * 60 * 60 * 12; 
            const now = Date.now();

            if (cachedData) {
                bancoDeCombos = JSON.parse(cachedData);
                carregandoCombos = false;
                statusBall.classList.add('carregado');
            } else {
                statusBall.className = '';
            }

            if (forcarAtualizacao || !cachedData || !cachedTime || (now - parseInt(cachedTime)) > cacheExpiration) {
                if (forcarAtualizacao) { carregandoCombos = true; statusBall.className = ''; }
                
                chrome.runtime.sendMessage({
                    action: "fetch",
                    url: urlPlanilha,
                    options: { method: "GET" }
                }, function(res) {
                    if (chrome.runtime.lastError || !res || !res.success) {
                        if(Object.keys(bancoDeCombos).length === 0) statusBall.classList.add('erro');
                        return;
                    }
                    try {
                        bancoDeCombos = JSON.parse(res.text);
                        localStorage.setItem(cacheKey, JSON.stringify(bancoDeCombos));
                        localStorage.setItem(cacheTimeKey, Date.now().toString());
                        carregandoCombos = false; 
                        statusBall.classList.remove('erro');
                        statusBall.classList.add('carregado');
                    } catch (e) { 
                        if(Object.keys(bancoDeCombos).length === 0) statusBall.classList.add('erro'); 
                    }
                });
            }
        });
    }

    statusBall.addEventListener('click', () => { if (!carregandoCombos) carregarBancoCombos(true); });

    // INTERCEPTAÇÃO DE TECLAS
    window.addEventListener('keydown', function(e) {
        if (configModoPrincipal !== "caixa" || !configCombosAtivo) return;

        if (e.key === 'Enter' && !carregandoCombos && !ignorarInterceptacao) {
            const input = e.target;
            const codLidoOriginal = input.value.trim();
            if (!codLidoOriginal) return;

            let codLidoBusca = codLidoOriginal;
            if (codLidoOriginal.length === 13 && /^\d+$/.test(codLidoOriginal)) {
                codLidoBusca = codLidoOriginal.substring(7, 12); 
            }

            let comboEncontrado = null;
            for (let chaveBanco in bancoDeCombos) {
                let codigosIndividuais = chaveBanco.split(/[,/;\s-]+/).map(c => c.trim()).filter(c => c.length > 0);
                
                if (codigosIndividuais.includes(codLidoBusca)) {
                    if (codLidoBusca !== bancoDeCombos[chaveBanco].codigoCombo && codLidoOriginal !== bancoDeCombos[chaveBanco].codigoCombo) {
                        comboEncontrado = bancoDeCombos[chaveBanco];
                    }
                    break;
                }
            }

            if (comboEncontrado) {
                // AQUI É O PAUSE! Segura o Enter original
                bloqueandoEnterOriginal = true; 
                e.preventDefault();
                e.stopImmediatePropagation();
                
                input.value = ''; // Limpa pra não lançar sozinho e pro operador digitar o combo
                
                abrirModalCombo(comboEncontrado, input, codLidoOriginal);
            } else {
                flutuanteCombo.classList.remove('show');
            }
        }
    }, true);

    window.addEventListener('keypress', function(e) { if (configModoPrincipal === "caixa" && configCombosAtivo && e.key === 'Enter' && bloqueandoEnterOriginal) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    window.addEventListener('keyup', function(e) { if (configModoPrincipal === "caixa" && configCombosAtivo && e.key === 'Enter' && bloqueandoEnterOriginal) { e.preventDefault(); e.stopImmediatePropagation(); bloqueandoEnterOriginal = false; } }, true);

    // FUNÇÃO "PLAY" AJUSTADA PARA O ASP.NET
    function darPlayNoFluxo(inputOriginal, codOriginal) {
        ignorarInterceptacao = true; 
        
        inputOriginal.focus();
        
        // 1. Força o preenchimento na raiz do sistema
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(inputOriginal, codOriginal);
        } else {
            inputOriginal.value = codOriginal;
        }

        // 2. Avisa o SGI que o texto entrou na caixinha
        inputOriginal.dispatchEvent(new Event('input', { bubbles: true }));

        // 3. Dá o Enter exato (usando keypress que é o padrão de submissão do ASP.NET)
        setTimeout(() => {
            inputOriginal.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            setTimeout(() => ignorarInterceptacao = false, 500); 
        }, 100);
    }

    function abrirModalCombo(dados, inputOriginal, codIndividualOriginal) {
        document.getElementById('foto-combo').src = dados.imagem;
        document.getElementById('nome-combo').textContent = dados.nome;
        document.getElementById('codigo-combo').textContent = dados.codigoCombo;
        
        flutuanteCombo.classList.add('show');

        // BOTÃO FECHAR (aciona o Play com o novo ajuste)
        document.getElementById('btn-fechar').onclick = function() { 
            flutuanteCombo.classList.remove('show'); 
            darPlayNoFluxo(inputOriginal, codIndividualOriginal);
        };
    }

    // Inicia a carga de dados armazenados de forma assíncrona
    carregarConfiguracoesIniciais();
}
