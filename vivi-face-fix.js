/* Conservative face fix: avoid duplicated floating eye/mouth overlays.
   Original source art and AI functionality are left unchanged. */
(()=>{'use strict';const css=document.createElement('style');css.textContent=`
#vivi-rig.vivi-rig-v28 .rig-face-mouth {display:none!important}
#vivi-rig.vivi-rig-v28 .v28-eyelid {display:none!important}
#vivi-rig.vivi-rig-v28 .rig-eyes {display:none!important}
#vivi-rig.vivi-rig-v28 .rig-mouth {display:none!important}
#vivi-rig.vivi-rig-v28 .vivi-blink-layer {display:none!important}
`;document.head.append(css);
})();