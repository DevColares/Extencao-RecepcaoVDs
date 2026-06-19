window.SGI = window.SGI || {};

window.SGI.caixa = {
    carregarSelectCaixas: function() {
        const select = document.getElementById("vd-select-caixa");
        if (!select) return;
        const atual = select.value || window.SGI.state.configCaixaAtivo || "";
        select.innerHTML = '<option value="">-- Selecione --</option>';
        window.SGI.state.configUsuariosCaixa.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u; opt.text = u;
            if (u === atual) opt.selected = true;
            select.appendChild(opt);
        });
    },

    renderCaixas: function() {
        const lista = document.getElementById("vd-lista-caixas");
        if (!lista) return;
        lista.innerHTML = "";

        if (window.SGI.state.configUsuariosCaixa.length === 0) {
            lista.innerHTML = "<div style='color:#777; text-align:center; padding: 10px;'>Nenhum caixa salvo.</div>";
            return;
        }

        window.SGI.state.configUsuariosCaixa.forEach(nome => {
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
                window.SGI.caixa.deletarCaixa(nome);
            });
        });
    },

    deletarCaixa: function(nome) {
        window.SGI.state.configUsuariosCaixa = window.SGI.state.configUsuariosCaixa.filter(u => u !== nome);
        window.SGI.api.salvarStorage("vd_usuarios_caixa", window.SGI.state.configUsuariosCaixa, () => {
            const select = document.getElementById("vd-select-caixa");
            if (select && select.value === nome) select.value = "";
            window.SGI.caixa.carregarSelectCaixas();
            window.SGI.caixa.renderCaixas();
            window.SGI.helpers.vdStatus("Caixa removido!", "#ef4444");
        });
    },

    vdCadastrarCaixa: function() {
        const input = document.getElementById("vd-novo-caixa");
        if (!input) return;
        const nome = input.value.trim().toUpperCase();
        if (!nome) {
            window.SGI.helpers.vdStatus("⚠️ Digite um nome!", "#ef4444");
            return;
        }
        if (window.SGI.state.configUsuariosCaixa.includes(nome)) {
            window.SGI.helpers.vdStatus("⚠️ Já cadastrado!", "#ef4444");
            return;
        }

        window.SGI.state.configUsuariosCaixa.push(nome);
        window.SGI.api.salvarStorage("vd_usuarios_caixa", window.SGI.state.configUsuariosCaixa, () => {
            input.value = "";
            window.SGI.caixa.carregarSelectCaixas();
            window.SGI.caixa.renderCaixas();
            const select = document.getElementById("vd-select-caixa");
            if (select) select.value = nome;
            window.SGI.helpers.vdStatus("Caixa cadastrado!", "#27ae60");
        });
    },

    verificarReciclaCaixa: function(nomeRevendedor, codigoRevendedor) {
        const badge = document.getElementById("vd-badge-boti-caixa");
        const st = window.SGI.state;
        if (!badge || st.configModoPrincipal !== "caixa") return;

        // Se já existe um lançamento em andamento para este cliente, não verifica novamente
        if (sessionStorage.getItem("vd_em_andamento") === "true") {
            const nomeAndamento = sessionStorage.getItem("vd_nome_cliente") || "";
            const primeiroNomeAndamento = nomeAndamento.split(" ")[0] || "CLIENTE";
            
            badge.innerText = primeiroNomeAndamento + " - AGUARDANDO PAGTO";
            badge.style.borderColor = "#1a47d4";
            badge.style.color = "#1a47d4";
            badge.style.background = "#fff";
            return;
        }

        // Se o nome/código são IGUAIS ao que já foi verificado com sucesso nesta sessão, usamos o cache e NÃO fazemos fetch
        const cacheIdentidade = sessionStorage.getItem("vd_cache_identidade");
        if (cacheIdentidade && (nomeRevendedor || codigoRevendedor)) {
            const ident = JSON.parse(cacheIdentidade);
            const nomeIgual = nomeRevendedor && ident.nome === nomeRevendedor;
            const codigoIgual = codigoRevendedor && ident.codigo === codigoRevendedor;

            // Se o que temos na tela bate com o que temos no cache, apenas restaura o visual e para
            if (nomeIgual || codigoIgual) {
                const cacheStatus = sessionStorage.getItem("vd_cache_status");
                if (cacheStatus) {
                    const cache = JSON.parse(cacheStatus);
                    badge.innerText = cache.text;
                    badge.style.borderColor = cache.borderColor;
                    badge.style.color = cache.color;
                    badge.style.background = cache.background;
                    
                    // Restaura estado do botão de lançar do cache
                    const btnLancar = document.getElementById("vd-btn-lancar-caixa");
                    if (btnLancar) {
                        const bloqueado = cache.text.includes("NÃO TEM") || cache.text.includes("UTILIZOU") || cache.text.includes("ERRO");
                        btnLancar.disabled = bloqueado;
                        btnLancar.style.opacity = bloqueado ? "0.5" : "1";
                        btnLancar.style.pointerEvents = bloqueado ? "none" : "auto";
                    }

                    // Atualiza estados internos para o intervalo não disparar de novo
                    st.ultimoNomeMonitorado = nomeRevendedor || ident.nome;
                    st.ultimoCodigoMonitorado = codigoRevendedor || ident.codigo;
                    return; 
                }
            }
        }

        // Se o nome/código estão vazios, tentamos recuperar o último resultado do cache da sessão (fallback)
        if ((!nomeRevendedor || nomeRevendedor.trim() === "") && (!codigoRevendedor || codigoRevendedor.trim() === "")) {
            const cacheStatus = sessionStorage.getItem("vd_cache_status");
            if (cacheStatus) {
                const cache = JSON.parse(cacheStatus);
                badge.innerText = cache.text;
                badge.style.borderColor = cache.borderColor;
                badge.style.color = cache.color;
                badge.style.background = cache.background;
                
                // Restaura o estado do botão de lançar do cache
                const btnLancar = document.getElementById("vd-btn-lancar-caixa");
                if (btnLancar) {
                    const bloqueado = cache.text.includes("NÃO TEM") || cache.text.includes("UTILIZOU") || cache.text.includes("ERRO");
                    btnLancar.disabled = bloqueado;
                    btnLancar.style.opacity = bloqueado ? "0.5" : "1";
                    btnLancar.style.pointerEvents = bloqueado ? "none" : "auto";
                }
                return;
            }

            badge.innerText = "AGUARDANDO...";
            badge.style.borderColor = "#ccc";
            badge.style.color = "#777";
            badge.style.background = "#fff";
            return;
        }

        const urlRecicla = window.SGI.helpers.getUrlRecicla();
        if (!urlRecicla) {
            badge.innerText = "⚠️ URL NÃO CONFIGURADA";
            badge.style.borderColor = "#ef4444";
            badge.style.color = "#ef4444";
            return;
        }

        // Extrai o primeiro nome real... (limpeza do nome)
        let nomeLimpo = (nomeRevendedor || "")
            .replace(/^\d+[\s\-\|]+/, "") 
            .replace(/^\d+$/, "")         
            .trim();

        const partesNome = nomeLimpo.split(/\s+/);
        let primeiroNome = "REVENDEDOR";
        for (let p of partesNome) {
            if (p && isNaN(p) && p.length >= 2) {
                primeiroNome = p.toUpperCase();
                break;
            }
        }

        badge.innerText = "VERIFICANDO...";
        badge.style.borderColor = "#1a47d4";
        badge.style.color = "#1a47d4";
        badge.style.background = "#fff";
        st.monitorNotificacaoEnviada = false;

        const sep = urlRecicla.includes("?") ? "&" : "?";
        let urlCompleta = urlRecicla + sep + "nome=" + encodeURIComponent(nomeRevendedor || "");
        if (codigoRevendedor) urlCompleta += "&codigo=" + encodeURIComponent(codigoRevendedor);

        window.SGI.api.fetchData(urlCompleta, { method: "GET" }, function(response) {
            if (!response || !response.success) {
                badge.innerText = "❌ ERRO DE CONEXÃO";
                badge.style.borderColor = "#c62828";
                badge.style.color = "#c62828";
                return;
            }

            try {
                const dados = JSON.parse(response.text);
                const cupomTexto = dados.cupom ? ` [${dados.cupom}]` : "";

                let statusObj = { text: "", borderColor: "", color: "", background: "" };

                const btnLancar = document.getElementById("vd-btn-lancar-caixa");

                if (dados.utilizado) {
                    statusObj = {
                        text: "🚫 " + primeiroNome + " - JÁ UTILIZOU",
                        borderColor: "#c62828",
                        color: "#c62828",
                        background: "#fff5f5"
                    };
                    if (btnLancar) {
                        btnLancar.disabled = true;
                        btnLancar.style.opacity = "0.5";
                        btnLancar.style.pointerEvents = "none";
                    }
                } else if (dados.encontrado) {
                    statusObj = {
                        text: "⚠️ " + primeiroNome + " TEM CUPOM" + cupomTexto + "!",
                        borderColor: "#e65100",
                        color: "#e65100",
                        background: "#fff8e1"
                    };
                    if (btnLancar) {
                        btnLancar.disabled = false;
                        btnLancar.style.opacity = "1";
                        btnLancar.style.pointerEvents = "auto";
                    }

                    if (!st.monitorNotificacaoEnviada) {
                        st.monitorNotificacaoEnviada = true;
                        window.SGI.ui.dispararNotificacaoMonitor(primeiroNome);
                    }
                } else {
                    statusObj = {
                        text: "✅ " + primeiroNome + " NÃO TEM CUPOM",
                        borderColor: "#2e7d32",
                        color: "#2e7d32",
                        background: "#f1f8e9"
                    };
                    if (btnLancar) {
                        btnLancar.disabled = true;
                        btnLancar.style.opacity = "0.5";
                        btnLancar.style.pointerEvents = "none";
                    }
                }

                badge.innerText = statusObj.text;
                badge.style.borderColor = statusObj.borderColor;
                badge.style.color = statusObj.color;
                badge.style.background = statusObj.background;
                
                // Salva no cache da sessão
                sessionStorage.setItem("vd_cache_status", JSON.stringify(statusObj));
                sessionStorage.setItem("vd_cache_identidade", JSON.stringify({nome: nomeRevendedor, codigo: codigoRevendedor}));

                // Atualiza estados internos para o intervalo saber que já processou
                st.ultimoNomeMonitorado = nomeRevendedor;
                st.ultimoCodigoMonitorado = codigoRevendedor;

            } catch (e) {
                badge.innerText = "❌ ERRO NOS DADOS";
                badge.style.borderColor = "#c62828";
                badge.style.color = "#c62828";
            }
        });
    },

    lancarCupomCaixa: function() {
        const badge = document.getElementById("vd-badge-boti-caixa");
        if (badge && (badge.innerText.includes("JÁ UTILIZOU") || badge.innerText.includes("NÃO TEM CUPOM"))) {
            window.SGI.helpers.vdStatus("⚠️ Lançamento bloqueado: Cupom indisponível.", "#ef4444");
            return;
        }

        const st = window.SGI.state;
        if (!st.configCupomCaixa) {
            window.SGI.helpers.vdStatus("⚠️ Cadastre um cupom nas configurações (⚙️)!", "#ef4444");
            const box = document.getElementById("vd-config-box");
            if (box) box.style.display = "flex";
            return;
        }

        const select = document.getElementById("vd-select-caixa");
        const usuario = select ? select.value : "";
        if (!usuario) {
            window.SGI.helpers.vdStatus("⚠️ Selecione um Recebedor (Caixa) nas configurações!", "#ef4444");
            const box = document.getElementById("vd-config-box");
            if (box) box.style.display = "flex";
            return;
        }

        const campoCupom = document.getElementsByName("ctl00$content$txtCupomDesconto$Tb1")[0] || 
                           document.getElementById("ctl00$content$txtCupomDesconto$Tb1") ||
                           document.getElementById("ctl00_content_txtCupomDesconto_Tb1") ||
                           document.querySelector("input[name$='txtCupomDesconto$Tb1']") ||
                           document.querySelector("input[id$='txtCupomDesconto_Tb1']");

        if (campoCupom) {
            let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(campoCupom, st.configCupomCaixa);
            } else {
                campoCupom.value = st.configCupomCaixa;
            }
            campoCupom.dispatchEvent(new Event('input', { bubbles: true }));
            campoCupom.dispatchEvent(new Event('change', { bubbles: true }));

            setTimeout(() => {
                const btnReal = document.querySelector("[id$='content_lbtAdicionarCupomDesconto']") || 
                                document.getElementById("content_lbtAdicionarCupomDesconto") ||
                                document.getElementById("I3");
                
                if (btnReal) {
                    const href = btnReal.getAttribute("href");
                    if (href && href.trim().startsWith("javascript:")) {
                        let eventTarget = "";
                        const matchDPB = href.match(/__doPostBack\s*\(\s*'([^']+)'/);
                        if (matchDPB) {
                            eventTarget = matchDPB[1];
                        } else {
                            const matchOptions = href.match(/WebForm_PostBackOptions\s*\(\s*"([^"]+)"/);
                            if (matchOptions) {
                                eventTarget = matchOptions[1];
                            } else {
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
                        btnReal.click();
                    }
                } else {
                    console.warn("Botão de adicionar cupom não encontrado na tela.");
                }
            }, 500);
        } else {
            window.SGI.helpers.vdStatus("⚠️ Campo de cupom não encontrado na tela!", "#ef4444");
            console.warn("Campo de cupom não encontrado.");
        }
        const badgeBtn = document.getElementById("vd-btn-lancar-caixa");
        if (badgeBtn) badgeBtn.innerText = "AGUARDANDO PAGAMENTO...";

        const cod = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_codigoEntradaNumero_Tb1");
        const nom = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
        
        sessionStorage.setItem("vd_em_andamento", "true");
        sessionStorage.setItem("vd_usuario_ativo", usuario);
        sessionStorage.setItem("vd_nome_cliente", nom ? nom.value : "Caixa Avulso");
        sessionStorage.setItem("vd_codigo_cliente", cod ? cod.value : "");
        sessionStorage.setItem("vd_cupom", st.configCupomCaixa);

        window.SGI.caixa.iniciarVerificacaoFinal();
    },

    isPaginaPagamento: function() {
        return window.location.href.toLowerCase().includes("pagamento");
    },

    verificarNFEmitida: function() {
        // 1. Busca por imagens que contêm "bullet-10-verde" no atributo ou propriedade src
        const imagens = document.getElementsByTagName("img");
        for (let img of imagens) {
            const srcProp = img.src ? img.src.toLowerCase() : "";
            const srcAttr = img.getAttribute("src") ? img.getAttribute("src").toLowerCase() : "";
            
            if (srcProp.includes("bullet-10-verde") || srcAttr.includes("bullet-10-verde")) {
                // Verifica dimensões físicas e visibilidade no DOM
                const rect = img.getBoundingClientRect();
                const temDimensoes = rect.width > 0 || rect.height > 0 || img.offsetWidth > 0 || img.offsetHeight > 0;
                const naoOcultoEstilo = img.style.display !== "none" && img.style.visibility !== "hidden";
                
                if ((temDimensoes && naoOcultoEstilo) || img.offsetParent !== null) {
                    return true;
                }
            }
        }

        // 2. Busca secundária robusta por classes/seletores que possam conter o bullet verde
        const seletoresExtra = document.querySelectorAll("img[src*='verde'], .bullet-verde, .nf-emitida-icon");
        for (let el of seletoresExtra) {
            const srcProp = el.src ? el.src.toLowerCase() : "";
            const srcAttr = el.getAttribute ? (el.getAttribute("src") ? el.getAttribute("src").toLowerCase() : "") : "";
            
            if (srcProp.includes("bullet-10-verde") || srcAttr.includes("bullet-10-verde")) {
                const rect = el.getBoundingClientRect();
                const temDimensoes = rect.width > 0 || rect.height > 0 || el.offsetWidth > 0 || el.offsetHeight > 0;
                const naoOcultoEstilo = el.style.display !== "none" && el.style.visibility !== "hidden";
                
                if ((temDimensoes && naoOcultoEstilo) || el.offsetParent !== null) {
                    return true;
                }
            }
        }

        // 3. Verificação de fallback baseada no texto visível na página
        if (document.body && document.body.innerText.includes("NF Emitida")) {
            return true;
        }

        return false;
    },

    iniciarVerificacaoFinal: function() {
        const st = window.SGI.state;
        const urlRecicla = window.SGI.helpers.getUrlRecicla();
        if (!urlRecicla) {
            window.SGI.helpers.vdStatus("⚠️ URL não configurada!", "#ef4444");
            return;
        }

        if (window.SGI.caixa._finalCheckInterval) {
            clearInterval(window.SGI.caixa._finalCheckInterval);
        }

        let tentativasCupom = 0;
        const MAX_TENTATIVAS = 20; // Aumentado para 20s

        window.SGI.caixa._finalCheckInterval = setInterval(() => {
            const nomeCliente = sessionStorage.getItem("vd_nome_cliente") || "CLIENTE";
            const primeiroNome = nomeCliente.split(" ")[0];

            // PASSO A: Confirmação do Cupom (Procura por chips de brinde ou texto do cupom)
            const cupomNaTela = document.querySelector(".chip, [id*='Brinde'], [id*='txtCupomDesconto'], .cupom-aplicado") !== null || 
                                document.body.innerText.includes("BOTIRECICLA") ||
                                document.body.innerText.includes("CUPOM APLICADO");
            
            if (cupomNaTela && !sessionStorage.getItem("vd_cupom_detectado")) {
                sessionStorage.setItem("vd_cupom_detectado", "true");
                window.SGI.helpers.vdStatus("✅ Cupom detectado!", "#27ae60");
            }

            if (!sessionStorage.getItem("vd_cupom_detectado")) {
                tentativasCupom++;
            }

            // PASSO B & C: Tela de Pagamento e NF Emitida (bullet-10-verde.gif)
            // Removemos a trava rígida de isPaginaPagamento para ser mais flexível caso a URL mude no final
            const nfEmitida = window.SGI.caixa.verificarNFEmitida();
            const cupomDetectado = sessionStorage.getItem("vd_cupom_detectado") === "true";

            if (nfEmitida) {
                // Se a NF saiu, mas o script perdeu o momento do cupom (timeout), 
                // consideramos como sucesso se estivermos no PDV para não perder o registro.
                if (cupomDetectado || tentativasCupom >= MAX_TENTATIVAS) {
                    
                    clearInterval(window.SGI.caixa._finalCheckInterval);
                    window.SGI.caixa._finalCheckInterval = null;
                    
                    const operador = sessionStorage.getItem("vd_usuario_ativo") || window.SGI.state.configCaixaAtivo || "SGI";
                    const badge = document.getElementById("vd-badge-boti-caixa");
                    
                    if (badge) {
                        badge.innerText = "✅ LANÇADO POR " + operador.split(" ")[0];
                        badge.style.borderColor = "#27ae60";
                        badge.style.color = "#27ae60";
                        badge.style.background = "#f1f8e9";
                    }

                    let dadosRecicla = { 
                        codigo: sessionStorage.getItem("vd_codigo_cliente") || "", 
                        nome: nomeCliente, 
                        usuario: operador,
                        cupom: sessionStorage.getItem("vd_cupom") || st.configCupomCaixa, 
                        acao: "baixa_caixa",
                        nf_confirmada: true
                    };

                    window.SGI.api.fetchData(urlRecicla, {
                        method: "POST",
                        headers: { "Content-Type": "text/plain" },
                        body: JSON.stringify(dadosRecicla)
                    }, function(response) {
                        if (response && response.success) {
                            window.SGI.helpers.vdStatus("Baixa registrada com sucesso!", "#27ae60");
                        }
                    });

                    // Cache de bloqueio
                    const statusBloqueado = {
                        text: "🚫 " + primeiroNome + " - JÁ UTILIZOU",
                        borderColor: "#c62828",
                        color: "#c62828",
                        background: "#fff5f5"
                    };
                    sessionStorage.setItem("vd_cache_status", JSON.stringify(statusBloqueado));

                    // Limpeza
                    sessionStorage.removeItem("vd_em_andamento");
                    sessionStorage.removeItem("vd_usuario_ativo");
                    sessionStorage.removeItem("vd_nome_cliente");
                    sessionStorage.removeItem("vd_codigo_cliente");
                    sessionStorage.removeItem("vd_cupom_detectado");
                    sessionStorage.removeItem("vd_cupom");
                }
            }
        }, 1000);
    },

    iniciarMonitorDeBrindes: function() {
        const st = window.SGI.state;
        if (st.configModoPrincipal !== "caixa") return;

        st.brindeJaNotificado = false;

        const observer = new MutationObserver((mutations) => {
            const pnl = document.getElementById("content_pnlBrindesConquistados");
            if (pnl && pnl.offsetParent !== null) {
                if (!st.brindeJaNotificado) {
                    st.brindeJaNotificado = true;
                    if ("Notification" in window) {
                        const disparar = () => {
                            const notification = new Notification("🎁 BRINDE CONQUISTADO!", {
                                body: "O cliente possui brinde disponível (Boti Recicla ou outro). Volte para o SGI!",
                                icon: "https://www.boticario.com.br/favicon.ico"
                            });
                            notification.onclick = function() {
                                window.focus();
                                this.close();
                            };
                        };

                        if (Notification.permission === "granted") {
                            disparar();
                        } else if (Notification.permission !== "denied") {
                            Notification.requestPermission().then(p => { if (p === "granted") disparar(); });
                        }
                    }
                }
            } else {
                st.brindeJaNotificado = false;
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
};
