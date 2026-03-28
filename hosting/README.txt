Hosting Plesk (come le altre app sullo stesso server)
====================================================

0) Porte (come sugli altri server)
   Leggi hosting/PORTS.txt: la porta HTTP di Node (PORT) deve coincidere tra
   Plesk, proxy nginx/Apache e curl su 127.0.0.1. MySQL usa MYSQL_PORT (es. 3301).

1) Utente e gruppo del dominio (già noti)
   - Utente: handyman.abreve.it_abvedfshaqi
   - Gruppo: psaserv

2) Una tantum da root (permessi coerenti con le altre app)
   chown -R handyman.abreve.it_abvedfshaqi:psaserv /var/www/vhosts/handyman.abreve.it/httpdocs

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
   .env.production sul server deve contenere gli stessi valori usati da deploy.sh per
   npm run db:migrate (stesso DB).
