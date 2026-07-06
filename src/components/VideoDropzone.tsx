import { useCallback } from 'react';

type Props = {
  file: File | null;
  onFileSelected: (file: File | null) => void;
};

export default function VideoDropzone({ file, onFileSelected }: Props) {
  const handleFile = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const candidate = files[0];
    if (!['video/mp4', 'video/quicktime', 'video/x-matroska'].includes(candidate.type) && !candidate.name.match(/\.(mp4|mov|mkv)$/i)) {
      onFileSelected(null);
      return;
    }
    onFileSelected(candidate);
  }, [onFileSelected]);

  return (
    <div className="dropzone-card">
      <h2>Vidéo source</h2>
      <label
        className="dropzone-area"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFile(event.dataTransfer.files);
        }}
      >
        <p>Déposez une vidéo <strong>.mp4</strong>, <strong>.mov</strong>, <strong>.mkv</strong></p>
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/x-matroska"
          style={{ display: 'none' }}
          onChange={(event) => handleFile(event.target.files)}
        />
        {file ? <p>Chargé : {file.name}</p> : <p>Ou cliquez pour sélectionner la vidéo</p>}
      </label>
    </div>
  );
}
