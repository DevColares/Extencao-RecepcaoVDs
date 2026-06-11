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
    }
};
