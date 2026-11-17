/* Vivi face/rig stability patch v5.
   Does not touch chat, AI, memory, or speech JavaScript. */
(() => {
  'use strict';
  const css = document.createElement('style');
  css.id = 'vivi-stability-v5';
  css.textContent = `
    #vincent.figure { overflow: visible !important; }
    #vivi-rig.vivi-rig-v28 {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      transform: none !important;
      overflow: visible !important;
      isolation: isolate !important;
    }
    /* Old floating face overlays are based on incompatible coordinates. */
    #vivi-rig.vivi-rig-v28 .rig-face-mouth,
    #vivi-rig.vivi-rig-v28 .rig-mouth,
    #vivi-rig.vivi-rig-v28 .rig-eyes,
    #vivi-rig.vivi-rig-v28 .v28-eyelid,
    #vivi-rig.vivi-rig-v28 .vivi-blink-layer { display: none !important; }
    /* Prevent extra legacy SVG/illustration from appearing beside the rig. */
    #vincent.figure > svg { opacity: 0 !important; pointer-events: none !important; }
    /* The existing independent sprite images keep their own animations. */
    @media (prefers-reduced-motion: reduce) {
      #vivi-rig.vivi-rig-v28 .v28-part { transition: none !important; }
    }
  `;
  document.head.appendChild(css);
  // Warn in console if the backing image is absent; never remove other features.
  const rig = document.getElementById('vivi-rig');
  const backing = rig?.querySelector('.v28-base');
  if (backing) backing.addEventListener('error', () =>
    console.warn('Vivi: rig-backing.png fehlt oder konnte nicht geladen werden.'));
})();
