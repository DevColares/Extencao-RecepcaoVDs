window.SGI = window.SGI || {};

window.SGI.caixa = {
    carregarSelectCaixas: function() {
        const select = document.getElementById("vd-select-caixa");
        if (!select) return;
        const atual = select.value;
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

    verificarReciclaCaixa: function(nomeRevendedor) {
        const badge = document.getElementById("vd-badge-boti-caixa");
        const st = window.SGI.state;
        if (!badge || st.configModoPrincipal !== "caixa") return;

        const urlRecicla = window.SGI.helpers.getUrlRecicla();
        if (!urlRecicla) {
            badge.innerText = "⚠️ URL NÃO CONFIGURADA";
            badge.style.borderColor = "#ef4444";
            badge.style.color = "#ef4444";
            return;
        }

        const primeiroNome = nomeRevendedor.split(" ")[0] || "REVENDEDOR";

        badge.innerText = "⏳ VERIFICANDO...";
        badge.style.borderColor = "#1a47d4";
        badge.style.color = "#1a47d4";
        badge.style.background = "#fff";
        st.monitorNotificacaoEnviada = false;

        const urlCompleta = urlRecicla + "?nome=" + encodeURIComponent(nomeRevendedor);

        window.SGI.api.fetchData(urlCompleta, { method: "GET" }, function(response) {
            if (!response || !response.success) {
                badge.innerText = "❌ ERRO DE CONEXÃO";
                badge.style.borderColor = "#c62828";
                badge.style.color = "#c62828";
                return;
            }

            try {
                const dados = JSON.parse(response.text);

                if (dados.utilizado) {
                    badge.innerText = "🚫 " + primeiroNome + " - JÁ UTILIZOU";
                    badge.style.borderColor = "#c62828";
                    badge.style.color = "#c62828";
                    badge.style.background = "#fff5f5";
                } else if (dados.encontrado) {
                    badge.innerText = "⚠️ " + primeiroNome + " TEM BOTI RECICLA!";
                    badge.style.borderColor = "#e65100";
                    badge.style.color = "#e65100";
                    badge.style.background = "#fff8e1";

                    if (!st.monitorNotificacaoEnviada) {
                        st.monitorNotificacaoEnviada = true;
                        window.SGI.ui.dispararNotificacaoMonitor(primeiroNome);
                    }
                } else {
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
    },

    lancarCupomCaixa: function() {
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
        const nfElement = document.querySelector("[id*='notaFiscal'], .nf-emitida, img.verde");
        return nfElement !== null;
    },

    iniciarVerificacaoFinal: function() {
        const st = window.SGI.state;
        const urlRecicla = window.SGI.helpers.getUrlRecicla();
        if (!urlRecicla) {
            window.SGI.helpers.vdStatus("⚠️ URL do Recicla não configurada! Acesse o popup.", "#ef4444");
            return;
        }

        const checkInterval = setInterval(() => {
            const chipCupom = document.querySelector(".chip, [id*='Brinde']");
            if (chipCupom && !sessionStorage.getItem("vd_cupom_detectado")) {
                sessionStorage.setItem("vd_cupom_detectado", "true");
            }

            const cupomSalvo = sessionStorage.getItem("vd_cupom_detectado") === "true";
            
            if (window.SGI.caixa.isPaginaPagamento()) {
                if (window.SGI.caixa.verificarNFEmitida()) {
                    clearInterval(checkInterval);
                    
                    if (cupomSalvo) {
                        let dadosRecicla = { 
                            codigo: sessionStorage.getItem("vd_codigo_cliente") || "", 
                            nome: sessionStorage.getItem("vd_nome_cliente") || "Caixa Avulso", 
                            usuario: sessionStorage.getItem("vd_usuario_ativo") || "", 
                            cupom: sessionStorage.getItem("vd_cupom") || st.configCupomCaixa, 
                            acao: "baixa_caixa" 
                        };

                        window.SGI.api.fetchData(urlRecicla, {
                            method: "POST",
                            headers: { "Content-Type": "text/plain" },
                            body: JSON.stringify(dadosRecicla)
                        }, function(response) {
                            if (response && response.success) {
                                window.SGI.helpers.vdStatus("Recicla registrado com NF!", "#27ae60");
                            }
                        });
                    }

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
