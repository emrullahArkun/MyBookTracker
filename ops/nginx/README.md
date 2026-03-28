Create the beta access file here before starting the production stack:

```bash
htpasswd -cB ops/nginx/.htpasswd yourtester
```

Keep `ops/nginx/.htpasswd` out of git. It is ignored by the repository.
