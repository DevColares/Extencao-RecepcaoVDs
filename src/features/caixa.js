window.SGI = window.SGI || {};

window.SGI.caixa = {
    carregarSelectCaixas: function () {
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

    renderCaixas: function () {
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
            btn.addEventListener("click", function () {
                const nome = this.getAttribute("data-nome");
                window.SGI.caixa.deletarCaixa(nome);
            });
        });
    },

    deletarCaixa: function (nome) {
        window.SGI.state.configUsuariosCaixa = window.SGI.state.configUsuariosCaixa.filter(u => u !== nome);
        window.SGI.api.salvarStorage("vd_usuarios_caixa", window.SGI.state.configUsuariosCaixa, () => {
            const select = document.getElementById("vd-select-caixa");
            if (select && select.value === nome) select.value = "";
            window.SGI.caixa.carregarSelectCaixas();
            window.SGI.caixa.renderCaixas();
            window.SGI.helpers.vdStatus("Caixa removido!", "#ef4444");
        });
    },

    vdCadastrarCaixa: function () {
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

            const box = document.getElementById("vd-config-box");
            if (box) box.style.display = "none";
        });
    },

    verificarReciclaCaixa: function (nomeRevendedor, codigoRevendedor) {
        const badge = document.getElementById("vd-badge-boti-caixa");
        const st = window.SGI.state;
        if (!badge || st.configModoPrincipal !== "caixa") return;

        // Se já existe um lançamento em andamento, reinicia o monitoramento caso a página tenha recarregado
        if (sessionStorage.getItem("vd_em_andamento") === "true") {
            // Em vez de só colocar "AGUARDANDO PAGTO", vamos reativar a verificação final
            // que cuidará de atualizar a UI e monitorar a emissão.
            if (!window.SGI.caixa._finalCheckInterval) {
                window.SGI.caixa.iniciarVerificacaoFinal();
            }
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

        window.SGI.api.fetchData(urlCompleta, { method: "GET" }, function (response) {
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
                sessionStorage.setItem("vd_cache_identidade", JSON.stringify({ nome: nomeRevendedor, codigo: codigoRevendedor }));

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

    lancarCupomCaixa: function () {
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

    isPaginaPagamento: function () {
        return window.location.href.toLowerCase().includes("pagamento");
    },

    verificarNFEmitida: function () {
        console.log("[SGI CAIXA] Executando verificarNFEmitida...");

        // 1. Estratégia precisa: busca em células td da tabela com a classe td-pedido contendo 'NF Emitida' e o bullet verde
        const tdsPedido = document.querySelectorAll("td.td-pedido");
        console.log("[SGI CAIXA] Total de células td.td-pedido encontradas:", tdsPedido.length);
        const tdSucesso = Array.from(tdsPedido).find(td =>
            td.innerText.includes("NF Emitida") && td.querySelector("img[src*='bullet-10-verde' i]")
        );
        if (tdSucesso) {
            console.log("[SGI CAIXA] Sucesso! Encontrou o bullet verde em uma célula td.td-pedido contendo 'NF Emitida'.");
            return true;
        }

        // 2. Busca genérica em todas as imagens (Estratégia secundária da extensão)
        const imagens = document.getElementsByTagName("img");
        console.log("[SGI CAIXA] Total de imagens encontradas na página:", imagens.length);
        for (let img of imagens) {
            const srcProp = img.src ? img.src.toLowerCase() : "";
            const srcAttr = img.getAttribute("src") ? img.getAttribute("src").toLowerCase() : "";

            if (srcProp.includes("bullet-10-verde") || srcAttr.includes("bullet-10-verde")) {
                const rect = img.getBoundingClientRect();
                const temDimensoes = rect.width > 0 || rect.height > 0 || img.offsetWidth > 0 || img.offsetHeight > 0;
                const naoOcultoEstilo = img.style.display !== "none" && img.style.visibility !== "hidden";
                const temOffsetParent = img.offsetParent !== null;

                console.log("[SGI CAIXA] Encontrou imagem candidata por TagName img.",
                    "srcProp:", srcProp,
                    "srcAttr:", srcAttr,
                    "temDimensoes:", temDimensoes,
                    "naoOcultoEstilo:", naoOcultoEstilo,
                    "temOffsetParent:", temOffsetParent);

                if ((temDimensoes && naoOcultoEstilo) || temOffsetParent) {
                    console.log("[SGI CAIXA] Sucesso! Bullet verde genérico válido detectado.");
                    return true;
                }
            }
        }


        console.log("[SGI CAIXA] Nenhuma imagem de NF Emitida ou texto 'NF Emitida' com bullet verde encontrados/válidos.");
        return false;
    },

    iniciarVerificacaoFinal: function () {
        const urlRecicla = window.SGI.helpers.getUrlRecicla();
        console.log("[SGI CAIXA] Iniciando iniciarVerificacaoFinal. urlRecicla:", urlRecicla);
        if (!urlRecicla) {
            console.warn("[SGI CAIXA] URL do script recicla não configurada!");
            const badge = document.getElementById("vd-badge-boti-caixa");
            if (badge) {
                badge.innerText = "⚠️ CONFIGURAR POPUP";
                badge.style.borderColor = "#ef4444";
                badge.style.color = "#ef4444";
                badge.style.background = "#fff5f5";
            }
            window.SGI.helpers.vdStatus("⚠️ URL não configurada! Acesse o popup da extensão.", "#ef4444");
            return;
        }

        if (window.SGI.caixa._finalCheckInterval) {
            console.log("[SGI CAIXA] Limpando intervalo existente...");
            clearInterval(window.SGI.caixa._finalCheckInterval);
            window.SGI.caixa._finalCheckInterval = null;
        }

        const badge = document.getElementById("vd-badge-boti-caixa");
        const btn = document.getElementById("vd-btn-lancar-caixa");

        const nomeRevendedor = sessionStorage.getItem("vd_nome_cliente") || "CLIENTE";
        const codigoRevendedor = sessionStorage.getItem("vd_codigo_cliente") || "";
        let tentativas = 0;

        const cupomJaSalvo = sessionStorage.getItem("vd_cupom_detectado") === "true";
        if (badge) {
            badge.innerText = cupomJaSalvo
                ? (window.SGI.caixa.isPaginaPagamento() ? "🎟️ CUPOM OK - AGUARDANDO NF" : "🎟️ CUPOM LANÇADO")
                : "⏳ AGUARDANDO CUPOM...";
            badge.style.borderColor = "#1a47d4";
            badge.style.color = "#1a47d4";
            badge.style.background = "#fff";
        }

        if (btn) {
            btn.innerHTML = "⏳ PROCESSANDO";
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.pointerEvents = "none";
        }

        window.SGI.caixa._finalCheckInterval = setInterval(async () => {
            tentativas++;

            const cupomNaTela = document.querySelector(".chip, [id*='Brinde'], [id*='txtCupomDesconto'], .cupom-aplicado") !== null ||
                document.body.innerText.includes("BOTIRECICLA") ||
                document.body.innerText.includes("CUPOM APLICADO");

            const cupomSalvo = sessionStorage.getItem("vd_cupom_detectado") === "true";

            // ⚠️ O timeout SÓ deve disparar quando estamos na página de pagamento.
            // Se ainda estamos em outra tela do PDV (ex: EscolherBrindesPDV, realizarpedidopdv),
            // o cliente pode estar escolhendo brindes — resetamos o contador e aguardamos.
            if (!cupomNaTela && !cupomSalvo && tentativas > 15) {
                if (!window.SGI.caixa.isPaginaPagamento()) {
                    // Ainda no fluxo do PDV mas não no pagamento: zera tentativas e aguarda
                    tentativas = 0;
                    console.log("[SGI CAIXA] Aguardando fora da página de pagamento (ex: brindes). Contador resetado.");
                    return;
                }

                console.log("[SGI CAIXA] Tempo esgotado: cupom não detectado. Destravando painel.");
                alert("⏱️ Tempo esgotado: cupom não detectado. Destravando painel.");

                sessionStorage.removeItem("vd_em_andamento");
                sessionStorage.removeItem("vd_cupom_detectado");

                if (btn) {
                    btn.innerHTML = "Lançar";
                    btn.disabled = false;
                    btn.style.opacity = "1";
                    btn.style.pointerEvents = "auto";
                }

                clearInterval(window.SGI.caixa._finalCheckInterval);
                window.SGI.caixa._finalCheckInterval = null;
                window.SGI.caixa.verificarReciclaCaixa(nomeRevendedor, codigoRevendedor);
                return;
            }

            if (cupomNaTela && !cupomSalvo) {
                console.log("[SGI CAIXA] Cupom detectado com sucesso!");
                sessionStorage.setItem("vd_cupom_detectado", "true");
                if (badge) {
                    badge.innerText = window.SGI.caixa.isPaginaPagamento() ? "🎟️ CUPOM OK - AGUARDANDO NF" : "🎟️ CUPOM LANÇADO";
                }
            }

            if (!window.SGI.caixa.isPaginaPagamento()) return;

            if ((cupomNaTela || cupomSalvo) && window.SGI.caixa.verificarNFEmitida()) {
                console.log("[SGI CAIXA] Confirmado faturamento! Interrompendo intervalo e disparando registro.");
                clearInterval(window.SGI.caixa._finalCheckInterval);
                window.SGI.caixa._finalCheckInterval = null;

                if (badge) {
                    badge.innerText = "✅ ENVIANDO P/ PLANILHA";
                    badge.style.borderColor = "#27ae60";
                    badge.style.color = "#27ae60";
                    badge.style.background = "#f1f8e9";
                }

                const usuarioMemoria = sessionStorage.getItem("vd_usuario_ativo") || window.SGI.state.configCaixaAtivo || "DESCONHECIDO";
                const primeiroNome = nomeRevendedor.split(" ")[0] || "REVENDEDOR";

                try {
                    // ✅ POST envia usuario + nome/codigo + origem para que o Apps Script
                    // saiba escrever na coluna F (LANÇADO POR), e não na E (RECEBIDO POR)
                    await fetch(urlRecicla, {
                        method: "POST", mode: "no-cors",
                        headers: { "Content-Type": "text/plain" },
                        body: JSON.stringify({
                            usuario: usuarioMemoria,
                            nome: nomeRevendedor,
                            codigo: codigoRevendedor,
                            origem: "caixa"
                        })
                    });

                    console.log("[SGI CAIXA] Dados enviados para a planilha com sucesso!");

                    sessionStorage.removeItem("vd_em_andamento");
                    sessionStorage.removeItem("vd_cupom_detectado");

                    const statusBloqueado = {
                        text: "🚫 " + primeiroNome + " - JÁ UTILIZOU",
                        borderColor: "#c62828",
                        color: "#c62828",
                        background: "#fff5f5"
                    };
                    sessionStorage.setItem("vd_cache_status", JSON.stringify(statusBloqueado));

                    if (btn) {
                        btn.innerHTML = "✅ SUCESSO!";
                        btn.style.opacity = "1";
                    }

                    setTimeout(() => {
                        if (btn) {
                            btn.innerHTML = "Lançar";
                        }
                        window.SGI.caixa.verificarReciclaCaixa(nomeRevendedor, codigoRevendedor);
                    }, 2000);

                } catch (e) {
                    console.error("[SGI CAIXA] Erro no fetch:", e);
                    alert("❌ Erro ao enviar para a planilha.");
                    sessionStorage.removeItem("vd_em_andamento");
                    if (btn) {
                        btn.innerHTML = "Lançar";
                        btn.disabled = false;
                        btn.style.opacity = "1";
                        btn.style.pointerEvents = "auto";
                    }
                    window.SGI.caixa.verificarReciclaCaixa(nomeRevendedor, codigoRevendedor);
                }
            }
        }, 1000);
    },

    iniciarMonitorDeBrindes: function () {
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
                            notification.onclick = function () {
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
