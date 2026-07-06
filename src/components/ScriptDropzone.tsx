import { useCallback } from 'react';

type Props = {
  file: File | null;
  onFileSelected: (file: File) => void;
};

export default function ScriptDropzone({ file, onFileSelected }: Props) {
  const handleFile = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    onFileSelected(files[0]);
  }, [onFileSelected]);

  return (
    <div className="dropzone-card">
      <h2>Script karaoke</h2>
      <label
        className="dropzone-area"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFile(event.dataTransfer.files);
        }}
      >
        <p>Déposez un fichier <strong>.srt</strong>, <strong>.csv</strong> ou <strong>.txt</strong></p>
        <input
          type="file"
          accept=".srt,.csv,.txt"
          style={{ display: 'none' }}
          onChange={(event) => handleFile(event.target.files)}
        />
        {file ? <p>Chargé : {file.name}</p> : <p>Ou cliquez pour sélectionner le script</p>}
      </label>
    </div>
  );
}
