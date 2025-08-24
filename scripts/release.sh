#!/bin/bash

# Script de release pour le Service d'Authentification
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les logs colorés
log() {
    echo -e "${GREEN}[AUTH-SERVICE]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[AUTH-SERVICE]${NC} $1"
}

error() {
    echo -e "${RED}[AUTH-SERVICE]${NC} $1"
    exit 1
}

# Vérifier qu'il n'y a pas de changements non commités
if [ -n "$(git status --porcelain)" ]; then
    error "Il y a des changements non commités. Veuillez les commiter avant de créer une release."
fi

# Déterminer le type de version
VERSION_TYPE=${1:-patch}

if [ "$VERSION_TYPE" != "patch" ] && [ "$VERSION_TYPE" != "minor" ] && [ "$VERSION_TYPE" != "major" ]; then
    error "Type de version invalide. Utilisez: patch, minor, ou major"
fi

log "🚀 Début du processus de release du service d'authentification ($VERSION_TYPE)"

# Récupérer la version actuelle
CURRENT_VERSION=$(node -p "require('./package.json').version")
log "Version actuelle: $CURRENT_VERSION"

# Exécuter les tests
log "🧪 Exécution des tests..."
npm test

# Créer la nouvelle version
log "📦 Création de la nouvelle version ($VERSION_TYPE)..."
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
log "Nouvelle version: $NEW_VERSION"

# Mettre à jour le CHANGELOG
log "📝 Mise à jour du CHANGELOG..."
TODAY=$(date +"%Y-%m-%d")
sed -i "s/## \[Non publié\]/## [Non publié]\n\n## [$NEW_VERSION] - $TODAY/" CHANGELOG.md

# Commiter les changements
log "💾 Commit des changements..."
git add package.json CHANGELOG.md
git commit -m "chore(auth-service): release version $NEW_VERSION"

# Créer le tag avec préfixe pour le service
AUTH_TAG="auth-service-$NEW_VERSION"
log "🏷️  Création du tag: $AUTH_TAG"
git tag -a "$AUTH_TAG" -m "Release Auth Service $NEW_VERSION"

# Pousser les changements
log "⬆️  Push des changements et du tag..."
git push origin main
git push origin "$AUTH_TAG"

log "✅ Release $NEW_VERSION du service d'authentification créée avec succès!"
log "🏷️  Tag créé: $AUTH_TAG"
log "📋 Vérifiez le CHANGELOG.md pour les détails"

# Afficher les informations de la release
log "📊 Informations de la release:"
log "   - Service: Authentification"
log "   - Version: $NEW_VERSION"
log "   - Tag: $AUTH_TAG"
log "   - Date: $TODAY"
