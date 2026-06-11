window.SGI = window.SGI || {};

window.SGI.api = {
    fetchData: function(url, options, callback) {
        chrome.runtime.sendMessage({
            action: "fetch",
            url: url,
            options: options
        }, function(response) {
            if (callback) callback(response);
        });
    },
    
    carregarConfiguracoesIniciais: function(callback) {
        chrome.storage.local.get([
            "vd_escala",
            "vd_supervisores",
            "vd_usuarios",
            "vd_url_recicla",
            "vd_url_retirada",
            "vd_url_combos",
            "vd_modo_principal",
            "vd_usuarios_caixa",
            "vd_cupom_caixa",
            "vd_cfg_supervisor_ativo",
            "vd_cfg_retirada_ativo",
            "vd_cfg_recicla_ativo",
            "vd_cfg_alocacao_ativo",
            "vd_cfg_combos_ativo"
        ], (data) => {
            const st = window.SGI.state;
            st.configScale = data.vd_escala || "1";
            st.configSupervisores = data.vd_supervisores || {};
            st.configUsuarios = data.vd_usuarios || [];
            st.configUrlRecicla = data.vd_url_recicla || "";
            st.configUrlRetirada = data.vd_url_retirada || "";
            st.configUrlCombos = data.vd_url_combos || "";
            st.configUsuariosCaixa = data.vd_usuarios_caixa || [];
            st.configCupomCaixa = data.vd_cupom_caixa || "";
            st.configModoPrincipal = data.vd_modo_principal || "recepcao";
            
            st.configSupervisorAtivo = data.vd_cfg_supervisor_ativo !== false;
            st.configRetiradaAtivo = data.vd_cfg_retirada_ativo !== false;
            st.configReciclaAtivo = data.vd_cfg_recicla_ativo !== false;
            st.configAlocacaoAtivo = data.vd_cfg_alocacao_ativo !== false;
            st.configCombosAtivo = data.vd_cfg_combos_ativo !== false;
            
            if (callback) callback();
        });
    },
    
    salvarStorage: function(chave, valor, callback) {
        chrome.storage.local.set({ [chave]: valor }, () => {
            if (callback) callback();
        });
    }
};
