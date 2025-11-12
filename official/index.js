/* official/index.js
   - Preloads on DOM ready so the Official panel is instant.
*/
(function () {
  const MANIFEST = [
    "official/official_meta.js?v=1",
    "official/js-jumpstart2022-j22.js?v=1",

    // JumpStart
    "official/js-foundations-j25.js?v=2",
    "official/js-avatarbb-abb.js?v=1",
    "official/js-avatar-ajs.js?v=1",

    
    // Jump In!
    "official/ji-Edge-EOE.js?v=1",
    "official/ji-finalfantasy-fin.js?v=1",

    // Comunity
  ];

function loadScriptSequential(urls) {
  return urls.reduce((p, url) => p.then(() => new Promise((res) => {
    const s = document.createElement("script");
    s.src = url;
    s.async = false; // preserve order
    s.onload = () => { console.log("[Official] loaded:", url); res(); };
    s.onerror = () => { console.warn("[Official] missing or failed:", url); res(); };
    document.head.appendChild(s);
  })), Promise.resolve());
}

  let loadingPromise = null;
  window.ensureOfficialLoaded = function ensureOfficialLoaded() {
    if (loadingPromise) return loadingPromise;
    loadingPromise = loadScriptSequential(MANIFEST).catch(err => {
      console.error("[Official] load failed:", err);
      throw err;
    });
    return loadingPromise;
  };

  // Preload once DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    ensureOfficialLoaded().catch(()=>{ /* errors already logged */ });
  });
})();
