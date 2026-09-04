#!/usr/bin/env bash
# Sword — instalador das ferramentas de recon (macOS)
# Rode UMA vez no terminal nativo do Mac:  bash setup.sh
# Depois, recon.py / "code 0" usam todas automaticamente.
set -uo pipefail

echo "== Sword setup =="

# 1) Homebrew
if ! command -v brew >/dev/null 2>&1; then
  echo "[!] Homebrew não encontrado. Instale em https://brew.sh e rode de novo."
  exit 1
fi

# 2) Go (necessário pro go install)
if ! command -v go >/dev/null 2>&1; then
  echo "[*] instalando Go..."; brew install go
fi

# 3) PATH do go/bin
GOBIN="$(go env GOPATH 2>/dev/null)/bin"
export PATH="$PATH:$GOBIN"
case ":$PATH:" in *":$GOBIN:"*) : ;; *) : ;; esac

# 4) ProjectDiscovery + tomnomnom/lc suite
echo "[*] instalando ferramentas Go (pode demorar)..."
go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest
go install -v github.com/projectdiscovery/katana/cmd/katana@latest
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
go install -v github.com/projectdiscovery/dnsx/cmd/dnsx@latest
go install -v github.com/lc/gau/v2/cmd/gau@latest
go install -v github.com/tomnomnom/waybackurls@latest
go install -v github.com/owasp-amass/amass/v4/...@master
go install -v github.com/jaeles-project/gospider@latest
go install -v github.com/tomnomnom/gf@latest

# 5) ffuf (content discovery)
command -v ffuf >/dev/null 2>&1 || brew install ffuf

# 5b) gf patterns (padrões p/ garimpar URLs interessantes: xss, ssrf, idor, redirect, ssti, sqli...)
if [ ! -d "$HOME/.gf" ]; then
  git clone -q https://github.com/1ndianl33t/Gf-Patterns "$HOME/.gf" 2>/dev/null \
    || git clone -q https://github.com/tomnomnom/gf "$HOME/.gf-src" 2>/dev/null && cp "$HOME/.gf-src"/examples/*.json "$HOME/.gf/" 2>/dev/null
  echo "[*] gf patterns em ~/.gf"
fi

# 6) templates do nuclei
command -v nuclei >/dev/null 2>&1 && nuclei -update-templates -silent 2>/dev/null || true

# 7) dependência Python
python3 -m pip install --quiet --user requests 2>/dev/null || pip3 install --quiet requests 2>/dev/null || true

# 8) garantir go/bin no PATH do shell (zsh)
if ! grep -qs 'go env GOPATH' "$HOME/.zshrc" 2>/dev/null; then
  echo 'export PATH="$PATH:$(go env GOPATH)/bin"' >> "$HOME/.zshrc"
  echo "[*] adicionado go/bin ao ~/.zshrc (abra um novo terminal ou: source ~/.zshrc)"
fi

echo ""
echo "== Verificação =="
for t in subfinder httpx katana nuclei dnsx gau waybackurls amass gospider gf ffuf; do
  if command -v "$t" >/dev/null 2>&1; then printf "  \033[32mOK\033[0m   %s\n" "$t"; else printf "  \033[31mFALTA\033[0m %s\n" "$t"; fi
done
echo ""
echo "Pronto. Teste:  python3 tools/recon.py exemplo.com --all --out /tmp/teste"
