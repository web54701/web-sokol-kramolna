import { useRef, useState } from 'react';

type Device = 'desktop' | 'mobile';

export function PreviewPane({ onClose }: { onClose: () => void }) {
  const [device, setDevice] = useState<Device>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const reload = () => {
    iframeRef.current?.contentWindow?.location.reload();
  };

  return (
    <div className="cms-preview-overlay">
      <div className="cms-preview-bar">
        <div className="cms-preview-toggle">
          <button
            className={'cms-btn-secondary' + (device === 'desktop' ? ' active' : '')}
            onClick={() => setDevice('desktop')}
          >
            🖥 Desktop
          </button>
          <button
            className={'cms-btn-secondary' + (device === 'mobile' ? ' active' : '')}
            onClick={() => setDevice('mobile')}
          >
            📱 Mobil
          </button>
          <button className="cms-btn-secondary" onClick={reload} title="Načíst znovu (po uložení změn)">⟳ Obnovit</button>
        </div>
        <button className="cms-btn-secondary" onClick={onClose}>✕ Zavřít náhled</button>
      </div>
      <div className={'cms-preview-stage' + (device === 'mobile' ? ' is-mobile' : '')}>
        <iframe ref={iframeRef} src="/" title="Náhled webu" className="cms-preview-frame" />
      </div>
    </div>
  );
}
