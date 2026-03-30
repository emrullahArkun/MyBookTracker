# MyBookTracker Server Setup

## Ziel

Diese Datei dokumentiert das aktuelle Setup von `MyBookTracker` auf dem Hetzner-Server.

Aktueller Zweck:

- einfacher Einzelserver-Start
- Zugriff zuerst per Server-IP
- Docker Compose Deployment
- Images kommen aus GHCR
- Datenbank laeuft lokal als Postgres-Container

## Aktueller Server

- Anbieter: `Hetzner Cloud`
- Servertyp: kleiner VPS fuer den Einstieg
- Betriebssystem: `Ubuntu 24.04`
- Zugriff: per `SSH`
- Oeffentliche Erreichbarkeit: ueber `IPv4`

## Verzeichnis auf dem Server

Deployment-Verzeichnis:

```bash
/opt/mybooktracker
```

Dort liegen aktuell:

- `.env`
- `docker-compose.prod.yml`

## Verwendete Services

Der Stack besteht aus drei Containern:

- `frontend`
- `app`
- `db`

Dabei gilt:

- `frontend` liefert die SPA aus und leitet `/api` an das Backend weiter
- `app` ist das Spring-Boot-Backend
- `db` ist PostgreSQL

## Voraussetzungen auf dem Server

Installiert wurden:

- Docker Engine
- Docker Compose Plugin

Pruefen mit:

```bash
docker --version
docker compose version
```

## Wichtige Dateien

### `.env`

Pfad:

```bash
/opt/mybooktracker/.env
```

Beispielstruktur:

```env
DB_USERNAME=postgres
DB_PASSWORD=...
APP_JWT_SECRET=...
APP_JWT_COOKIE_SECURE=false
APP_CORS_ORIGINS=http://SERVER_IP
BACKEND_IMAGE=ghcr.io/emrullaharkun/mybooktracker-backend:latest
FRONTEND_IMAGE=ghcr.io/emrullaharkun/mybooktracker-frontend:latest
```

Hinweis:

- `APP_JWT_COOKIE_SECURE=false` ist aktuell nur fuer den HTTP-Testbetrieb gesetzt
- sobald eine Domain mit HTTPS eingerichtet ist, sollte das wieder auf `true`

### `docker-compose.prod.yml`

Pfad:

```bash
/opt/mybooktracker/docker-compose.prod.yml
```

## GHCR

Die Images werden nicht auf dem Server gebaut.

Stattdessen:

1. `main` in GitHub ist der Release-Branch
2. GitHub Actions baut die Docker-Images
3. die Images werden in `GHCR` gespeichert
4. der Server zieht nur die fertigen Images

Das spart Ressourcen auf dem VPS.

## GHCR Login auf dem Server

Falls noetig erneut anmelden:

```bash
docker login ghcr.io -u emrullahArkun
```

Dann den GitHub Personal Access Token als Passwort verwenden.

## Deployment-Ablauf

### Erstes Deployment

1. auf `main` mergen
2. warten bis GitHub Actions die Images gebaut hat
3. auf den Server einloggen
4. nach `/opt/mybooktracker` wechseln
5. Images ziehen
6. Container starten

Befehle:

```bash
cd /opt/mybooktracker
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

### Update nach spaeteren Aenderungen

Wenn `main` neue Images gebaut hat:

```bash
cd /opt/mybooktracker
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

## Logs und Status

Containerstatus:

```bash
docker compose -f docker-compose.prod.yml ps
```

Logs:

```bash
docker compose -f docker-compose.prod.yml logs --tail=100
```

Nur Backend-Logs:

```bash
docker compose -f docker-compose.prod.yml logs --tail=100 app
```

Nur Frontend-Logs:

```bash
docker compose -f docker-compose.prod.yml logs --tail=100 frontend
```

Nur Datenbank-Logs:

```bash
docker compose -f docker-compose.prod.yml logs --tail=100 db
```

## Funktionstest

Frontend testen:

```bash
curl http://SERVER_IP
```

Wenn HTML kommt, antwortet das Frontend.

## Firewall

Fuer das aktuelle Setup relevant:

- `22/tcp`
- `80/tcp`
- `443/tcp`

## Bekannte Besonderheit

Aktuell laeuft die App direkt ueber `http://SERVER_IP`.

Dadurch gilt:

- Browser warnen bei Passwortfeldern auf HTTP
- `Secure`-Cookies funktionieren nicht
- deshalb ist fuer den Testbetrieb `APP_JWT_COOKIE_SECURE=false` noetig

Das ist eine Uebergangsloesung.

## Naechste sinnvolle Schritte

1. Domain kaufen und DNS setzen
2. HTTPS einrichten
3. `APP_JWT_COOKIE_SECURE=true` setzen
4. Container neu starten
5. spaeter Backups aktivieren

## Nützliche Befehle

Auf den Server verbinden:

```bash
ssh root@SERVER_IP
```

In das Projektverzeichnis wechseln:

```bash
cd /opt/mybooktracker
```

Dateien anzeigen:

```bash
ls -la
```

`.env` pruefen:

```bash
cat .env
```

Compose-Datei pruefen:

```bash
cat docker-compose.prod.yml
```
