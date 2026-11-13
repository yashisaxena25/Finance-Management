import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const updateInstalled = () => setInstalled(standalone());
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(ios);
    updateInstalled();

    const onInstallAvailable = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setShowIosHelp(false);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', onInstallAvailable);
    window.addEventListener('appinstalled', onInstalled);
    const media = window.matchMedia('(display-mode: standalone)');
    media.addEventListener?.('change', updateInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallAvailable);
      window.removeEventListener('appinstalled', onInstalled);
      media.removeEventListener?.('change', updateInstalled);
    };
  }, []);

  if (installed || (!isIos && !installPrompt)) return null;

  async function install() {
    if (isIos) {
      setShowIosHelp(true);
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return <>
    <button className="install-app-btn" onClick={install} title="Install GharLedger">
      <Download size={15} /> <span>Install app</span>
    </button>
    {showIosHelp && <div className="install-help-backdrop" role="presentation" onClick={() => setShowIosHelp(false)}>
      <section className="install-help" role="dialog" aria-modal="true" aria-labelledby="install-help-title" onClick={(event) => event.stopPropagation()}>
        <button className="install-help-close" onClick={() => setShowIosHelp(false)} aria-label="Close install instructions"><X size={18} /></button>
        <h2 id="install-help-title">Add GharLedger to your Home Screen</h2>
        <ol>
          <li>Tap the <b>Share</b> button in Safari.</li>
          <li>Scroll down and choose <b>Add to Home Screen</b>.</li>
          <li>Tap <b>Add</b> to install.</li>
        </ol>
      </section>
    </div>}
  </>;
}
