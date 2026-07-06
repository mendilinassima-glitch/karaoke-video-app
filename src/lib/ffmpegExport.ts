import { KaraokeLine, KaraokeStyle } from '../types/karaoke';

export async function exportKaraoke(videoFile: File, lines: KaraokeLine[], style: KaraokeStyle, format: 'mov' | 'mp4' = 'mov', transparent: boolean = false) {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('style', JSON.stringify(style));
  formData.append('lines', JSON.stringify(lines));
  formData.append('format', format);
  formData.append('transparent', transparent ? 'true' : 'false');

  console.log('Export en cours...', {
    videoFile: videoFile.name,
    videoSize: videoFile.size,
    videoType: videoFile.type,
    linesCount: lines.length,
    format,
  });

  try {
   const apiUrl = import.meta.env.DEV
  ? 'http://127.0.0.1:4175/api/export'
  : `${import.meta.env.VITE_API_URL}/api/export`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur réponse:', response.status, errorText);
      throw new Error(errorText || `Erreur serveur (${response.status})`);
    }

  const blob = await response.blob();
  console.log('Fichier reçu:', blob.size, 'bytes');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `karaoke-export.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

    console.log('Export terminé avec succès');
  } catch (error) {
    console.error('Erreur export:', error);
    throw error;
  }
}
