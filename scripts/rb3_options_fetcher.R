# Script para buscar dados de opções da B3 usando o pacote rb3
# Desenvolvido para ser chamado via Python (subprocess)

# 1. Carregamento silencioso de dependências
suppressPackageStartupMessages({
  library(rb3)
  library(dplyr)
  library(readr)
})

# 2. Obter argumentos da linha de comando
args <- commandArgs(trailingOnly = TRUE)
symbol_arg <- if (length(args) > 0) args[1] else "PETR4"

# 3. Buscar dados
# Usamos cotahist_equity_options_superset para ter os dados mais completos
tryCatch({
  df <- rb3::cotahist_equity_options_superset()
  
  if (!is.null(df)) {
    # Filtro pelo ativo objeto
    df_filtered <- df %>%
      filter(symbol_underlying == symbol_arg) %>%
      select(symbol, strike, maturity_date, type, price_close, volume) %>%
      arrange(desc(volume))
    
    # Exporta para CSV no stdout para o Python ler
    write_csv(df_filtered, stdout())
  } else {
    stop("Dados não retornados pelo RB3")
  }
}, error = function(e) {
  # Em caso de erro, não imprime nada ou imprime erro no stderr
  cat(paste("Erro:", e$message), file = stderr())
  quit(status = 1)
})
