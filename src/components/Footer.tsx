import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function Footer() {
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    const handleInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <footer className="site-footer">
      Made by{" "}
      <a
        href="https://www.pixelcraftstudios.co.za/"
        target="_blank"
        rel="noreferrer"
      >
        PixelCraft Studios
      </a>
      {installPrompt && (
        <button
          className="install-app-button"
          type="button"
          onClick={() => void installApp()}
        >
          Install app
        </button>
      )}
    </footer>
  );
}

export default Footer;
