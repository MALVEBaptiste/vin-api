#!/bin/bash
# Script de déploiement Docker pour la wine-api

set -e

echo "========================================"
echo "Déploiement Wine API avec Docker"
echo "========================================"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "ERREUR: Docker n'est pas installé"
    exit 1
fi

# Vérifier docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "ERREUR: docker-compose n'est pas disponible"
    exit 1
fi

echo ""
echo "[1] Construction des images Docker..."
docker-compose build

echo ""
echo "[2] Démarrage des conteneurs..."
docker-compose up -d

echo ""
echo "[3] Attente du démarrage de la base de données (10 secondes)..."
sleep 10

echo ""
echo "[4] Exécution des migrations..."
docker-compose exec -T api npm run migration:run

echo ""
echo "========================================"
echo "Déploiement terminé avec succès !"
echo "========================================"
echo ""
echo "API URL: http://localhost:3000"
echo "Swagger UI: http://localhost:3000/api/docs"
echo "PostgreSQL: localhost:5432"
echo ""
echo "Commandes utiles:"
echo "  - Voir les logs: docker-compose logs -f api"
echo "  - Arrêter: docker-compose down"
echo "  - Redémarrer: docker-compose restart"
