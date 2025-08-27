# Utilise l'image officielle MongoDB (ici version 6.0, vous pouvez choisir "latest" ou autre)
FROM mongo:6.0

# Variables d'environnement pour créer un utilisateur admin
ENV MONGO_INITDB_ROOT_USERNAME=admin
ENV MONGO_INITDB_ROOT_PASSWORD=secret
# Base de données par défaut (optionnel)
ENV MONGO_INITDB_DATABASE=mydatabase

# Expose le port par défaut de MongoDB
EXPOSE 27017

# Commande par défaut (déjà définie dans l'image de base, mais précisée ici pour la lisibilité)
CMD ["mongod"]
