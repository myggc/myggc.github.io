/* ==========================================================================
   Georgian Game Community — shared UI pieces
   Logo and social icons as inline SVG, so nothing depends on an icon CDN.

   >>> REPLACE WITH REAL IMAGES <<<
   The logo below is a vector rebuild of the GGC mark. When you have the
   official artwork, drop it in /assets/img/ and swap the calls:

     ggcLogo(34)   ->   <img src="/assets/img/logo.png" width="34" height="34" alt="GGC">

   PNG is fine; SVG is better if you have it. Keep the same square shape.
   Other places marked "REPLACE WITH REAL IMAGE" work the same way.
   ========================================================================== */

const BRAND = { green:"#7CBB42", red:"#E52528", blue:"#2E9BD6", yellow:"#FBB515" };

/* One petal of the mark: rounded on the outside, square-ish toward the centre,
   with a rounded triangle cut out. Four of them, rotated, make the logo. */
function ggcPetal(color, rot){
  return `<g transform="rotate(${rot} 50 50)">
    <path fill="${color}" d="M50 6.5h18.5A25 25 0 0 1 93.5 31.5V50a6 6 0 0 1-6 6H56a6 6 0 0 1-6-6V12.5a6 6 0 0 1 0-6z"
          transform="translate(0 0)"/>
    <path fill="#fff" d="M70.5 21.5c1.6-2.8 5.7-2.8 7.3 0l5.4 9.3c1.6 2.8-.4 6.2-3.6 6.2H68.7c-3.2 0-5.2-3.4-3.6-6.2z"/>
  </g>`;
}

function ggcLogo(size, className){
  const s = size || 40;
  return `<svg class="logo ${className||""}" width="${s}" height="${s}" viewBox="0 0 100 100"
       xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GGC">
    ${ggcPetal(BRAND.red,    0)}
    ${ggcPetal(BRAND.yellow, 90)}
    ${ggcPetal(BRAND.blue,   180)}
    ${ggcPetal(BRAND.green,  270)}
  </svg>`;
}

/* ---------------------------------------------------------------- icons */

