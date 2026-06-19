window.SGI = window.SGI || {};

window.SGI.combos = {
    bancoDeCombos: {},
    carregandoCombos: true,
    bloqueandoEnterOriginal: false,
    ignorarInterceptacao: false,
    currentEscListener: null,

    carregarBancoCombos: function(forcarAtualizacao = false) {
        const st = window.SGI.state;
        const urlPlanilha = st.configUrlCombos;
        const statusBall = document.getElementById("combo-status-ball");

        if (!urlPlanilha) {
            if (statusBall) {
                statusBall.classList.add('erro');
                statusBall.title = "Configure a URL da planilha de Combos nas configurações da extensão.";
            }
            return;
        }

        const cacheKey = window.SGI.constants.CACHE_KEY_COMBOS;
        const cacheTimeKey = window.SGI.constants.CACHE_TIME_KEY_COMBOS;
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);
        const cacheExpiration = 1000 * 60 * 60 * 12; 
        const now = Date.now();

        if (cachedData) {
            window.SGI.combos.bancoDeCombos = JSON.parse(cachedData);
            window.SGI.combos.carregandoCombos = false;
            if (statusBall) statusBall.classList.add('carregado');
        } else {
            if (statusBall) statusBall.className = '';
        }

        if (forcarAtualizacao || !cachedData || !cachedTime || (now - parseInt(cachedTime)) > cacheExpiration) {
            if (forcarAtualizacao) { 
                window.SGI.combos.carregandoCombos = true; 
                if (statusBall) statusBall.className = ''; 
            }
            
            window.SGI.api.fetchData(urlPlanilha, { method: "GET" }, function(res) {
                if (!res || !res.success) {
                    if(Object.keys(window.SGI.combos.bancoDeCombos).length === 0 && statusBall) {
                        statusBall.classList.add('erro');
                    }
                    return;
                }
                try {
                    window.SGI.combos.bancoDeCombos = JSON.parse(res.text);
                    localStorage.setItem(cacheKey, JSON.stringify(window.SGI.combos.bancoDeCombos));
                    localStorage.setItem(cacheTimeKey, Date.now().toString());
                    window.SGI.combos.carregandoCombos = false; 
                    if (statusBall) {
                        statusBall.classList.remove('erro');
                        statusBall.classList.add('carregado');
                    }
                } catch (e) { 
                    if(Object.keys(window.SGI.combos.bancoDeCombos).length === 0 && statusBall) {
                        statusBall.classList.add('erro'); 
                    }
                }
            });
        }
    },

    darPlayNoFluxo: function(inputOriginal, codOriginal) {
        window.SGI.combos.ignorarInterceptacao = true; 
        
        inputOriginal.focus();
        
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(inputOriginal, codOriginal);
        } else {
            inputOriginal.value = codOriginal;
        }

        inputOriginal.dispatchEvent(new Event('input', { bubbles: true }));

        setTimeout(() => {
            inputOriginal.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            setTimeout(() => window.SGI.combos.ignorarInterceptacao = false, 500); 
        }, 100);
    },

    mostrarModalConfirmacao: function(input, codigo, nome) {
        const modal = document.getElementById('vd-modal-confirmacao');
        const txtNome = document.getElementById('vd-confirm-nome');
        const txtCodigo = document.getElementById('vd-confirm-codigo');
        const btnSim = document.getElementById('vd-confirm-sim');
        const btnNao = document.getElementById('vd-confirm-nao');

        if (!modal || !txtNome || !txtCodigo || !btnSim || !btnNao) return;

        txtNome.innerText = nome || "PRODUTO NÃO IDENTIFICADO";
        txtCodigo.innerText = "Código: " + codigo;
        modal.style.display = "flex";
        modal.style.transform = "translate(-50%, -50%) scale(1)";

        const fechar = () => {
            modal.style.display = "none";
            modal.style.transform = "translate(-50%, -50%) scale(0.9)";
            window.SGI.combos.bloqueandoEnterOriginal = false;
        };

        btnSim.onclick = () => {
            fechar();
            // Delay solicitado pelo usuário antes de lançar
            setTimeout(() => {
                window.SGI.combos.darPlayNoFluxo(input, codigo);
            }, 500);
        };

        btnNao.onclick = () => {
            fechar();
            input.value = "";
            input.focus();
        };

        // Atalhos de teclado no modal
        const handleKeys = (e) => {
            if (modal.style.display === "flex") {
                if (e.key === "Enter") { e.preventDefault(); btnSim.click(); window.removeEventListener('keydown', handleKeys); }
                if (e.key === "Escape") { e.preventDefault(); btnNao.click(); window.removeEventListener('keydown', handleKeys); }
            }
        };
        window.addEventListener('keydown', handleKeys);
    },

    abrirModalCombo: function(dadosArray, inputOriginal, codIndividualOriginal) {
        const listaCombo = document.getElementById('combo-lista');
        if (!listaCombo) return;
        listaCombo.innerHTML = "";

        dadosArray.forEach(dados => {
            const nomeFormatado = dados.nome ? dados.nome.replace(/\n/g, '<br>') : "Combo Sem Nome";
            const itemHtml = `
                <div class="combo-item-container">
                    <img src="${dados.imagem}" style="width: 120px; height: 120px; object-fit: contain; border-radius: 8px; background: #fff; margin: 10px 0;">
                    <div style="font-size: 13px; margin-bottom: 5px; line-height: 1.2;">${nomeFormatado}</div>
                    <div style="font-size: 11px; opacity: 0.8;">CÓDIGO DO COMBO (DIGITE ABAIXO):</div>
                    <div class="codigo-combo-box">${dados.codigoCombo}</div>
                </div>
            `;
            listaCombo.insertAdjacentHTML('beforeend', itemHtml);
        });
        
        const flutuanteCombo = document.getElementById('alerta-combo-flutuante');
        if (flutuanteCombo) flutuanteCombo.classList.add('show');

        if (window.SGI.combos.currentEscListener) {
            window.removeEventListener('keydown', window.SGI.combos.currentEscListener, true);
        }

        const fecharModal = function() {
            if (flutuanteCombo) flutuanteCombo.classList.remove('show'); 
            if (window.SGI.combos.currentEscListener) {
                window.removeEventListener('keydown', window.SGI.combos.currentEscListener, true);
                window.SGI.combos.currentEscListener = null;
            }
            window.SGI.combos.darPlayNoFluxo(inputOriginal, codIndividualOriginal);
        };

        const btnFechar = document.getElementById('btn-fechar');
        if (btnFechar) {
            btnFechar.onclick = fecharModal;
        }

        window.SGI.combos.currentEscListener = function(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                fecharModal();
            }
        };
        window.addEventListener('keydown', window.SGI.combos.currentEscListener, true);
    },

    iniciarListeners: function() {
        const statusBall = document.getElementById("combo-status-ball");
        if (statusBall) {
            statusBall.addEventListener('click', () => { 
                if (!window.SGI.combos.carregandoCombos) window.SGI.combos.carregarBancoCombos(true); 
            });
        }

        window.addEventListener('keydown', function(e) {
            const st = window.SGI.state;
            if (st.configModoPrincipal !== "caixa" || !st.configCombosAtivo) return;

            if (e.key === 'Enter' && !window.SGI.combos.carregandoCombos && !window.SGI.combos.ignorarInterceptacao) {
                const input = e.target;
                const codLidoOriginal = input.value.trim();
                if (!codLidoOriginal) return;

                let codLidoBusca = codLidoOriginal;
                if (codLidoOriginal.length === 13 && /^\d+$/.test(codLidoOriginal)) {
                    codLidoBusca = codLidoOriginal.substring(7, 12); 
                }

                const url = window.location.href.toLowerCase();
                // Identifica se estamos em telas de Preços, Provadores ou se é uma busca de produto genérica
                const isTelaConfirmacao = url.includes("consultapreco") || url.includes("provador") || url.includes("estoque") || url.includes("pedido");

                let combosEncontrados = [];
                let nomeProdutoIdentificado = "";

                for (let chaveBanco in window.SGI.combos.bancoDeCombos) {
                    let item = window.SGI.combos.bancoDeCombos[chaveBanco];
                    let codigosIndividuais = chaveBanco.split(/[,/;\s-]+/).map(c => c.trim()).filter(c => c.length > 0);
                    
                    if (codigosIndividuais.includes(codLidoBusca)) {
                        nomeProdutoIdentificado = item.nome; // Guarda o nome do produto/combo
                        if (codLidoBusca !== item.codigoCombo && codLidoOriginal !== item.codigoCombo) {
                            combosEncontrados.push(item);
                        }
                    }
                }

                if (combosEncontrados.length > 0) {
                    window.SGI.combos.bloqueandoEnterOriginal = true; 
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    input.value = ''; 
                    // Pequeno delay para "leitura" do código
                    setTimeout(() => {
                        window.SGI.combos.abrirModalCombo(combosEncontrados, input, codLidoOriginal);
                    }, 300);
                } else {
                    const flutuanteCombo = document.getElementById('alerta-combo-flutuante');
                    if (flutuanteCombo) flutuanteCombo.classList.remove('show');
                }
            }
        }, true);

        window.addEventListener('keypress', function(e) { 
            const st = window.SGI.state;
            if (st.configModoPrincipal === "caixa" && st.configCombosAtivo && e.key === 'Enter' && window.SGI.combos.bloqueandoEnterOriginal) { 
                e.preventDefault(); e.stopImmediatePropagation(); 
            } 
        }, true);

        window.addEventListener('keyup', function(e) { 
            const st = window.SGI.state;
            if (st.configModoPrincipal === "caixa" && st.configCombosAtivo && e.key === 'Enter' && window.SGI.combos.bloqueandoEnterOriginal) { 
                e.preventDefault(); e.stopImmediatePropagation(); 
                window.SGI.combos.bloqueandoEnterOriginal = false; 
            } 
        }, true);
    }
};
