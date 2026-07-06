#!/bin/zsh
cd "$HOME/Desktop/karaoke_video_app" || exit 1

if ! command -v npm >/dev/null 2>&1; then
  echo "npm introuvable. Installez Node.js pour utiliser ce lanceur."
  read -r "PressEnter?"
  exit 1
fi

echo "Démarrage de Karaoke Studio dans $PWD"
npm run start
