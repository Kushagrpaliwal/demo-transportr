import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "cookieConsentChoice";

const saveConsent = (choice) => {
  const maxAgeInSeconds = 60 * 60 * 24 * 180; // 180 days
  document.cookie = `cookie_consent=${choice}; Max-Age=${maxAgeInSeconds}; Path=/; SameSite=Lax`;
  localStorage.setItem(COOKIE_CONSENT_KEY, choice);
};

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentChoice = localStorage.getItem(COOKIE_CONSENT_KEY);
    setIsVisible(!currentChoice);
  }, []);

  const handleConsent = (choice) => {
    saveConsent(choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[999] bg-slate-900/95 text-white shadow-lg">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm leading-6">
          We use cookies to improve your experience and analyze traffic. Please
          choose whether to accept or reject non-essential cookies.
        </p>
        <div className="flex items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={() => handleConsent("rejected")}
            className="rounded-md border border-white/40 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => handleConsent("accepted")}
            className="rounded-md bg-[#4681F4] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
