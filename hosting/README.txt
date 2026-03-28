Hosting Plesk (come le altre app sullo stesso server)
====================================================

Node.js
   Usa la versione selezionata in Plesk per il dominio (es. 20.x), oppure il Node di
   sistema per build da SSH. Non è più presente .node-version nel repo: se usi
   nodenv sul server e vedi "version `20' is not installed", esegui
     nodenv install 20
   oppure disattiva nodenv per la sessione e usa il binario Plesk, es.:
     /opt/plesk/node/20/bin/node -v
     export PATH="/opt/plesk/node/20/bin:$PATH"

0) Porte (come sugli altri server)
   Leggi hosting/PORTS.txt: la porta HTTP di Node (PORT) deve coincidere tra
   Plesk, proxy nginx/Apache e curl su 127.0.0.1. MySQL usa MYSQL_PORT (es. 3301).

1) Utente e gruppo del dominio (già noti)
   - Utente: handyman.abreve.it_abvedfshaqi
   - Gruppo: psaserv

2) Una tantum da root (permessi coerenti con le altre app)
   chown -R handyman.abreve.it_abvedfshaqi:psaserv /var/www/vhosts/handyman.abreve.it/httpdocs
   Oppure con site.env presente:
     sudo sh hosting/fix-permissions.sh

   EACCES su npm (es. oxide-linux-x64-gnu): node_modules creato da root o altro utente.
   Da root:
     sudo sh hosting/fix-permissions.sh
   Poi come utente del sito (MAI npm ci da root nella cartella del sito):
     cd .../httpdocs && rm -rf node_modules && npm ci
   Usa il Node di Plesk se serve:
     export PATH="/opt/plesk/node/25/bin:$PATH"
     (adatta la versione alla cartella che hai in /opt/plesk/node/)

3) Config locale sul server (stesso schema dell'app di riferimento sul Plesk)
   - cp hosting/site.env.example hosting/site.env
   - cp hosting/env.production.sample .env.production
   - In .env.production imposta DATABASE_URL (mysql://user:pass@host:porta/db) come
     per contenthunter, oppure le variabili MYSQL_* se preferite il formato separato.
   - In Plesk → Node.js le stesse variabili (DATABASE_URL o MYSQL_* + NODE_ENV).

4) Deploy (sempre come utente del sito, non root)
   Da root:
     sh scripts/run-deploy-as-site-user.sh --pull
   Oppure:
     su - handyman.abreve.it_abvedfshaqi -s /bin/bash
     cd /var/www/vhosts/handyman.abreve.it/httpdocs
     sh deploy.sh --pull

5) Plesk
   - Node.js: Application startup file = app.js
   - Dopo ogni deploy: Riavvia app

6) Variabili in Plesk
   Allineate a contenthunter: NODE_ENV=production, DATABASE_URL (o MYSQL_*), eventuale PORT.
   .env.production sul server deve contenere gli stessi valori usati da deploy per
   l'allineamento DB (stesso DB dell'app).

7) Allineamento DB nel deploy (deploy.sh)
   Dopo npm ci esegue: npm run db:align
     - db:check → verifica che DATABASE_URL o MYSQL_* siano presenti
     - db:migrate → applica i file .sql in db/migrations/ (tabelle / schema)
   Per saltare: sh deploy.sh --skip-migrate
   Solo migrazioni SQL: npm run db:migrate
