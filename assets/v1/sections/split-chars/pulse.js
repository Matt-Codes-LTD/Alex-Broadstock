// pulse.js
export function attachPulse(hostEl) {
  if (hostEl.__pulseBound) return;
  hostEl.__pulseBound = true;

  const pulse = () => {
    hostEl.setAttribute("data-animate-pulse", "1");
    clearTimeout(hostEl.__pulseTO);
    hostEl.__pulseTO = setTimeout(
      () => hostEl.removeAttribute("data-animate-pulse"),
      700
    );
  };

  hostEl.addEventListener("touchstart", pulse, { passive: true });
}
