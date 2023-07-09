build: staticcheck
	go build -o gh-pages-updater cmd/main.go

run: staticcheck build
	./gh-pages-updater

staticcheck:
	staticcheck ./...
