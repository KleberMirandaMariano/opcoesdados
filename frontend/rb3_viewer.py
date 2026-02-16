import streamlit as st
import subprocess
import pandas as pd
import io
import os
import sys

# Page config
st.set_page_config(page_title="RB3 Options Viewer", page_icon="📊", layout="wide")

# Custom CSS for premium look
st.markdown("""
<style>
    .reportview-container {
        background: #030712;
    }
    .main {
        background: #030712;
        color: white;
    }
    .stTable {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }
    h1, h2, h3 {
        color: #2dd4bf;
    }
</style>
""", unsafe_allow_html=True)

st.title("📊 RB3 Options Data Viewer")
st.markdown("Visualize os dados de opções buscados diretamente da B3 via R (pacote rb3).")

# Paths
R_SCRIPT_PATH = os.path.join("scripts", "rb3_options_fetcher.R")

def run_r_script():
    try:
        # Tenta rodar o Rscript. Se não estiver no path, tentaremos caminhos comuns do Windows.
        cmd = ["Rscript", R_SCRIPT_PATH]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout, None
    except subprocess.CalledProcessError as e:
        return e.stdout, e.stderr
    except FileNotFoundError:
        # Se Rscript não foi encontrado, tenta procurar em locais comuns
        common_paths = [
            r"C:\Program Files\R\R-4.3.2\bin\x64\Rscript.exe",
            r"C:\Program Files\R\R-4.3.1\bin\x64\Rscript.exe",
            r"C:\Program Files\R\R-4.2.0\bin\x64\Rscript.exe",
        ]
        for path in common_paths:
            if os.path.exists(path):
                try:
                    result = subprocess.run([path, R_SCRIPT_PATH], capture_output=True, text=True, check=True)
                    return result.stdout, None
                except Exception as ex:
                    return None, str(ex)
        
        return None, "Rscript não encontrado no PATH. Por favor, instale o R ou adicione-o às variáveis de ambiente."

if st.button("🚀 Buscar Dados Atualizados (Executar R)"):
    with st.spinner("Executando script R e processando dados da B3..."):
        stdout, stderr = run_r_script()
        
        if stderr:
             st.error("Erro durante a execução do script R:")
             st.code(stderr)
        
        if stdout:
            st.success("Dados recuperados com sucesso!")
            st.markdown("### Output do Console R:")
            st.code(stdout)
            
            # Tentar extrair tabela se o output for formatado
            # (Simplificado por agora, mostrando o log completo)
            if "PETR4" in stdout:
                st.info("Detectados dados de PETR4 no output.")

st.sidebar.header("Configurações")
st.sidebar.info("Este viewer executa o script R localmente para buscar o 'superset' de opções da B3.")
st.sidebar.markdown(f"**Script Path:** `{R_SCRIPT_PATH}`")

if not os.path.exists(R_SCRIPT_PATH):
    st.error(f"Arquivo não encontrado: {R_SCRIPT_PATH}")
