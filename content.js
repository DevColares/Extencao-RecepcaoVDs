console.log("[SGI DEBUG] Script content.js iniciado. URL:", window.location.href);
const urlAtual = window.location.href.toLowerCase();
// Agora o script roda em todo o domínio SGI para gerenciar a limpeza de memória
const isDominioSGI = urlAtual.includes("sgi.e-boticario.com.br");
console.log("[SGI DEBUG] Domínio SGI detectado:", isDominioSGI);

if (isDominioSGI) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarExtensao);
    } else {
        inicializarExtensao();
    }
} else {
    // Verificação de URLs customizadas (se houver)
    chrome.storage.local.get(["vd_urls_permitidas"], (data) => {
        const urlsPermitidas = data.vd_urls_permitidas || [];
        for (let padrao of urlsPermitidas) {
            if (urlAtual.includes(padrao.toLowerCase())) {
                inicializarExtensao();
                break;
            }
        }
    });
}

function inicializarExtensao() {
    // Se já foi inicializado (evita duplicidade em alguns eventos)
    if (window.SGI._initialized) return;
    window.SGI._initialized = true;

    const url = window.location.href.toLowerCase();
    const isPaginaAtiva = url.includes("/paginas/gestaorede/") || 
                          url.includes("realizarpedidopdv.aspx") || 
                          url.includes("pagamento") ||
                          url.includes("faturamento") ||
                          url.includes("venda");

    // Só cria o painel no DOM se for uma página onde ele deve aparecer para evitar flicker no menu
    if (isPaginaAtiva) {
        window.SGI.ui.inicializarPainel();
    }

    const getEl = id => document.getElementById(id);
    
    // Recupera estado do painel de config (aberto/fechado)
    if (isPaginaAtiva && sessionStorage.getItem("vd_config_aberta") === "true") {
        const box = getEl("vd-config-box");
        if (box) box.style.display = "flex";
    }

    if(getEl("vd-gear")) getEl("vd-gear").addEventListener("click", () => {
        window.SGI.ui.vdToggleConfig();
        const box = getEl("vd-config-box");
        sessionStorage.setItem("vd_config_aberta", box.style.display === "flex" ? "true" : "false");
    });
    
    if(getEl("vd-gear-caixa")) getEl("vd-gear-caixa").addEventListener("click", () => {
        window.SGI.ui.vdToggleConfig();
        const box = getEl("vd-config-box");
        sessionStorage.setItem("vd_config_aberta", box.style.display === "flex" ? "true" : "false");
    });
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
    
    if(getEl("vd-select-caixa")) getEl("vd-select-caixa").addEventListener("change", (e) => {
        const st = window.SGI.state;
        st.configCaixaAtivo = e.target.value;
        window.SGI.api.salvarStorage("vd_caixa_ativo", st.configCaixaAtivo, () => {
            window.SGI.helpers.vdStatus("Caixa ativo atualizado!", "#27ae60");
        });
    });

    if(getEl("vd-select")) getEl("vd-select").addEventListener("change", (e) => {
        const st = window.SGI.state;
        st.configRecepcaoAtivo = e.target.value;
        window.SGI.api.salvarStorage("vd_recepcao_ativo", st.configRecepcaoAtivo, () => {
            window.SGI.helpers.vdStatus("Usuário ativo atualizado!", "#27ae60");
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
        // Limpa TUDO para forçar consulta real
        window.SGI.state.ultimoNomeMonitorado = ""; 
        window.SGI.state.ultimoCodigoMonitorado = ""; 
        sessionStorage.removeItem("vd_cache_status");
        sessionStorage.removeItem("vd_cache_identidade");

        const btnLancar = document.getElementById("vd-btn-lancar-caixa");
        if (btnLancar) {
            btnLancar.disabled = true;
            btnLancar.style.opacity = "0.5";
        }

        const nome = window.SGI.helpers.getSGINome();
        const codigo = window.SGI.helpers.getSGICodigo();
        if (nome !== "" || codigo !== "") {
            window.SGI.caixa.verificarReciclaCaixa(nome, codigo);
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

    // Verifica se saímos da página de PDV para limpar o estado
    const verificarSaidaPDV = () => {
        const url = window.location.href.toLowerCase();
        
        // No PDV real (Pedido, Pagamento, Faturamento ou qualquer página do GestaoRede)
        const isNoPDVAtivo = url.includes("realizarpedidopdv.aspx") || 
                             url.includes("pagamento") || 
                             url.includes("/paginas/gestaorede/") ||
                             url.includes("faturamento") ||
                             url.includes("venda");
        
        // Telas de conclusão/pós-venda que indicam que o atendimento acabou
        const isConcluido = url.includes("impressao") || url.includes("concluido") || url.includes("finalizado") || url.includes("sucesso");
        
        console.log("[SGI EXT] verificarSaidaPDV | URL:", url, "| isNoPDVAtivo:", isNoPDVAtivo, "| isConcluido:", isConcluido);
        
        // Se não estamos no PDV ativo OU se já chegamos na tela de conclusão, limpamos a memória
        if (!isNoPDVAtivo || isConcluido) {
            if (sessionStorage.getItem("vd_em_andamento") === "true" || sessionStorage.getItem("vd_cache_status")) {
                console.log("[SGI EXT] Fluxo de PDV encerrado ou Saída detectada. Limpando estados da sessão.");
                sessionStorage.removeItem("vd_em_andamento");
                sessionStorage.removeItem("vd_usuario_ativo");
                sessionStorage.removeItem("vd_nome_cliente");
                sessionStorage.removeItem("vd_codigo_cliente");
                sessionStorage.removeItem("vd_cupom_detectado");
                sessionStorage.removeItem("vd_cupom");
                sessionStorage.removeItem("vd_cache_status");
                sessionStorage.removeItem("vd_cache_identidade");
                
                window.SGI.state.ultimoNomeMonitorado = "";
                window.SGI.state.ultimoCodigoMonitorado = "";
                window.SGI.state.ultimoNomeConsultado = "";
                window.SGI.state.ultimoCodigoConsultado = "";
            }
        }
    };

    verificarSaidaPDV();

    setInterval(() => {
        verificarSaidaPDV(); // Monitora navegação interna se houver
        const nomeAtual = window.SGI.helpers.getSGINome();
        const codigoAtual = window.SGI.helpers.getSGICodigo();
        const st = window.SGI.state;

        // Se o nome e código estão vazios, reseta os controles de consulta
        if (nomeAtual === "" && codigoAtual === "") {
            // Se estamos no PDV, mantemos o último status verificado no badge via cache da sessão
            // Caso contrário, resetamos tudo.
            const url = window.location.href.toLowerCase();
            const isPDV = url.includes("realizarpedidopdv.aspx") || 
                          url.includes("pagamento") || 
                          url.includes("/paginas/gestaorede/") ||
                          url.includes("faturamento") ||
                          url.includes("venda");
            
            if (!isPDV) {
                st.ultimoNomeConsultado = "";
                st.ultimoCodigoConsultado = "";
                st.ultimoNomeMonitorado = "";
                st.ultimoCodigoMonitorado = "";
                window.SGI.caixa.verificarReciclaCaixa("", ""); // Limpa o badge
            } else {
                // No PDV mas sem nome visível: tenta restaurar o badge do cache
                window.SGI.caixa.verificarReciclaCaixa("", "");
            }
            return;
        }

        // Se o nome ou código mudou em relação à consulta geral (Recepção/Supervisor)
        if (nomeAtual !== st.ultimoNomeConsultado || codigoAtual !== st.ultimoCodigoConsultado) {
            // Verifica se a mudança é real ou se é apenas o primeiro carregamento pós-postback
            const cacheIdentidade = sessionStorage.getItem("vd_cache_identidade");
            let isMudancaReal = true;
            if (cacheIdentidade) {
                const ident = JSON.parse(cacheIdentidade);
                if (ident.nome === nomeAtual && ident.codigo === codigoAtual) {
                    isMudancaReal = false;
                }
            }

            st.ultimoNomeConsultado = nomeAtual;
            st.ultimoCodigoConsultado = codigoAtual;
            st.notificacaoEnviada = false;

            if (isMudancaReal) {
                sessionStorage.removeItem("vd_cache_status");
                sessionStorage.removeItem("vd_cache_identidade");
            }

            window.SGI.recepcao.verificarRetirada(true);
            window.SGI.supervisor.verificarSupervisor();
        }

        // Se o nome ou código mudou em relação ao monitoramento do Caixa (Boti Recicla)
        // ou se acabamos de entrar no modo caixa para um nome que já estava no SGI
        if (st.configModoPrincipal === "caixa" && (nomeAtual !== st.ultimoNomeMonitorado || codigoAtual !== st.ultimoCodigoMonitorado)) {
            st.ultimoNomeMonitorado = nomeAtual;
            st.ultimoCodigoMonitorado = codigoAtual;
            window.SGI.caixa.verificarReciclaCaixa(nomeAtual, codigoAtual);
        }
    }, 1000);

    window.SGI.api.carregarConfiguracoesIniciais(() => {
        const st = window.SGI.state;
        const getEl = id => document.getElementById(id);

        // Restaura estados de consulta do cache IMEDIATAMENTE para evitar limpeza no postback
        const cacheIdentidade = sessionStorage.getItem("vd_cache_identidade");
        if (cacheIdentidade) {
            const ident = JSON.parse(cacheIdentidade);
            st.ultimoNomeConsultado = ident.nome || "";
            st.ultimoCodigoConsultado = ident.codigo || "";
            st.ultimoNomeMonitorado = ident.nome || "";
            st.ultimoCodigoMonitorado = ident.codigo || "";
        }

        // Aplica configurações visuais
        window.SGI.ui.aplicarConfiguracoesVisuais();
        
        // Restaura badge do cache IMEDIATAMENTE se estivermos no PDV
        const url = window.location.href.toLowerCase();
        const isPDV = url.includes("realizarpedidopdv.aspx") || 
                      url.includes("pagamento") || 
                      url.includes("/paginas/gestaorede/") ||
                      url.includes("faturamento") ||
                      url.includes("venda");
        if (isPDV && st.configModoPrincipal === "caixa") {
            window.SGI.caixa.verificarReciclaCaixa("", "");
        }

        if(getEl("vd-escala")) getEl("vd-escala").value = st.configScale;
        window.SGI.helpers.aplicarEscala(st.configScale);

        window.SGI.supervisor.renderMapeamentos();
        window.SGI.recepcao.carregarSelectUsuarios();
        window.SGI.recepcao.renderUsuarios();

        if(getEl("vd-cupom-caixa")) getEl("vd-cupom-caixa").value = st.configCupomCaixa;
        window.SGI.caixa.carregarSelectCaixas();
        window.SGI.caixa.renderCaixas();
        
        if (st.configModoPrincipal === "caixa" && st.configCombosAtivo) {
            window.SGI.combos.carregarBancoCombos(false);
        }
    });

    window.SGI.combos.iniciarListeners();
    window.SGI.caixa.iniciarMonitorDeBrindes();

    console.log("[SGI EXT] Verificando lançamento pendente na inicialização. vd_em_andamento:", sessionStorage.getItem("vd_em_andamento"));
    if (sessionStorage.getItem("vd_em_andamento") === "true") {
        console.log("[SGI EXT] Lançamento em andamento ativo. Chamando iniciarVerificacaoFinal.");
        window.SGI.caixa.iniciarVerificacaoFinal();
    }

    // Listener para mudanças no storage (ex: trocar modo no popup)
    chrome.storage.onChanged.addListener((changes) => {
        window.SGI.api.carregarConfiguracoesIniciais(() => {
            // Força re-verificação se o modo mudou
            if (changes.vd_modo_principal) {
                window.SGI.state.ultimoNomeMonitorado = "";
                window.SGI.state.ultimoCodigoMonitorado = "";
            }
            window.SGI.ui.aplicarConfiguracoesVisuais();
            console.log("Configurações do SGI atualizadas via Storage.");
        });
    });
    }
