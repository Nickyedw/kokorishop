// src/components/KokoriIntro.jsx
import React from 'react';
import { motion } from 'framer-motion';
void motion;

import PandaImg from '../assets/kokori_panda.png';
import MonkeyImg from '../assets/kokori_mono.png';

const ease  = 'easeInOut';
const layer = 'select-none drop-shadow-xl will-change-transform';

/* -------- breakpoint helper -------- */
function useBreakpoint() {
  const get = () => {
    const w = window.innerWidth;
    if (w >= 1280) return 'xl';
    if (w >= 1024) return 'lg';
    if (w >= 640)  return 'md';
    return 'sm';
  };
  const [bp, setBp] = React.useState(typeof window !== 'undefined' ? get() : 'md');
  React.useEffect(() => {
    const onR = () => setBp(get());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return bp;
}

/* -------- ambientals -------- */
function HeartBurst({ className = '', delay = 0 }) {
  return (
    <motion.span
      className={`absolute text-pink-400/95 drop-shadow ${className}`}
      initial={{ scale: 0.7, opacity: 0.85, y: 0 }}
      animate={{ scale: [0.7, 1.15, 1.6], opacity: [0.85, 0.7, 0], y: [-4, -10, -16] }}
      transition={{ delay, duration: 1.6, repeat: Infinity, repeatDelay: 0.6, ease }}
      aria-hidden
    >
      💖
    </motion.span>
  );
}
function Twinkle({ className = '', delay = 0 }) {
  return (
    <motion.span
      className={`absolute text-yellow-300 drop-shadow ${className}`}
      initial={{ opacity: 0.6, scale: 0.9, rotate: -10 }}
      animate={{ opacity: [0.6, 1, 0.75, 1], scale: [0.9, 1.1, 1, 1.08], rotate: [-10, 5, -4, 4] }}
      transition={{ delay, duration: 1.4, repeat: Infinity, ease }}
      aria-hidden
    >
      ✨
    </motion.span>
  );
}

/* -------- defaults & helpers -------- */
const DEF = {
  // reducimos gaps por defecto en móvil para que no tapen el wordmark
  panda:  {
    sm: { gap: 64,  y:  0, scale: .95 },
    md: { gap: 90,  y:  0, scale: 1   },
    lg: { gap: 150, y: -4, scale: 1   },
    xl: { gap: 170, y: -4, scale: 1   },
  },
  monkey: {
    sm: { gap: 64,  y:  0, scale: .95 },
    md: { gap: 90,  y:  0, scale: 1   },
    lg: { gap: 150, y:  0, scale: 1   },
    xl: { gap: 170, y:  0, scale: 1   },
  },
};
const DEF_SIZES = { sm: 120, md: 150, lg: 175, xl: 175 }; // ancho personaje por bp

const mergePerillas = (def, user) => ({
  sm: { ...def.sm, ...(user?.sm || {}) },
  md: { ...def.md, ...(user?.md || {}) },
  lg: { ...def.lg, ...(user?.lg || {}) },
  xl: { ...def.xl, ...(user?.xl || {}) },
});
const pickByBp = (conf, bp) => conf[bp] || conf.lg || conf.md || conf.sm;
const pickTitleY = (titleY, bp) => {
  if (typeof titleY === 'number') return titleY;
  if (titleY && typeof titleY === 'object') {
    return titleY[bp] ?? titleY.lg ?? titleY.md ?? titleY.sm ?? 0;
  }
  return 0;
};

/* -------- componente -------- */
export default function KokoriIntro({
  // ahora puedes pasar un objeto para el size por breakpoint
  sizeByBp,                            // { sm, md, lg, xl }
  title = 'KokoriShop',
  // el título usa clamp para escalar: min 22px, preferencia 7.5vw, máx 40px
  titleClass = 'text-[clamp(22px,7.5vw,40px)] font-extrabold',
  panda, monkey,                       // perillas opcionales
  titleY = 0,                          // número o { sm, md, lg, xl }
  forceBp, debug,
}) {
  const bpDetected = useBreakpoint();
  const bp = forceBp || bpDetected;

  const Pconf = mergePerillas(DEF.panda, panda);
  const Mconf = mergePerillas(DEF.monkey, monkey);
  const P = pickByBp(Pconf, bp);
  const M = pickByBp(Mconf, bp);

  // tamaño por breakpoint (si no pasas sizeByBp, uso DEF_SIZES)
  const SIZES = { ...DEF_SIZES, ...(sizeByBp || {}) };
  const size = SIZES[bp] ?? SIZES.lg;

  const PX = size + (P.gap ?? 0);
  const MX = size + (M.gap ?? 0);
  const TY = pickTitleY(titleY, bp);

  if (debug) {
    // eslint-disable-next-line no-console
    console.log('[KokoriIntro]', { bp, size, P, M, TY });
  }

  const anchor = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <div style={anchor} className="relative">
        {/* PANDA */}
        <motion.img
          src={PandaImg}
          alt="Panda"
          className={layer}
          style={{ width: size, height: 'auto', position: 'absolute' }}
          initial={{ x: -260, y: 30, rotate: -8, opacity: 0, scale: P.scale }}
          animate={{ x: -PX, y: P.y ?? 0, scale: P.scale ?? 1, rotate: [-8,-4,-2,0,2,0], opacity: 1 }}
          transition={{ duration: 1.0, ease }}
        />
        {/* MONO */}
        <motion.img
          src={MonkeyImg}
          alt="Mono"
          className={layer}
          style={{ width: size, height: 'auto', position: 'absolute', zIndex: 2 }}
          initial={{ x: 240, y: -16, rotate: 8, opacity: 0, scale: M.scale }}
          animate={{ x: MX, y: M.y ?? 0, scale: M.scale ?? 1, rotate: [8,4,2,0,-2,0], opacity: 1 }}
          transition={{ delay: 0.05, duration: 1.0, ease }}
        />

        {/* Wordmark con placa, escalado con clamp y padding responsive */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{ transform: `translateY(${TY}px)`, zIndex: 1 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.45, ease }}
        >
          <div className="px-2.5 py-0.5 sm:px-4 sm:py-1 rounded-lg sm:rounded-xl bg-black/35 backdrop-blur-sm ring-1 ring-white/10">
            <h1 className={`${titleClass} bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-rose-300 to-fuchsia-300 drop-shadow-[0_2px_6px_rgba(0,0,0,.35)]`}>
              {title}
            </h1>
          </div>
        </motion.div>

        {/* micro pulso + tilt */}
        <motion.div className="absolute inset-0" initial={{ scale: 1 }} animate={{ scale: [1,1.06,1] }} transition={{ delay: 1.1, duration: 0.45, ease }} />
        <motion.div className="absolute inset-0" initial={{ rotate: 0 }} animate={{ rotate: [0,1.6,-1.6,0] }} transition={{ delay: 1.35, duration: 0.6, ease }} />

        {/* ambientals */}
        {/* Ambientales alrededor */}
        <HeartBurst className="koko-ambient -left-8 -top-6" delay={1.1} />
        <HeartBurst className="koko-ambient -right-8 -top-6" delay={1.3} />
        <HeartBurst className="koko-ambient -left-12 top-4" delay={1.5} />
        <HeartBurst className="koko-ambient -right-12 top-4" delay={1.65} />
        <Twinkle    className="koko-ambient -left-16 -top-7" delay={0.9} />
        <Twinkle    className="koko-ambient -right-16 -top-8" delay={1.2} />
        <Twinkle    className="koko-ambient left-1/2 -translate-x-1/2 -top-10" delay={1.05} />

      </div>
    </div>
  );
}
