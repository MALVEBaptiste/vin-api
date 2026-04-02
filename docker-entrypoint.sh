#!/bin/sh
# Script d''initialisation pour l''API
# Exécute les migrations et seeds avant de démarrer l''application

echo "🗄️  Attente de la base de données..."
until nc -z postgres 5432; do
  echo "Base de données indisponible - attente..."
  sleep 2
done

echo "✅ Base de données prête"
echo "🔄 Exécution des migrations..."
npm run migration:run || true

echo "🌱 Exécution des seeds..."
npm run seed || true

echo "🚀 Démarrage de l''application..."
exec node dist/main