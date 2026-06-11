const urlAtual = window.location.href;

chrome.storage.local.get(["vd_urls_permitidas"], (data) => {
    const urlsPermitidas = data.vd_urls_permitidas || [];
    let deveAtivar = false;

    if (urlsPermitidas.length === 0) {
        if (urlAtual.includes("/Paginas/GestaoRede/")) {
            deveAtivar = true;
        }
    } else {
        for (let padrao of urlsPermitidas) {
            if (urlAtual.includes(padrao)) {
                deveAtivar = true;
                break;
            }
        }
    }

    if (deveAtivar) {
        inicializarExtensao();
    }
});

function inicializarExtensao() {
    window.SGI.ui.inicializarPainel();

    const getEl = id => document.getElementById(id);
    
    if(getEl("vd-gear")) getEl("vd-gear").addEventListener("click", window.SGI.ui.vdToggleConfig);
    if(getEl("vd-gear-caixa")) getEl("vd-gear-caixa").addEventListener("click", window.SGI.ui.vdToggleConfig);
    if(getEl("vd-salvar")) getEl("vd-salvar").addEventListener("click", window.SGI.recepcao.vdCadastrar);
    if(getEl("vd-salvar-sup")) getEl("vd-salvar-sup").addEventListener("click", window.SGI.supervisor.vdSalvarSupervisor);
    if(getEl("vd-salvar-caixa")) getEl("vd-salvar-caixa").addEventListener("click", window.SGI.caixa.vdCadastrarCaixa);
    
    if(getEl("vd-cupom-caixa")) getEl("vd-cupom-caixa").addEventListener("change", (e) => {
        const st = window.SGI.state;
        st.configCupomCaixa = e.target.value.trim();
        window.SGI.api.salvarStorage("vd_cupom_caixa", st.configCupomCaixa, () => {
            window.SGI.helpers.vdStatus("Cupom salvo!", "#27ae60");
        });
    });
    
    if(getEl("vd-enviar-pill")) getEl("vd-enviar-pill").addEventListener("click", window.SGI.recepcao.vdEnviar);
    if(getEl("btn-whatsapp")) getEl("btn-whatsapp").addEventListener("click", window.SGI.recepcao.abrirWhatsApp);
    if(getEl("btn-retirada")) getEl("btn-retirada").addEventListener("click", () => window.SGI.recepcao.verificarRetirada(false));
    
    if(getEl("vd-toast-close")) getEl("vd-toast-close").addEventListener("click", () => {
        const toast = getEl("vd-toast-container");
        if (toast) toast.classList.remove("show");
    });
    
    if(getEl("vd-btn-atualizar-caixa")) getEl("vd-btn-atualizar-caixa").addEventListener("click", () => {
        window.SGI.state.ultimoNomeMonitorado = ""; 
        const nomInput = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
        if (nomInput && nomInput.value.trim() !== "") {
            window.SGI.caixa.verificarReciclaCaixa(nomInput.value.trim());
        }
    });
    
    if(getEl("vd-btn-lancar-caixa")) getEl("vd-btn-lancar-caixa").addEventListener("click", window.SGI.caixa.lancarCupomCaixa);

    if(getEl("vd-escala")) getEl("vd-escala").addEventListener("change", (e) => {
        const escala = e.target.value;
        window.SGI.api.salvarStorage("vd_escala", escala, () => {
            window.SGI.state.configScale = escala;
            window.SGI.helpers.aplicarEscala(escala);
        });
    });

    setInterval(() => {
        const nomInput = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
        const nomeAtual = nomInput ? nomInput.value.trim() : "";
        const st = window.SGI.state;

        if (nomeAtual !== "" && nomeAtual !== st.ultimoNomeConsultado) {
            st.ultimoNomeConsultado = nomeAtual;
            st.notificacaoEnviada = false; 
            window.SGI.recepcao.verificarRetirada(true);
            window.SGI.supervisor.verificarSupervisor();

            if (st.configModoPrincipal === "caixa" && nomeAtual !== st.ultimoNomeMonitorado) {
                st.ultimoNomeMonitorado = nomeAtual;
                window.SGI.caixa.verificarReciclaCaixa(nomeAtual);
            }
        }
    }, 1000);

    window.SGI.api.carregarConfiguracoesIniciais(() => {
        const st = window.SGI.state;
        const getEl = id => document.getElementById(id);
        
        if(getEl("vd-escala")) getEl("vd-escala").value = st.configScale;
        window.SGI.helpers.aplicarEscala(st.configScale);

        window.SGI.supervisor.renderMapeamentos();
        window.SGI.recepcao.carregarSelectUsuarios();
        window.SGI.recepcao.renderUsuarios();
        
        if(getEl("vd-cupom-caixa")) getEl("vd-cupom-caixa").value = st.configCupomCaixa;
        window.SGI.caixa.carregarSelectCaixas();
        window.SGI.caixa.renderCaixas();

        window.SGI.ui.aplicarConfiguracoesVisuais();
        
        if (st.configModoPrincipal === "caixa" && st.configCombosAtivo) {
            window.SGI.combos.carregarBancoCombos(false);
        }
    });

    window.SGI.combos.iniciarListeners();
    window.SGI.caixa.iniciarMonitorDeBrindes();

    if (sessionStorage.getItem("vd_em_andamento") === "true") {
        window.SGI.caixa.iniciarVerificacaoFinal();
    }
}
