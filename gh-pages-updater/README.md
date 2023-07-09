# gh-pages-updater

Updater for <https://github.com/pqrs-org/gh-pages-ke-complex-modifications.pqrs.org>.

| Source Reposotiry             | Source Path  | Destination Path |
| ----------------------------- | ------------ | ---------------- |
| KE-complex_modifications-core | react/dist   | docs             |
| KE-complex_modifications      | public/build | docs/build       |
| KE-complex_modifications      | public/json  | docs/json        |

## Run

```shell
make run
```

## Trigger

```shell
curl -X POST -H "Content-Type: application/json" -d '{"secret":"example-6i9-e89-532b-546-4f3-42ejf-hhr6b"}' http://localhost:28080/update-gh-pages
```
