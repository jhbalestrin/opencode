REPO_ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
CONFIG_SRC := $(REPO_ROOT)config
CONFIG_DEST := $(HOME)/.config/opencode

SKIP_PATTERNS := -name node_modules -o -name '*.swp' -o -name '*.bak'

.PHONY: help check-ownership bootstrap link install-plugins sync status unlink clean-stale

help:
	@echo "OpenCode dotfiles — manage ~/.config/opencode via symlinks"
	@echo ""
	@echo "  make bootstrap       Import live config into config/ (one-time)"
	@echo "  make sync            Link config/ → ~/.config/opencode + npm ci"
	@echo "  make link            Recreate symlinks only"
	@echo "  make status          Show symlink health"
	@echo "  make unlink          Remove symlinks pointing into this repo"
	@echo "  make clean-stale     Remove orphan symlinks (source deleted from repo)"
	@echo "  make install-plugins npm ci in ~/.config/opencode"
	@echo "  make check-ownership Verify config dir is writable"

check-ownership:
	@test -w "$(CONFIG_DEST)" || ( \
		echo "error: $(CONFIG_DEST) is not writable by $$(whoami)"; \
		echo "  run: sudo chown -R $$(whoami):$$(whoami) $(CONFIG_DEST)"; \
		exit 1 \
	)

bootstrap:
	@mkdir -p "$(CONFIG_SRC)/agents" "$(CONFIG_SRC)/commands" \
		"$(CONFIG_SRC)/plugins" "$(CONFIG_SRC)/skills" \
		"$(CONFIG_SRC)/themes" "$(CONFIG_SRC)/modes"
	@if [ -f "$(CONFIG_SRC)/opencode.jsonc" ]; then \
		echo "config/opencode.jsonc already exists — skipping bootstrap"; \
	else \
		if [ -f "$(CONFIG_DEST)/opencode.json" ]; then \
			cp "$(CONFIG_DEST)/opencode.json" "$(CONFIG_SRC)/opencode.jsonc"; \
			echo "bootstrapped opencode.jsonc from live opencode.json"; \
		elif [ -f "$(CONFIG_DEST)/opencode.jsonc" ]; then \
			cp "$(CONFIG_DEST)/opencode.jsonc" "$(CONFIG_SRC)/opencode.jsonc"; \
			echo "bootstrapped opencode.jsonc from live config"; \
		else \
			echo '{"$$schema": "https://opencode.ai/config.json"}' > "$(CONFIG_SRC)/opencode.jsonc"; \
			echo "created empty opencode.jsonc"; \
		fi; \
	fi
	@for f in package.json package-lock.json; do \
		if [ -f "$(CONFIG_DEST)/$$f" ] && [ ! -f "$(CONFIG_SRC)/$$f" ]; then \
			cp "$(CONFIG_DEST)/$$f" "$(CONFIG_SRC)/$$f"; \
			echo "bootstrapped $$f"; \
		fi; \
	done
	@for d in agents commands plugins skills themes modes; do \
		touch "$(CONFIG_SRC)/$$d/.gitkeep"; \
	done
	@echo "bootstrap complete — run 'make sync' to link"

link: check-ownership
	@mkdir -p "$(CONFIG_DEST)"
	@find "$(CONFIG_SRC)" \( $(SKIP_PATTERNS) \) -prune -o -type f -print | while read -r src; do \
		rel="$${src#$(CONFIG_SRC)/}"; \
		dest="$(CONFIG_DEST)/$$rel"; \
		mkdir -p "$$(dirname "$$dest")"; \
		if [ -e "$$dest" ] && [ ! -L "$$dest" ]; then \
			mv "$$dest" "$$dest.bak.$$(date +%s)"; \
			echo "backed up $$dest"; \
		fi; \
		ln -sfn "$$(realpath "$$src")" "$$dest"; \
		echo "linked $$rel"; \
	done

install-plugins: check-ownership link
	@if [ -f "$(CONFIG_DEST)/package.json" ]; then \
		cd "$(CONFIG_DEST)" && npm ci; \
	else \
		echo "no package.json — skipping npm ci"; \
	fi

sync: link install-plugins
	@rm -f "$(CONFIG_DEST)/.opencode.json.swp" "$(CONFIG_DEST)/opencode.json.bak" 2>/dev/null || true
	@if [ -f "$(CONFIG_DEST)/opencode.json" ] && [ ! -L "$(CONFIG_DEST)/opencode.json" ]; then \
		rm -f "$(CONFIG_DEST)/opencode.json"; \
		echo "removed legacy opencode.json (replaced by opencode.jsonc)"; \
	fi
	@echo "sync complete"

status:
	@echo "=== repo → live symlinks ==="
	@ok=0; missing=0; broken=0; \
	find "$(CONFIG_SRC)" \( $(SKIP_PATTERNS) \) -prune -o -type f -print | while read -r src; do \
		rel="$${src#$(CONFIG_SRC)/}"; \
		dest="$(CONFIG_DEST)/$$rel"; \
		if [ -L "$$dest" ]; then \
			target="$$(readlink -f "$$dest" 2>/dev/null || echo broken)"; \
			if [ "$$target" = "$$(realpath "$$src")" ]; then \
				echo "  OK      $$rel"; \
			else \
				echo "  DRIFT    $$rel → $$target"; \
			fi; \
		elif [ -e "$$dest" ]; then \
			echo "  BLOCKED  $$rel (real file, not symlink)"; \
		else \
			echo "  MISSING  $$rel"; \
		fi; \
	done
	@echo ""
	@echo "=== orphan symlinks in $(CONFIG_DEST) ==="
	@find "$(CONFIG_DEST)" -maxdepth 3 -type l 2>/dev/null | while read -r link; do \
		target="$$(readlink -f "$$link" 2>/dev/null)"; \
		case "$$target" in \
			$(CONFIG_SRC)*) \
				rel="$${link#$(CONFIG_DEST)/}"; \
				src="$(CONFIG_SRC)/$$rel"; \
				if [ ! -e "$$src" ]; then \
					echo "  STALE   $$rel"; \
				fi ;; \
		esac; \
	done || true

unlink:
	@find "$(CONFIG_DEST)" -maxdepth 3 -type l 2>/dev/null | while read -r link; do \
		target="$$(readlink -f "$$link" 2>/dev/null)"; \
		case "$$target" in \
			$(CONFIG_SRC)*) \
				rm "$$link"; \
				echo "removed $$link" ;; \
		esac; \
	done || true
	@echo "unlink complete"

clean-stale:
	@find "$(CONFIG_DEST)" -maxdepth 3 -type l 2>/dev/null | while read -r link; do \
		target="$$(readlink -f "$$link" 2>/dev/null)"; \
		case "$$target" in \
			$(CONFIG_SRC)*) \
				if [ ! -e "$$target" ]; then \
					rm "$$link"; \
					echo "removed stale $$link"; \
				fi ;; \
		esac; \
	done || true
	@echo "clean-stale complete"
