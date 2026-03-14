# 📘 Documentation Dashboard V2 - Déploiement Dev/Prod

**Date de création :** 14 Mars 2026  
**Version :** 2.0  
**Dépôt GitHub :** https://github.com/bertrandlt/horus-dashboard-v2

---

## 🏗️ Architecture Dev/Prod

Le Dashboard V2 utilise une séparation stricte entre environnement de développement et production :

| Environnement | Branche Git | Port | URL | Description |
|---------------|-------------|------|-----|-------------|
| **Production** | `main` | 8082 | http://localhost:8082 | Version stable pour les utilisateurs |
| **Développement** | `develop` | 8083 | http://localhost:8083 | Tests et nouvelles fonctionnalités |

---

## 📦 Structure des branchements Git

```
main (prod) ← develop (dev) ← feature/* (nouvelles fonctionnalités)
```

### Workflow recommandé

1. **Créer une branche feature** depuis `develop` :
   ```bash
   git checkout develop
   git checkout -b feature/nouvelle-fonctionnalite
   ```

2. **Développer et tester** sur l'environnement dev (port 8083)

3. **Push et Pull Request** vers `develop` :
   ```bash
   git push origin feature/nouvelle-fonctionnalite
   # Créer une PR sur GitHub : feature/* → develop
   ```

4. **Après review et tests**, merger dans `develop`

5. **Pour la production**, créer une PR de `develop` → `main`

---

## 🚀 Scripts de déploiement

### Deployment Production (Port 8082)

```bash
cd /home/ubuntu/.openclaw/workspace/dashboard-v2
./deploy-prod.sh
```

**Ce que fait le script :**
- ✅ Bascule sur la branche `main`
- ✅ Récupère les dernières modifications
- ✅ Installe les dépendances production uniquement
- ✅ Copie `.env.production`
- ✅ Redémarre l'instance PM2 `horus-dashboard-prod`

### Deployment Développement (Port 8083)

```bash
cd /home/ubuntu/.openclaw/workspace/dashboard-v2
./deploy-dev.sh
```

**Ce que fait le script :**
- ✅ Bascule sur la branche `develop`
- ✅ Récupère les dernières modifications
- ✅ Installe toutes les dépendances (y compris devDependencies)
- ✅ Copie `.env.development`
- ✅ Redémarre l'instance PM2 `horus-dashboard-dev`

---

## ⚙️ Configuration PM2

Le fichier `ecosystem.config.cjs` définit deux instances séparées :

### Instance Production (`horus-dashboard-prod`)
- **Port :** 8082
- **Mode :** Production (optimisé)
- **Watch :** Désactivé (plus stable)
- **Logs :** `logs/pm2-prod-*.log`

### Instance Développement (`horus-dashboard-dev`)
- **Port :** 8083
- **Mode :** Développement
- **Watch :** Activé (rechargement auto)
- **Logs :** `logs/pm2-dev-*.log`

### Commandes PM2 utiles

```bash
# Voir toutes les instances
pm2 list

# Logs en temps réel
pm2 logs horus-dashboard-prod
pm2 logs horus-dashboard-dev

# Redémarrer une instance
pm2 restart horus-dashboard-prod
pm2 restart horus-dashboard-dev

# Arrêter une instance
pm2 stop horus-dashboard-dev

# Supprimer une instance
pm2 delete horus-dashboard-dev

# Sauvegarder la configuration
pm2 save

# Démarrer au boot système
pm2 startup
```

---

## 📁 Fichiers de configuration

### `.env.production` (Port 8082)
```bash
PORT=8082
NODE_ENV=production
DASHBOARD_TITLE=Horus Dashboard - PROD
API_URL=http://localhost:8082
WS_URL=ws://localhost:8082
```

### `.env.development` (Port 8083)
```bash
PORT=8083
NODE_ENV=development
DASHBOARD_TITLE=Horus Dashboard - DEV
API_URL=http://localhost:8083
WS_URL=ws://localhost:8083
```

### `.env.example` (Template)
Fichier modèle à copier pour créer de nouveaux environnements.

**⚠️ Important :** Les fichiers `.env.*` sont versionnés sauf `.env` (courant) qui est dans `.gitignore`.

---

## 🔍 Monitoring et Logs

### Accéder aux logs

```bash
# Logs production
tail -f /home/ubuntu/.openclaw/workspace/dashboard-v2/logs/pm2-prod-combined.log

# Logs développement
tail -f /home/ubuntu/.openclaw/workspace/dashboard-v2/logs/pm2-dev-combined.log

# Logs avec PM2
pm2 logs --lines 100
```

### Vérifier l'état des services

```bash
# État des instances
pm2 list

# Détails d'une instance
pm2 show horus-dashboard-prod

# Mémoire et CPU
pm2 monit
```

---

## 🛠️ Dépannage

### L'instance ne démarre pas

1. **Vérifier les logs :**
   ```bash
   pm2 logs horus-dashboard-prod --lines 50
   ```

2. **Vérifier le port libre :**
   ```bash
   lsof -i :8082
   lsof -i :8083
   ```

3. **Redémarrer PM2 :**
   ```bash
   pm2 restart all
   ```

### Conflit de port

Si un port est déjà utilisé :

```bash
# Trouver le processus
sudo lsof -i :8082

# Tuer le processus (avec précaution)
sudo kill -9 <PID>

# Ou changer le port dans .env.*
```

### Problème après un déploiement

1. **Revenir à la version précédente :**
   ```bash
   git log --oneline -5
   git revert <commit-problematique>
   ./deploy-prod.sh
   ```

2. **Rebuild complet :**
   ```bash
   rm -rf node_modules
   npm install
   ./deploy-prod.sh
   ```

---

## 🔄 Checklist de déploiement

### Avant déploiement Production
- [ ] Tests validés sur environnement dev (8083)
- [ ] Code review effectuée
- [ ] PR mergée dans `main`
- [ ] Backup de la configuration actuelle
- [ ] Prévenir l'équipe du déploiement

### Après déploiement Production
- [ ] Vérifier que le service est up : `pm2 list`
- [ ] Tester l'accès : http://localhost:8082
- [ ] Vérifier les logs : `pm2 logs horus-dashboard-prod`
- [ ] Valider les fonctionnalités clés
- [ ] Mettre à jour la documentation si besoin

---

## 📊 URL d'accès

| Environnement | URL | Usage |
|---------------|-----|-------|
| Production | http://192.168.100.30:8082 | Utilisateurs finaux |
| Développement | http://192.168.100.30:8083 | Tests et dev |

**Note :** Si tu utilises un reverse proxy (Nginx/Apache), configure les routes :
- `/dashboard` → 8082 (prod)
- `/dashboard-dev` → 8083 (dev)

---

## 🔐 Sécurité

- **Ne jamais committer** de données sensibles dans `.env`
- Utiliser `.env.example` comme template
- Les clés API doivent être dans des fichiers non versionnés
- Restreindre l'accès au port 8083 (dev) en production

---

## 📞 Support

En cas de problème :
1. Consulter les logs PM2
2. Vérifier l'état des services (`pm2 list`)
3. Consulter l'historique Git (`git log`)
4. Contacter l'équipe DevOps

---

**Dernière mise à jour :** 14 Mars 2026  
**Auteur :** Horus AI Assistant
