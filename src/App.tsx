import { useMemo, useState } from 'react';
import './index.css';
import { KaraokeLine, KaraokeStyle } from './types/karaoke';
import { parseScript } from './lib/parseScript';
import { exportKaraoke } from './lib/ffmpegExport';
import { getActiveLine } from './lib/karaokeRenderer';
import VideoDropzone from './components/VideoDropzone';
import ScriptDropzone from './components/ScriptDropzone';
import KaraokePreview from './components/KaraokePreview';
import SubtitleTable from './components/SubtitleTable';
import StylePanel from './components/StylePanel';
import ExportPanel from './components/ExportPanel';

const defaultStyle: KaraokeStyle = {
  preset: 'fiveMonkeys',
  fontFamily: 'Arial Rounded MT Bold',
  fontSize: 62,
  baseColor: '#f5c94f',
  highlightColor: '#fff09a',
  outlineColor: '#6a3b22',
  verticalPosition: 13,
  alignment: 'center',
  flowMode: 'word-kf-timed',
  wordSpeed: 1.05,
  wordEffect: 'none',
};

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [lines, setLines] = useState<KaraokeLine[]>([]);
  const [style, setStyle] = useState<KaraokeStyle>(defaultStyle);
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'mov' | 'mp4'>('mov');
  const [exportTransparent, setExportTransparent] = useState<boolean>(false);

  const currentLine = useMemo(
    () => ({ videoFile, lines, style }),
    [videoFile, lines, style]
  );

  const handleScriptFile = async (file: File) => {
    setError('');
    setInfo('');
    setScriptFile(file);
    try {
      const content = await file.text();
      const parsed = parseScript(content, file.name);
      setLines(parsed);
      setInfo(`Import réussi : ${parsed.length} lignes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de parsing du script');
      setLines([]);
    }
  };

  const handleUpdateLine = (index: number, line: KaraokeLine) => {
    setLines((prev) => prev.map((item, idx) => (index === idx ? line : item)));
  };

  const handleExport = async () => {
    if (!videoFile) {
      setError('Veuillez charger une video avant d\'exporter.');
      return;
    }
    if (lines.length === 0) {
      setError('Veuillez charger un script contenant au moins une ligne.');
      return;
    }

    setExporting(true);
    setError('');
    setInfo('Export en cours...');
    try {
      await exportKaraoke(videoFile, lines, style, exportFormat, exportTransparent);
      setInfo(`Export terminé. La vidéo a été enregistrée automatiquement sur le Bureau en ${exportFormat.toUpperCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app-shell">
      <header>
        <h1>Générateur de Vidéo Karaoke</h1>
        <p>Déposez une vidéo et un fichier script, puis exportez une vidéo karaoke.</p>
      </header>
      <main>
        <section className="dropzones">
          <VideoDropzone file={videoFile} onFileSelected={setVideoFile} />
          <ScriptDropzone file={scriptFile} onFileSelected={handleScriptFile} />
        </section>

        <section className="preview-section">
          <KaraokePreview videoFile={videoFile} lines={lines} style={style} />
          <div className="side-panel">
            <StylePanel style={style} onChange={setStyle} />
            <ExportPanel
              exporting={exporting}
              exportFormat={exportFormat}
              onFormatChange={setExportFormat}
              exportTransparent={exportTransparent}
              onTransparentChange={setExportTransparent}
              onExport={handleExport}
            />
          </div>
        </section>

        <section className="subtitle-section">
          <h2>Liste des lignes</h2>
          <SubtitleTable lines={lines} onUpdateLine={handleUpdateLine} />
        </section>

        <section className="messages">
          {error && <div className="message error">Erreur : {error}</div>}
          {info && <div className="message info">{info}</div>}
        </section>
      </main>
    </div>
  );
}

export default App;
