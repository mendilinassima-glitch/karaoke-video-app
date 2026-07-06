import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path);

const app = express();
const upload = multer({ dest: path.join(os.tmpdir(), 'karaoke-upload') });

app.use(cors());
app.use(express.json());

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function colorToAss(color) {
  const hex = color.replace('#', '');
  return `&H00${hex.slice(4, 6)}${hex.slice(2, 4)}${hex.slice(0, 2)}`;
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.round((seconds - Math.floor(seconds)) * 100);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function getAssAlignment(alignment) {
  if (alignment === 'left') return 1;
  if (alignment === 'right') return 3;
  return 2;
}

function escapeAssText(text) {
  return String(text).replace(/[{\\}]/g, (match) => `\\${match}`);
}

function createKaraokeText(line, flowMode, wordSpeed = 1) {
  const text = escapeAssText(line.text);
  const duration = Math.max(1, Math.round((Number(line.end) - Number(line.start)) * 100));

  if (flowMode === 'word-kf-timed' && Array.isArray(line.wordTimings) && line.wordTimings.length) {
    return line.wordTimings
      .map((word) => {
        const wordDuration = Math.max(1, Math.round(Number(word.duration || 0.01) * 100 / Math.max(0.5, Number(wordSpeed) || 1)));
        return `{\\kf${wordDuration}}${escapeAssText(word.text)}`;
      })
      .join('');
  }

  if (flowMode === 'word-sweep' || flowMode === 'word-kf-timed') {
    const words = text.split(/(\s+)/);
    const visibleWords = words.filter((word) => word.trim()).length;
    const wordDuration = Math.max(1, Math.round(duration / Math.max(1, visibleWords) / Math.max(0.5, Number(wordSpeed) || 1)));
    return words
      .map((word) => (word.trim() ? `{\\kf${wordDuration}}${word}` : word))
      .join('');
  }

  if (flowMode === 'word' || flowMode === 'word-highlight' || flowMode === 'word-wave') {
    const words = text.split(/(\s+)/);
    const visibleWords = words.filter((word) => word.trim()).length;
    const wordDuration = Math.max(1, Math.round(duration / Math.max(1, visibleWords) / Math.max(0.5, Number(wordSpeed) || 1)));
    return words
      .map((word) => (word.trim() ? `{\\k${wordDuration}}${word}` : word))
      .join('');
  }

  if (flowMode === 'slide-left') {
    return `{\\move(1500,640,-220,640)}${text}`;
  }

  if (flowMode === 'slide-up') {
    return `{\\move(640,710,640,620)}${text}`;
  }

  if (flowMode === 'sweep' || flowMode === 'color-progressive' || flowMode === 'gradient-background') {
    return `{\\kf${duration}}${text}`;
  }

  return `{\\kf${duration}}${text}`;
}

function createDesktopExportPath() {
  const desktopDir = path.join(os.homedir(), 'Desktop');
  ensureDirectory(desktopDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return path.join(desktopDir, `karaoke-export-${timestamp}.mp4`);
}

function parseFrameRate(value) {
  if (!value || value === '0/0') return 0;
  const [num, den] = String(value).split('/').map(Number);
  if (!Number.isFinite(num)) return 0;
  return Number.isFinite(den) && den > 0 ? num / den : num;
}

function probeVideo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }

      const stream = metadata.streams.find((item) => item.codec_type === 'video');
      resolve(stream ?? null);
    });
  });
}

function assertUsableVideo(stream) {
  if (!stream) {
    throw new Error('Le fichier choisi ne contient pas de piste vidéo. Sélectionnez une vraie vidéo MP4/MOV/MKV, pas seulement un audio.');
  }

  const width = Number(stream.width || 0);
  const height = Number(stream.height || 0);
  const fps = parseFrameRate(stream.avg_frame_rate || stream.r_frame_rate);

  if (width < 640 || height < 360 || fps < 10) {
    throw new Error(`La vidéo source reçue semble invalide (${width}x${height}, ${fps.toFixed(2)} fps). Rechargez la vidéo originale, pas un export noir ou un fichier de prévisualisation.`);
  }
}

