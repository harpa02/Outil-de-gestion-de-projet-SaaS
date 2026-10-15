# Étape 1 : Construction de l'interface frontend React / Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des définitions de paquets
COPY package*.json ./
RUN npm install

# Copie des sources et compilation du frontend dans /app/dist
COPY . .
RUN npm run build

# Étape 2 : Image d'exécution légère pour l'API et la distribution statique
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Installation des dépendances de production uniquement
COPY package*.json ./
RUN npm install --omit=dev

# Copie du backend et du build frontend
COPY server/ ./server/
COPY --from=builder /app/dist ./dist

# Exposition du port applicatif
EXPOSE 3000

# Commande de démarrage
CMD ["node", "server/index.js"]
