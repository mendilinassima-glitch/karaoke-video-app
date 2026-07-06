# KaraSync Studio

KaraSync Studio est un outil local pour créer une vidéo karaoke à partir :

- d'une vidéo source ;
- d'un script avec TC IN, TC OUT et texte ;
- d'un style karaoke personnalisable.

L'application fonctionne en local : les vidéos ne sont pas envoyées en ligne.

## Lancer l'application

Ouvre le fichier :

```txt
Lancer Karaoke Studio.command
```

Puis ouvre l'interface dans ton navigateur :

```txt
http://localhost:4173/
```

Le moteur d'export vidéo tourne en arrière-plan sur :

```txt
http://localhost:4175/
```

Ne l'ouvre pas directement : il peut afficher `Cannot GET`, c'est normal.

## Utilisation

1. Dépose ou sélectionne une vidéo `.mp4`, `.mov` ou `.mkv`.
2. Dépose ou sélectionne un script `.srt`, `.csv` ou `.txt`.
3. Vérifie la prévisualisation.
4. Choisis le style karaoke :
   - police ;
   - taille ;
   - couleur normale ;
   - couleur chantée ;
   - contour ;
   - position ;
   - mode de défilement.
5. Clique sur `Exporter la vidéo`.

- Choisis le format de sortie `MOV` ou `MP4` avant l’export.
- MOV est recommandé pour un usage Adobe Premiere / After Effects.
- MP4 est utile pour un rendu web plus léger.

Option transparence (alpha):

- Cochez « Exporter sur fond transparent (alpha) » pour générer un `MOV` ProRes 4444 contenant une couche alpha.
- Note: la transparence n'est supportée que pour `MOV` (ProRes). `MP4` n'inclut pas d'alpha.

Partager l'interface sur le réseau local (sans téléchargement)

- Si tes collègues sont sur le même réseau Wi‑Fi/LAN, tu peux leur donner une URL locale.
- Démarre le front et le serveur en mode réseau :

```bash
cd /Users/ma_df_02/Desktop/karaoke_video_app
# front (vite) accessible sur toutes les interfaces
npm run dev -- --host
# server d'export (écoute sur 0.0.0.0 par défaut)
npm run server
```

- Ensuite partage cette URL (remplace 10.10.100.73 par l'IP affichée par `ipconfig getifaddr en0` sur ta machine) :

```
http://10.10.100.73:4173   # front
http://10.10.100.73:4175   # API export
```

- Remarques :
   - Assure-toi que ton pare-feu autorise les connexions entrantes sur ces ports.
   - Si tu veux un lien public accessible hors du réseau local, il faudra utiliser un tunnel (ngrok/cloudflared/localtunnel), ce qui nécessite un petit téléchargement ou une autorisation externe.

La vidéo exportée est enregistrée automatiquement sur le Bureau.

## Formats de script acceptés

Exemple CSV :

```csv
tc_in,tc_out,text
00:00:01:12,00:00:04:08,Je ne peux pas vivre sans toi
00:00:04:09,00:00:06:15,Reviens-moi ce soir
```

Exemple texte :

```txt
00:00:01:12 --> 00:00:04:08
Je ne peux pas vivre sans toi
```

Formats timecode acceptés :

- `HH:MM:SS:FF`
- `HH:MM:SS,mmm`
- `HH:MM:SS.mmm`

## Modes karaoke disponibles

- `Surlignage gauche-droite`
- `Couleur progressive (ASS \kf)`
- `Mot par mot`
- `Word Highlight instantané (ASS \k)`
- `Couleur qui passe mot par mot (ASS \kf)`
- `Dégradé arrière-plan blanc`
- `Mot par mot vague`
- `Défilement horizontal`
- `Défilement vers le haut`

## Si la vidéo ne se lit pas

Le navigateur peut refuser certains fichiers `.mov` ou `.mkv`.

Le format le plus fiable est :

```txt
MP4 H.264 avec audio AAC
```

## Si le README n'affiche rien

Dans VS Code :

1. Ouvre `README.md`.
2. Clique sur l'icône de prévisualisation Markdown en haut à droite.
3. Ou fais clic droit dans le fichier puis choisis `Open Preview`.

Si seul le titre apparaît, c'est que le fichier n'a pas encore été rafraîchi. Ferme puis rouvre `README.md`.
