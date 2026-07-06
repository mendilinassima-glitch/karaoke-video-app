#!/bin/zsh
cd "$HOME/Desktop/karaoke_video_app"
if [ -f package.json ]; then
  echo "Lancement de Karaoke Studio dans $PWD"
  npm run start
else
  echo "Erreur : package.json introuvable dans $PWD"
  exit 1
fi
