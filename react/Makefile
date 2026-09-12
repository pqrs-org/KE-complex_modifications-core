dev:
	make -C .. update-dist
	pnpm run dev

build:
	rm -fr dist
	pnpm run build

check:
	pnpm run format:check
	pnpm run lint
	pnpm run test
	@check_dist="$$(mktemp -d)"; \
	trap 'rm -rf "$$check_dist"' EXIT; \
	pnpm run build --outDir "$$check_dist" --emptyOutDir

install:
	pnpm install --frozen-lockfile

update:
	pnpm update

audit:
	pnpm audit

format:
	pnpm run format

lint:
	pnpm run lint

.PHONY: icons
icons: public/static/logo1024.png
	@command -v magick >/dev/null || { \
	  echo "ImageMagick is required. Run: brew install imagemagick"; \
	  exit 1; \
	}
	@command -v pngquant >/dev/null || { \
	  echo "pngquant is required. Run: brew install pngquant"; \
	  exit 1; \
	}
	magick $< -filter Lanczos -resize 512x512 public/static/logo512.png
	magick $< -filter Lanczos -resize 192x192 public/static/logo192.png
	magick $< -filter Lanczos -resize 32x32 public/static/favicon.png
	# pngquant exits with 98 when --skip-if-larger skips the output.
	@for f in public/static/logo512.png public/static/logo192.png public/static/favicon.png; do \
	  pngquant --skip-if-larger "$$f" --ext .png --force || { \
	    result=$$?; \
	    [ "$$result" -eq 98 ] || exit "$$result"; \
	  }; \
	done
