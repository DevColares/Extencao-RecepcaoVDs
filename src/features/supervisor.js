window.SGI = window.SGI || {};

window.SGI.supervisor = {
    renderMapeamentos: function() {
        const st = window.SGI.state;
        const lista = document.getElementById("vd-lista-mapeamentos");
        if (!lista) return;
        lista.innerHTML = "";

        if (Object.keys(st.configSupervisores).length === 0) {
            lista.innerHTML = "<div style='color:#777; text-align:center; padding: 10px;'>Nenhum mapeamento salvo.</div>";
            return;
        }

        for (let chave in st.configSupervisores) {
            const item = document.createElement("div");
            item.className = "vd-item-lista";
            item.innerHTML = `
                <div style="flex:1;"><b>${chave}</b><br><span style="color:#c5a059">${st.configSupervisores[chave]}</span></div>
                <button class="vd-btn-del" data-chave="${chave}" title="Excluir">❌</button>
            `;
            lista.appendChild(item);
        }

        document.querySelectorAll("#vd-lista-mapeamentos .vd-btn-del").forEach(btn => {
            btn.addEventListener("click", function() {
                const chave = this.getAttribute("data-chave");
                window.SGI.supervisor.deletarMapeamento(chave);
            });
        });
    },

    deletarMapeamento: function(chave) {
        const st = window.SGI.state;
        delete st.configSupervisores[chave];
        window.SGI.api.salvarStorage("vd_supervisores", st.configSupervisores, () => {
            window.SGI.supervisor.renderMapeamentos();
            window.SGI.supervisor.verificarSupervisor();
            window.SGI.helpers.vdStatus("Mapeamento removido!", "#ef4444");
        });
    },

    vdSalvarSupervisor: function() {
        const estInput = document.getElementById("vd-est-nome");
        const supInput = document.getElementById("vd-sup-nome");
        const est = estInput ? estInput.value.trim().toUpperCase() : "";
        const sup = supInput ? supInput.value.trim().toUpperCase() : "";

        if (!est || !sup) { 
            window.SGI.helpers.vdStatus("⚠️ Preencha estrutura e supervisor!", "#ef4444"); 
            return; 
        }

        const st = window.SGI.state;
        st.configSupervisores[est] = sup;
        window.SGI.api.salvarStorage("vd_supervisores", st.configSupervisores, () => {
            if (estInput) estInput.value = "";
            if (supInput) supInput.value = "";
            window.SGI.helpers.vdStatus("Mapeamento Salvo!", "#27ae60");

            window.SGI.supervisor.renderMapeamentos();
            window.SGI.supervisor.verificarSupervisor();
        });
    },

    verificarSupervisor: function() {
        const st = window.SGI.state;
        if (st.configModoPrincipal !== "recepcao" || !st.configSupervisorAtivo) {
            const displayBox = document.getElementById("vd-sup-display");
            if (displayBox) displayBox.style.display = "none";
            return;
        }

        const estInput = document.getElementsByName("ctl00$ContentPlaceHolder1$descEstruturaComercialAtual$Tb1")[0]
                      || document.getElementById("ContentPlaceHolder1_descEstruturaComercialAtual_Tb1")
                      || document.querySelector("input[name$='descEstruturaComercialAtual$Tb1']")
                      || document.querySelector("input[id$='descEstruturaComercialAtual_Tb1']");
        const estruturaAtual = estInput ? estInput.value.trim().toUpperCase() : "";
        
        const displayBox = document.getElementById("vd-sup-display");
        const displayText = document.getElementById("vd-sup-nome-text");
        if (!displayBox || !displayText) return;

        if (!estruturaAtual) {
            displayBox.style.display = "none";
            return;
        }

        let supervisorEncontrado = "Não Mapeado";
        const palavras = estruturaAtual.split(/[\\s\\-]+/).filter(p => p.length > 0);
        const ultimoNomeEstrutura = palavras.length > 0 ? palavras[palavras.length - 1] : "";

        for (let chave in st.configSupervisores) {
            const chaveUpper = chave.toUpperCase();
            if (ultimoNomeEstrutura === chaveUpper || estruturaAtual.includes(chaveUpper)) {
                supervisorEncontrado = st.configSupervisores[chave];
                break;
            }
        }

        displayText.innerText = supervisorEncontrado;
        displayBox.style.display = "block";
        displayText.style.color = (supervisorEncontrado === "Não Mapeado") ? "#ef4444" : "#0a3d28";

        if (supervisorEncontrado !== "Não Mapeado" && !st.notificacaoEnviada) {
            st.notificacaoEnviada = true;
            window.SGI.ui.dispararToastWindows(supervisorEncontrado);
        }
    }
};
