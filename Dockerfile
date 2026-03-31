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

# Installer les dépendances de production uniquement
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copier l'application compilée depuis le builder
COPY --from=builder /app/dist ./dist

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Lancer l'application
CMD ["node", "dist/main"]
