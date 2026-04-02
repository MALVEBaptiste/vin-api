# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY src ./src

# Build l'application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Définir l'environnement
ENV NODE_ENV=production

# Installer netcat pour le health check du démarrage
RUN apk add --no-cache netcat-openbsd

# Copier les fichiers source nécessaires au seed (ts-node en a besoin)
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copier les dépendances (toutes, pour exécuter les seeds et migrations)
COPY package*.json ./
RUN npm ci

# Copier l'application compilée depuis le builder
COPY --from=builder /app/dist ./dist

# Copier le code source pour ts-node (seeds et migrations)
COPY src ./src

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Copier le script d'entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nodejs

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Lancer l'application avec le script d'entrypoint
CMD ["sh", "/app/docker-entrypoint.sh"]