app.post('/api/export', upload.single('video'), async (req, res) => {
  try {
    const videoFile = req.file;
    const style = JSON.parse(req.body.style ?? '{}');
    const lines = JSON.parse(req.body.lines ?? '[]');
    const requestedFormat = String(req.body.format || 'mov').toLowerCase();
    const requestedTransparent = String(req.body.transparent || 'false').toLowerCase() === 'true';
    const exportFormat = requestedFormat === 'mp4' ? 'mp4' : 'mov';
    const exportTransparent = requestedTransparent && exportFormat === 'mov';

    if (!videoFile) {
      return res.status(400).send('Aucune vidéo reçue.');
    }
    if (!Array.isArray(lines) || !lines.length) {
      return res.status(400).send('Aucun script valide fourni.');
    }

    const outputDir = path.join(os.tmpdir(), 'karaoke-export');
    ensureDirectory(outputDir);
    const assPath = path.join(outputDir, `karaoke-${Date.now()}.ass`);
    const outputPath = path.join(outputDir, `karaoke-${Date.now()}.${exportFormat}`);

    const primaryColor = colorToAss(style.highlightColor || '#ffdd00');
    const secondaryColor = colorToAss(style.baseColor || '#ffffff');
    const outlineColor = colorToAss(style.outlineColor || '#000000');
    const alignment = getAssAlignment(style.alignment);
    const flowMode = style.flowMode || 'sweep';
    const wordSpeed = Number(style.wordSpeed || 1);

    const ass = [
      '[Script Info]',
      'ScriptType: v4.00+',
      'Collisions: Normal',
      'PlayResX: 1920',
      'PlayResY: 1080',
      '',
      '[V4+ Styles]',
      'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
      `Style: Default,${style.fontFamily || 'Arial'},${style.fontSize || 64},${primaryColor},${secondaryColor},${outlineColor},&HFF000000,0,0,0,0,100,100,0,0,1,4,0,${alignment},10,10,${style.verticalPosition || 18},1`,
      '',
      '[Events]',
      'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ];

    for (const line of lines) {
      const start = formatTime(Number(line.start));
      const end = formatTime(Number(line.end));
      const text = createKaraokeText(line, flowMode, wordSpeed);
      ass.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`);
    }

    fs.writeFileSync(assPath, ass.join('\n'), 'utf-8');

    // Vérifier que le fichier vidéo existe
    if (!fs.existsSync(videoFile.path)) {
      console.error(`Fichier vidéo non trouvé: ${videoFile.path}`);
      return res.status(400).send('Fichier vidéo non trouvé après upload.');
    }

    console.log(`Fichier vidéo reçu: ${videoFile.path} (${videoFile.size} bytes, mimetype: ${videoFile.mimetype})`);
    console.log(`Fichier ASS créé: ${assPath}`);

    let videoStream;
    let videoWidth = 1920;
    let videoHeight = 1080;
    let videoFps = 25;

    try {
      videoStream = await probeVideo(videoFile.path);
      assertUsableVideo(videoStream);
      videoWidth = Number(videoStream.width || 1920);
      videoHeight = Number(videoStream.height || 1080);
      videoFps = parseFrameRate(videoStream.avg_frame_rate || videoStream.r_frame_rate) || 25;
      console.log(
        `Vidéo validée: ${videoWidth}x${videoHeight}, ${videoFps.toFixed(2)} fps`
      );
    } catch (error) {
      console.error('Validation vidéo échouée:', error);
      return res.status(400).send(error.message || 'Vidéo source invalide.');
    }

    const ffmpegOptions = (exportFormat === 'mp4')
      ? [
          '-y',
          '-map 0:v:0',
          '-map 0:a?',
          '-preset veryfast',
          '-crf 18',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-shortest',
        ]
      : [
          '-y',
          '-map 0:v:0',
          '-map 0:a?',
          '-c:v', 'prores_ks',
          '-profile:v', '4',
          '-pix_fmt', 'yuva444p10le',
          '-alpha_bits', '16',
          '-c:a', 'pcm_s24le',
          '-ar', '48000',
          '-movflags', '+faststart',
          '-shortest',
        ];

    if (exportTransparent) {
      // Render subtitles on a transparent canvas and map audio from the source
      const width = videoWidth;
      const height = videoHeight;
      const fps = videoFps;
      const colorSpec = `color=black@0:size=${width}x${height}:rate=${fps}`;

      const transparentOptions = [
        '-y',
        '-map', '0:v:0',
        '-map', '1:a?',
        '-c:v', 'prores_ks',
        '-profile:v', '4',
        '-pix_fmt', 'yuva444p10le',
        '-alpha_bits', '16',
        '-c:a', 'pcm_s24le',
        '-ar', '48000',
        '-movflags', '+faststart',
        '-shortest',
      ];

      await new Promise((resolve, reject) => {
        console.log(`Démarrage FFmpeg (transparent) avec canvas ${width}x${height}@${fps}: ${videoFile.path}`);
        ffmpeg()
          .input(colorSpec)
          .inputOptions(['-f', 'lavfi'])
          .input(videoFile.path)
          .videoFilters([`ass=${assPath}`])
          .outputOptions(transparentOptions)
          .on('start', (commandLine) => {
            console.log('FFmpeg started:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('FFmpeg progress:', progress);
          })
          .on('end', () => {
            console.log('FFmpeg terminé avec succès (transparent)');
            resolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg error (transparent):', err);
            reject(err);
          })
          .save(outputPath);
      });
    } else {
      await new Promise((resolve, reject) => {
        console.log(`Démarrage FFmpeg avec le fichier: ${videoFile.path}`);
        ffmpeg(videoFile.path)
          .videoFilters([`ass=${assPath}`])
          .outputOptions(ffmpegOptions)
          .on('start', (commandLine) => {
            console.log('FFmpeg started:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('FFmpeg progress:', progress);
          })
          .on('end', () => {
            console.log('FFmpeg terminé avec succès');
            resolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(err);
          })
          .save(outputPath);
      });
    }

    const desktopDir = path.join(os.homedir(), 'Desktop');
    ensureDirectory(desktopDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const desktopOutputPath = path.join(desktopDir, `karaoke-export-${timestamp}.${exportFormat}`);
    fs.copyFileSync(outputPath, desktopOutputPath);
    console.log(`Vidéo copiée sur le Bureau: ${desktopOutputPath}`);
    res.setHeader('X-Desktop-Output', encodeURIComponent(desktopOutputPath));

    res.setHeader('Content-Type', exportFormat === 'mp4' ? 'video/mp4' : 'video/quicktime');
    res.download(outputPath, `karaoke-export.${exportFormat}`, (err) => {
      if (err) {
        console.error(err);
      }
      try {
        fs.unlinkSync(videoFile.path);
      } catch {}
      try {
        fs.unlinkSync(assPath);
      } catch {}
      try {
        fs.unlinkSync(outputPath);
      } catch {}
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    res.status(500).send(`Erreur serveur lors de l'export FFmpeg: ${error.message}`);
  }
});

const PORT = Number(process.env.PORT || 4175);
// Listen on all interfaces so the dev instance can be reached on the local network
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server karaoke démarré sur http://${HOST === '0.0.0.0' ? '0.0.0.0' : HOST}:${PORT}`);
  console.log('Accessible depuis le réseau local sur http://<your-ip>');
});
