import { ChangeEvent } from 'react';
import { KaraokeLine } from '../types/karaoke';

type Props = {
  lines: KaraokeLine[];
  onUpdateLine: (index: number, line: KaraokeLine) => void;
};

export default function SubtitleTable({ lines, onUpdateLine }: Props) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Start</th>
            <th>End</th>
            <th>Texte</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={line.id}>
              <td>
                <input
                  value={line.start.toFixed(3)}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onUpdateLine(index, { ...line, start: Number(event.target.value) })
                  }
                />
              </td>
              <td>
                <input
                  value={line.end.toFixed(3)}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onUpdateLine(index, { ...line, end: Number(event.target.value) })
                  }
                />
              </td>
              <td>
                <input
                  value={line.text}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onUpdateLine(index, { ...line, text: event.target.value })
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
