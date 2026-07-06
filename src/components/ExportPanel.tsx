type Props = {
  exporting: boolean;
  exportFormat: 'mov' | 'mp4';
  exportTransparent?: boolean;
  onFormatChange: (format: 'mov' | 'mp4') => void;
  onTransparentChange?: (transparent: boolean) => void;
  onExport: () => void;
};

export default function ExportPanel({ exporting, exportFormat, exportTransparent = false, onFormatChange, onTransparentChange, onExport }: Props) {
  return (
    <div className="panel-card">
      <h2>Export</h2>
      <p>Le rendu final utilise FFmpeg côté serveur local pour générer la vidéo.</p>
      <label htmlFor="export-format">Format de sortie</label>
      <select
        id="export-format"
        value={exportFormat}
        onChange={(event) => onFormatChange(event.target.value as 'mov' | 'mp4')}
        disabled={exporting}
      >
        <option value="mov">MOV (Adobe / ProRes)</option>
        <option value="mp4">MP4 (Web / H.264)</option>
      </select>
      <label style={{ display: 'block', marginTop: 8 }}>
        <input
          type="checkbox"
          id="export-transparent"
          checked={exportTransparent}
          disabled={exporting || exportFormat !== 'mov'}
          onChange={(e) => onTransparentChange && onTransparentChange(e.target.checked)}
        />{' '}
        Exporter sur fond transparent (alpha) — uniquement pour MOV
      </label>
      <button className="button" disabled={exporting} onClick={onExport}>
        {exporting ? 'Export en cours...' : 'Exporter la vidéo'}
      </button>
    </div>
  );
}
