window.SGI = window.SGI || {};

window.SGI.recepcao = {
    carregarSelectUsuarios: function() {
        const select = document.getElementById("vd-select");
        if (!select) return;
        const atual = select.value || window.SGI.state.configRecepcaoAtivo || "";
        select.innerHTML = '<option value="">-- Selecione --</option>';
        window.SGI.state.configUsuarios.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u; opt.text = u;
            if (u === atual) opt.selected = true;
            select.appendChild(opt);
        });
    },

    renderUsuarios: function() {
        const lista = document.getElementById("vd-lista-usuarios");
        if (!lista) return;
        lista.innerHTML = "";

        if (window.SGI.state.configUsuarios.length === 0) {
            lista.innerHTML = "<div style='color:#777; text-align:center; padding: 10px;'>Nenhum usuário salvo.</div>";
            return;
        }

        window.SGI.state.configUsuarios.forEach(nome => {
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
                window.SGI.recepcao.deletarUsuario(nome);
            });
        });
    },

    deletarUsuario: function(nome) {
        window.SGI.state.configUsuarios = window.SGI.state.configUsuarios.filter(u => u !== nome);
        window.SGI.api.salvarStorage("vd_usuarios", window.SGI.state.configUsuarios, () => {
            const select = document.getElementById("vd-select");
            if (select && select.value === nome) select.value = "";

            window.SGI.recepcao.carregarSelectUsuarios();
            window.SGI.recepcao.renderUsuarios();
            window.SGI.helpers.vdStatus("Usuário removido!", "#ef4444");
        });
    },

    vdCadastrar: function() {
        const input = document.getElementById("vd-novo");
        if (!input) return;
        const nome = input.value.trim().toUpperCase();
        if (!nome) { 
            window.SGI.helpers.vdStatus("⚠️ Digite um nome!", "#ef4444"); 
            return; 
        }
        if (window.SGI.state.configUsuarios.includes(nome)) { 
            window.SGI.helpers.vdStatus("⚠️ Já cadastrado!", "#ef4444"); 
            return; 
        }
        
        window.SGI.state.configUsuarios.push(nome);
        window.SGI.api.salvarStorage("vd_usuarios", window.SGI.state.configUsuarios, () => {
            input.value = "";
            window.SGI.recepcao.carregarSelectUsuarios();
            window.SGI.recepcao.renderUsuarios();

            const select = document.getElementById("vd-select");
            if (select) select.value = nome;
            window.SGI.helpers.vdStatus("Cadastrado com sucesso!", "#27ae60");
        });
    },

    verificarRetirada: function(isAutomatico) {
        const st = window.SGI.state;
        if (isAutomatico && (st.configModoPrincipal !== "recepcao" || !st.configRetiradaAtivo)) {
            return;
        }

        const nomInput = document.getElementById("ContentPlaceHolder1_cltBuscaPessoa_nomeEntradaTexto_Tb1");
        const nomeRevendedor = nomInput ? nomInput.value.trim() : "";
        if (!nomeRevendedor) return;

        const btn = document.getElementById("btn-retirada");
        if (!btn) return;
        
        const textoOriginal = "Consultar Retirada";
        btn.innerText = "Consultando...";
        btn.disabled = true;
        btn.style.background = "#ffffff"; btn.style.color = "#c5a059"; btn.style.borderColor = "#c5a059";

        const urlBase = window.SGI.helpers.getUrlRetirada();
        if (!urlBase) {
            btn.innerText = "URL não configurada!";
            btn.style.background = "#ef4444"; btn.style.color = "#fff"; btn.style.borderColor = "#ef4444";
            btn.disabled = false;
            setTimeout(() => { btn.innerText = textoOriginal; btn.style.background = ""; btn.style.color = ""; btn.style.borderColor = ""; }, 3000);
            return;
        }

        const urlCompleta = urlBase + "?nome=" + encodeURIComponent(nomeRevendedor);

        window.SGI.api.fetchData(urlCompleta, { method: "GET" }, function(response) {
            btn.disabled = false;
            
            if (!response || !response.success) {
                console.error("Erro na consulta de retirada:", response);
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
    },

    abrirWhatsApp: function() {
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
    },

    vdEnviar: function() {
        const select = document.getElementById("vd-select");
        const usuario = select ? select.value : "";
        
        if (!usuario) {
            const configBox = document.getElementById("vd-config-box");
            if (configBox) configBox.style.display = "flex";
            window.SGI.helpers.vdStatus("⚠️ Selecione um usuário acima!", "#ef4444"); 
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
        if (!btn) return;
        
        const textoOriginal = btn.innerHTML;
        btn.innerText = "Enviando..."; 
        btn.disabled = true;

        const urlRecicla = window.SGI.helpers.getUrlRecicla();
        if (!urlRecicla) {
            btn.innerText = "URL não configurada!";
            btn.disabled = false;
            setTimeout(() => { btn.innerHTML = textoOriginal; }, 3000);
            return;
        }

        window.SGI.api.fetchData(urlRecicla, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain"
            },
            body: JSON.stringify(dados)
        }, function(response) {
            btn.disabled = false;
            
            if (!response || !response.success) {
                console.error("Erro ao enviar Recicla:", response);
                btn.innerHTML = textoOriginal;
                alert("❌ Erro ao enviar para a planilha!");
                return;
            }

            btn.innerText = "LANÇADO!"; 
            btn.classList.add("enviado");
            const configBox = document.getElementById("vd-config-box");
            if (configBox) configBox.style.display = "none";
            setTimeout(() => { 
                btn.innerHTML = textoOriginal; 
                btn.classList.remove("enviado"); 
            }, 2500);
        });
    }
};
