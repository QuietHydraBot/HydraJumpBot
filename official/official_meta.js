/* official/official_meta.js */
(function () {
  const OFF = (window.OFFICIAL ||= {});

  // Global metadata map
  const META = (window.OFFICIAL_MIN_META ||= {
    "Plains":           { type: "Basic Land — Plains",  mana: "" },
    "Island":           { type: "Basic Land — Island",  mana: "" },
    "Swamp":            { type: "Basic Land — Swamp",   mana: "" },
    "Mountain":         { type: "Basic Land — Mountain",mana: "" },
    "Forest":           { type: "Basic Land — Forest",  mana: "" },
    "Wastes":           { type: "Basic Land",           mana: "" },
    "Thriving Heath":   { type: "Land", mana: "" },
    "Thriving Isle":    { type: "Land", mana: "" },
    "Thriving Moor":    { type: "Land", mana: "" },
    "Thriving Bluff":   { type: "Land", mana: "" },
    "Thriving Grove":   { type: "Land", mana: "" }

  });

  OFF.registerMeta = function registerMeta(chunk) {
    if (!chunk || typeof chunk !== "object") return;
    Object.assign(META, chunk);
    window.OFFICIAL_MIN_META = META;
  };

  window.CARD = function CARD(name, qty = 1) {
    const nm = String(name);
    const m  = META[nm] || {};
    return {
      name: nm,
      qty: Math.max(1, parseInt(qty, 10) || 1),
      type: m.type || "",
      mana: m.mana || "",
      type_line: m.type || ""
    };
  };

  const DB = (window.OFFICIAL_PACKS ||= { jumpstart: [], jumpin: [] });
  OFF.registerPacks = function registerPacks(product, packs) {
    if (!DB[product]) DB[product] = [];
    DB[product].push(...(Array.isArray(packs) ? packs : []));
  };

  try { console.debug("[Official] meta core ready"); } catch {}
})();
