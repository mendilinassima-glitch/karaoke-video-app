import { KaraokeStyle, PresetKey } from '../types/karaoke';

const fontOptions = [
  'Arial',
  'Arial Rounded MT Bold',
  'Avenir Next',
  'Comic Sans MS',
  'Chalkboard SE',
  'Marker Felt',
  'Trebuchet MS',
  'Verdana',
  'Impact',
  'Georgia',
  'Helvetica Neue',
  'Times New Roman',
  'Courier New',
] as const;

const presetLabels: Record<PresetKey, string> = {
  youtube: 'YouTube',
  disney: 'Disney',
  cocomelon: 'Cocomelon',
  netflixKids: 'Netflix Kids',
  appleMusic: 'Apple Music',
  video: 'Karaoké vidéo',
  fiveMonkeys: 'Five Little Monkeys',
  custom: 'Personnalisé',
};

const presetStyles: Record<Exclude<PresetKey, 'custom'>, Partial<KaraokeStyle>> = {
  youtube: {
    fontFamily: 'Helvetica Neue',
    baseColor: '#ffffff',
    highlightColor: '#ffffff',
    outlineColor: '#141414',
    flowMode: 'youtube',
    wordEffect: 'none',
  },
  disney: {
    fontFamily: 'Chalkboard SE',
    baseColor: '#f6f2ff',
    highlightColor: '#4b80ff',
    outlineColor: '#1d1d3a',
    flowMode: 'gradient-background',
    wordEffect: 'glow',
  },
  cocomelon: {
    fontFamily: 'Comic Sans MS',
    baseColor: '#ffffff',
    highlightColor: '#25d366',
    outlineColor: '#ff5c8d',
    flowMode: 'word-wave',
    wordEffect: 'bounce',
  },
  netflixKids: {
    fontFamily: 'Impact',
    baseColor: '#e8e8e8',
    highlightColor: '#ff1a24',
    outlineColor: '#262626',
    flowMode: 'slide-left',
    wordEffect: 'wave',
  },
  appleMusic: {
    fontFamily: 'Avenir Next',
    baseColor: '#f4f7ff',
    highlightColor: '#1d8bff',
    outlineColor: '#141414',
    flowMode: 'color-progressive',
    wordEffect: 'glow',
  },
  video: {
    fontFamily: 'Arial Rounded MT Bold',
    fontSize: 60,
    baseColor: '#f7d25f',
    highlightColor: '#ffec7f',
    outlineColor: '#1b1410',
    verticalPosition: 16,
    alignment: 'center',
    flowMode: 'youtube',
    wordSpeed: 1.1,
    wordEffect: 'none',
  },
  fiveMonkeys: {
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
  },
};

type Props = {
  style: KaraokeStyle;
  onChange: (style: KaraokeStyle) => void;
};

export default function StylePanel({ style, onChange }: Props) {
  const handlePresetChange = (preset: PresetKey) => {
    if (preset === 'custom') {
      onChange({ ...style, preset });
      return;
    }

    const presetStyle = presetStyles[preset];
    onChange({
      ...style,
      ...presetStyle,
      preset,
    });
  };

  const updateStyle = <K extends keyof KaraokeStyle>(field: K, value: KaraokeStyle[K]) => {
    onChange({
      ...style,
      [field]: value,
      preset: 'custom',
    } as KaraokeStyle);
  };

  return (
    <div className="panel-card">
      <h2>Style karaoke</h2>
      <label>
        Preset
        <select value={style.preset} onChange={(event) => handlePresetChange(event.target.value as PresetKey)}>
          {Object.entries(presetLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Police
        <select value={style.fontFamily} onChange={(event) => updateStyle('fontFamily', event.target.value)}>
          {fontOptions.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </label>
      <label>
        Taille du texte
        <input
          type="number"
          min={28}
          max={120}
          value={style.fontSize}
          onChange={(event) => onChange({ ...style, fontSize: Number(event.target.value) })}
        />
      </label>
      <label>
        Couleur normale
        <input
          type="color"
          value={style.baseColor}
          onChange={(event) => onChange({ ...style, baseColor: event.target.value })}
        />
      </label>
      <label>
        Couleur chantée
        <input
          type="color"
          value={style.highlightColor}
          onChange={(event) => onChange({ ...style, highlightColor: event.target.value })}
        />
      </label>
      <label>
        Couleur contour
        <input
          type="color"
          value={style.outlineColor}
          onChange={(event) => onChange({ ...style, outlineColor: event.target.value })}
        />
      </label>
      <label>
        Position verticale (%)
        <input
          type="number"
          min={5}
          max={35}
          value={style.verticalPosition}
          onChange={(event) => onChange({ ...style, verticalPosition: Number(event.target.value) })}
        />
      </label>
      <label>
        Alignement
        <select value={style.alignment} onChange={(event) => onChange({ ...style, alignment: event.target.value as KaraokeStyle['alignment'] })}>
          <option value="left">Gauche</option>
          <option value="center">Centre</option>
          <option value="right">Droite</option>
        </select>
      </label>
      <label>
        Défilement du texte
        <select value={style.flowMode} onChange={(event) => onChange({ ...style, flowMode: event.target.value as KaraokeStyle['flowMode'] })}>
          <option value="sweep">Surlignage gauche-droite</option>
          <option value="color-progressive">Couleur progressive (ASS \\kf)</option>
          <option value="word">Mot par mot</option>
          <option value="word-highlight">Word Highlight instantané (ASS \\k)</option>
          <option value="word-sweep">Couleur qui passe mot par mot (ASS \\kf)</option>
          <option value="word-kf-timed">Karaoké mot par mot timé (ASS \\kf)</option>
          <option value="gradient-background">Dégradé arrière-plan blanc</option>
          <option value="word-wave">Mot par mot vague</option>
          <option value="slide-left">Défilement horizontal</option>
          <option value="slide-up">Défilement vers le haut</option>
          <option value="youtube">YouTube Scroll</option>
          <option value="classic">Effet karaoké vidéo</option>
        </select>
      </label>
      <label>
        Vitesse mot par mot
        <input
          type="range"
          min={0.8}
          max={1.8}
          step={0.05}
          value={style.wordSpeed}
          onChange={(event) => onChange({ ...style, wordSpeed: Number(event.target.value) })}
        />
        <span className="field-value">{style.wordSpeed.toFixed(2)}x</span>
      </label>
      <label>
        Effet entre les mots
        <select value={style.wordEffect} onChange={(event) => onChange({ ...style, wordEffect: event.target.value as KaraokeStyle['wordEffect'] })}>
          <option value="none">Simple</option>
          <option value="pop">Pop</option>
          <option value="bounce">Rebond</option>
          <option value="glow">Glow lumineux</option>
          <option value="wave">Vague</option>
        </select>
      </label>
    </div>
  );
}
