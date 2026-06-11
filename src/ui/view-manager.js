window.SGI = window.SGI || {};

window.SGI.ui = {
    inicializarPainel: function() {
        if (document.getElementById("painelVD")) return;

        const painel = document.createElement("div");
        painel.id = "painelVD";
        // ... (rest of the innerHTML remains same as before)
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
      <div id="vd-monitor-badge" style="display:none; background:#fff; border:2px solid #1a47d4; color:#1a47d4; font-weight:bold; font-size:13px; text-transform:uppercase; padding:8px 15px; text-align:center; font-family:Arial,Helvetica,sans-serif; margin-bottom:6px; box-shadow:0 2px 4px rgba(0,0,0,.05);">MODO CAIXAS ATIVO</div>

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
          <button id="vd-badge-boti-caixa" style="flex: 1; height: 36px; font-size: 11px; font-weight: bold; border: 2px solid #ccc; background: #fff; border-radius: 4px; color: #555; pointer-events: none;">AGUARDANDO...</button>
          <button id="vd-btn-lancar-caixa" style="height: 36px; padding: 0 10px; border: none; background: #1a47d4; color: #fff; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 4px;">➡️ LANÇAR</button>
        </div>
      </div>
    `;

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
            position: fixed; top: 20px; right: 20px; max-width: 420px; width: calc(100vw - 40px);
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

        .combo-item-container { border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px; }
        .combo-item-container:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    `;
        document.head.appendChild(estiloCombo);

        const statusBall = document.createElement('div');
        statusBall.id = 'combo-status-ball';
        statusBall.title = "Clique para atualizar o Banco de Combos manualmente";
        statusBall.style.display = "none";
        document.body.appendChild(statusBall);

        const flutuanteCombo = document.createElement('div');
        flutuanteCombo.id = 'alerta-combo-flutuante';
        flutuanteCombo.innerHTML = `
        <h3 style="margin:0; color: #FFD700; font-size: 15px; margin-bottom: 10px;">🎁 COMBO DISPONÍVEL</h3>
        <div id="combo-lista" style="max-height: 400px; overflow-y: auto; text-align: center;"></div>
        <div style="margin-top: 15px;">
            <button type="button" id="btn-fechar" class="btn-acao">LANÇAR ITEM ORIGINAL (ESC)</button>
        </div>
    `;
        document.body.appendChild(flutuanteCombo);
    },

    aplicarConfiguracoesVisuais: function() {
        const st = window.SGI.state;
        const url = window.location.href.toLowerCase();
        
        // Verifica se estamos em uma página que deve mostrar o painel
        const isPaginaAtiva = url.includes("/paginas/gestaorede/") || 
                              url.includes("realizarpedidopdv.aspx") || 
                              url.includes("pagamento");

        const painel = document.getElementById("painelVD");
        if (painel) {
            painel.style.display = isPaginaAtiva ? "flex" : "none";
        }

        if (!isPaginaAtiva) return;

        const modoRecepcao = st.configModoPrincipal === "recepcao";
        const modoCaixa = st.configModoPrincipal === "caixa";

        const setDisplay = (id, displayStyle) => {
            const el = document.getElementById(id);
            if (el) el.style.display = displayStyle;
        };

        setDisplay("botoes-recepcao", modoRecepcao ? "block" : "none");
        setDisplay("botoes-caixa", modoCaixa ? "flex" : "none");

        if (modoRecepcao) {
            setDisplay("vd-enviar-pill", st.configReciclaAtivo ? "flex" : "none");
            setDisplay("btn-retirada", st.configRetiradaAtivo ? "flex" : "none");
            setDisplay("btn-whatsapp", st.configAlocacaoAtivo ? "flex" : "none");
        }

        setDisplay("vd-sup-display", "none");
        setDisplay("vd-secao-supervisor", modoRecepcao ? "block" : "none");
        setDisplay("vd-hr-sup", modoRecepcao ? "block" : "none");
        setDisplay("vd-secao-caixa", modoCaixa ? "block" : "none");
        setDisplay("vd-hr-caixa", modoCaixa ? "block" : "none");
        setDisplay("vd-secao-recepcao", modoRecepcao ? "block" : "none");
        setDisplay("vd-hr", modoRecepcao ? "block" : "none");

        const ball = document.getElementById("combo-status-ball");
        if (ball) ball.style.display = (modoCaixa && st.configCombosAtivo) ? "block" : "none";

        setDisplay("vd-monitor-badge", "none");

        if (modoRecepcao && window.SGI.supervisor) {
            window.SGI.supervisor.verificarSupervisor();
        }
    },

    vdToggleConfig: function() {
        const box = document.getElementById("vd-config-box");
        if (box) box.style.display = (box.style.display === "flex") ? "none" : "flex";
    },

    dispararToastWindows: function(nomeSupervisor) {
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
    },

    dispararNotificacaoMonitor: function(primeiroNome) {
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
};