const ICONS = {
  facebook:'<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/>',
  instagram:'<path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.8-.1zm0 3.2A6.6 6.6 0 1 0 18.6 12 6.6 6.6 0 0 0 12 5.4zm0 10.9A4.3 4.3 0 1 1 16.3 12 4.3 4.3 0 0 1 12 16.3zm6.9-11a1.5 1.5 0 1 1-1.6-1.6 1.5 1.5 0 0 1 1.6 1.6z"/>',
  youtube:'<path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.1V8.9l5.2 3.1z"/>',
  tiktok:'<path d="M16.6 5.8a4.8 4.8 0 0 1-1.1-3.1h-3.2v12.6a2.8 2.8 0 1 1-2-2.7V9.3a6 6 0 1 0 5.2 5.9V9.5a7.9 7.9 0 0 0 4.6 1.5V7.8a4.7 4.7 0 0 1-3.5-2z"/>',
  linkedin:'<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9.5 9h3.8v1.6h.1a4.2 4.2 0 0 1 3.8-2.1c4 0 4.8 2.6 4.8 6.1V21h-4v-5.5c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21h-4z"/>',
  x:'<path d="M17.5 3h3.1l-6.8 7.8L21.8 21h-6.2l-4.9-6.4L5.1 21H2l7.3-8.3L2.4 3h6.3l4.4 5.8zm-1.1 16.1h1.7L7.7 4.8H5.9z"/>',
  telegram:'<path d="M9.8 15.6 9.6 19c.4 0 .6-.2.8-.4l1.9-1.8 3.9 2.9c.7.4 1.2.2 1.4-.7l2.6-12c.2-1-.4-1.4-1-1.1L3.4 10.2c-1 .4-.9.9-.1 1.2l4.1 1.3 9.5-6c.4-.3.8-.1.5.2z"/>',
  steam:'<path d="M12 2a10 10 0 0 0-10 9.6l5.4 2.2a2.8 2.8 0 0 1 1.6-.5h.2l2.4-3.4v-.1a3.7 3.7 0 1 1 3.7 3.7h-.1l-3.4 2.4v.2a2.8 2.8 0 0 1-5.6.2l-3.8-1.6A10 10 0 1 0 12 2zm-3.3 15.2-1.2-.5a2.1 2.1 0 0 0 3.9-1.1 2.1 2.1 0 0 0-2.9-2l1.2.5a1.6 1.6 0 1 1-1 3.1zm6.6-4.7a2.5 2.5 0 1 1 2.5-2.5 2.5 2.5 0 0 1-2.5 2.5zm0-4.4a1.9 1.9 0 1 0 1.9 1.9 1.9 1.9 0 0 0-1.9-1.9z"/>',
  itch:'<path d="M3.1 3.6C2.2 4.2 1 5.7 1 6.4v1c0 1.3 1.2 2.4 2.3 2.4 1.3 0 2.4-1 2.4-2.3 0 1.2 1 2.3 2.3 2.3s2.3-1 2.3-2.3c0 1.2 1.1 2.3 2.4 2.3s2.4-1.1 2.4-2.3c0 1.2 1 2.3 2.3 2.3s2.3-1.1 2.3-2.3c0 1.2 1.1 2.3 2.4 2.3C22.8 9.8 24 8.7 24 7.4v-1c0-.7-1.2-2.2-2.1-2.8A81 81 0 0 0 3.1 3.6zm6.3 7.6a2.7 2.7 0 0 1-2.2 1.1 2.7 2.7 0 0 1-2.3-1.1 2.6 2.6 0 0 1-1.6 1c-.5 3-.7 6.4-.6 9.7a58 58 0 0 0 17.6 0c.1-3.3-.1-6.7-.6-9.7a2.6 2.6 0 0 1-1.6-1 2.7 2.7 0 0 1-2.3 1.1 2.7 2.7 0 0 1-2.2-1.1 2.7 2.7 0 0 1-2.1 1.1 2.7 2.7 0 0 1-2.1-1.1zm-.9 3.3h3v.1c.6 0 1.7 0 2.5 0v-.1h3c.6 0 .7.5.9 1.1l1 3.7c.2 1-.1 1-.7 1-.9 0-1.4-1-2.3-1-.9 0-1.7.5-2.6.5H9.9c-.9 0-1.7-.5-2.6-.5-.9 0-1.4 1-2.3 1-.6 0-.9 0-.7-1l1-3.7c.2-.6.3-1.1.9-1.1zm2.3 2.1v1.3H9.5v1.3h1.3v1.3h1.3v-1.3h1.3v-1.3h-1.3v-1.3z"/>',
  website:'<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm7 9h-3a15 15 0 0 0-1.2-5.4A8 8 0 0 1 19 11zM12 4c.8 1.1 1.7 3.4 1.9 7h-3.8C10.3 7.4 11.2 5.1 12 4zM9.2 5.6A15 15 0 0 0 8 11H5a8 8 0 0 1 4.2-5.4zM5 13h3a15 15 0 0 0 1.2 5.4A8 8 0 0 1 5 13zm7 7c-.8-1.1-1.7-3.4-1.9-7h3.8c-.2 3.6-1.1 5.9-1.9 7zm2.8-1.6A15 15 0 0 0 16 13h3a8 8 0 0 1-4.2 5.4z"/>',
  email:'<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.2-8 5-8-5V6l8 5 8-5z"/>',
  trailer:'<path d="M8 5v14l11-7z"/>',
  check:'<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>',
  pin:'<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/>',
  phone:'<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.2 1z"/>'
};

/* name must be a key of ICONS */
function icon(name, cls){
  const d = ICONS[name];
  if (!d) return "";
  return `<svg class="${cls||""}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${d}</svg>`;
}

/* Turns an entry's links object into icon buttons.
   Unknown keys fall back to a globe icon and the key as the label. */
function socialButtons(obj, opts){
  const o = opts || {};
  const out = [];
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (!v) return;
    const key = ICONS[k] ? k : "website";
    out.push(`<a class="soc${o.iconOnly ? " soc-icon" : ""}" href="${v}" target="_blank" rel="noopener"
        aria-label="${k}">${icon(key)}${o.iconOnly ? "" : "<span>" + k + "</span>"}</a>`);
  });
  return out.join("");
}

/* The four brand colours cycled for decorative use */
const BRAND_CYCLE = [BRAND.green, BRAND.red, BRAND.blue, BRAND.yellow];
