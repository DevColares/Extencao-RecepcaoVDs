window.SGI = window.SGI || {};

window.SGI.helpers = {
    vdStatus: function(msg, cor = "#27ae60") {
        const el = document.getElementById("vd-status");
        if (!el) return;
        el.style.color = cor;
        el.innerText = msg;
        setTimeout(() => el.innerText = "", 3000);
    },
    aplicarEscala: function(valor) {
        const painel = document.getElementById("painelVD");
        if (painel) {
            painel.style.transform = `scale(${valor})`;
        }
    },
    getUrlRecicla: function() {
        const url = window.SGI.state.configUrlRecicla || "";
        if (!url) {
            window.SGI.helpers.vdStatus("⚠️ URL do Recicla não configurada! Acesse o popup da extensão.", "#ef4444");
        }
        return url;
    },
    getUrlRetirada: function() {
        const url = window.SGI.state.configUrlRetirada || "";
        if (!url) {
            window.SGI.helpers.vdStatus("⚠️ URL de Retirada não configurada! Acesse o popup da extensão.", "#ef4444");
        }
        return url;
    },
    getUrlCombos: function() {
        const url = window.SGI.state.configUrlCombos || "";
        if (!url) {
            window.SGI.helpers.vdStatus("⚠️ URL de Combos não configurada! Acesse o popup da extensão.", "#ef4444");
        }
        return url;
    },
    getSGINome: function() {
        const seletores = [
            "input[id*='nomeEntradaTexto_Tb1']", 
            "input[name*='nomeEntradaTexto$Tb1']", 
            ".client-name", 
            ".name",
            "[id*='lblNomeRevendedor']", 
            ".nome-revendedor",
            ".text-left.menu-info"
        ];
        
        for (let s of seletores) {
            const el = document.querySelector(s);
            if (el) {
                let val = (el.tagName === "INPUT" ? el.value : el.innerText).trim();
                // Se o valor não for apenas números e tiver pelo menos 3 caracteres, assumimos que é o nome
                if (val && isNaN(val.replace(/\s/g, "")) && val.length > 2) {
                    return val;
                }
            }
        }
        return "";
    },
    getSGICodigo: function() {
        const el = document.querySelector("input[id*='codigoEntradaNumero_Tb1'], input[name*='codigoEntradaNumero$Tb1'], [id*='lblCodigoRevendedor'], .codigo-revendedor");
        if (!el) return "";
        return (el.tagName === "INPUT" ? el.value : el.innerText).trim();
    }
};
