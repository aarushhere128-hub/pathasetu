(function () {
  const scene = document.getElementById("bridge-scene");
  if (!scene) return;

  const chips = scene.querySelectorAll(".chip");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    scene.classList.add("settled");
    return;
  }

  // Scatter each chip to a random starting position before settling
  chips.forEach((chip) => {
    const x = (Math.random() - 0.5) * 260;
    const y = -(Math.random() * 120 + 40);
    const rotate = (Math.random() - 0.5) * 60;
    chip.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg)`;
  });

  // Let the browser paint the scattered state, then settle into the bridge
  requestAnimationFrame(() => {
    setTimeout(() => {
      scene.classList.add("settled");
    }, 250);
  });

  // Gentle parallax tilt on mouse move
  let frame = null;
  scene.addEventListener("mousemove", (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const rect = scene.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      scene.style.transform = `rotateX(${relY * -4}deg) rotateY(${relX * 6}deg)`;
      frame = null;
    });
  });

  scene.addEventListener("mouseleave", () => {
    scene.style.transform = "rotateX(0deg) rotateY(0deg)";
  });

  scene.style.transformStyle = "preserve-3d";
  scene.style.perspective = "800px";
})();
