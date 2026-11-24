(() => {
  const canvas = document.querySelector("#tensor-canvas");
  if (!canvas || !canvas.parentElement) return;

  const hero = canvas.parentElement;
  const context = canvas.getContext("2d");
  if (!context) return;
  const palette = ["#008f8c", "#4f9d69", "#e85d4f", "#c58a00"];

  const nodeLayer = document.createElement("div");
  nodeLayer.className = "tensor-nodes";
  nodeLayer.setAttribute("aria-hidden", "true");
  canvas.insertAdjacentElement("afterend", nodeLayer);

  const phases = [];
  for (let i = 0; i < 125; i += 1) {
    phases.push(-(Math.random() * 4.5).toFixed(2));
  }

  let resizeRafId = null;
  let isVisible = true;

  function updatePauseState() {
    nodeLayer.classList.toggle("is-paused", !isVisible || document.hidden);
  }

  function render() {
    const heroRect = hero.getBoundingClientRect();
    const heroWidth = heroRect.width;
    const heroHeight = heroRect.height;
    if (!heroWidth || !heroHeight) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    const centerX = heroWidth * 0.68;
    const centerY = heroHeight * 0.47;
    const depth = Math.min(heroWidth, heroHeight) * 0.12;
    const gap = Math.min(heroWidth, heroHeight) * 0.09;

    const nodes = [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let idx = 0;

    for (let z = -2; z <= 2; z += 1) {
      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) {
          const projectionX = centerX + x * gap + z * depth;
          const projectionY = centerY + y * gap - z * depth * 0.54;
          const active = (x + y + z + 6) % 4 === 0 || (x === 0 && y === 0);
          const color = palette[Math.abs(x + y * 2 + z * 3) % palette.length];
          nodes.push({
            x: projectionX,
            y: projectionY,
            z,
            active,
            color,
            delay: phases[idx],
          });
          idx += 1;

          if (projectionX < minX) minX = projectionX;
          if (projectionY < minY) minY = projectionY;
          if (projectionX > maxX) maxX = projectionX;
          if (projectionY > maxY) maxY = projectionY;
        }
      }
    }

    // Crop static canvas tightly to the lattice bounding box
    const pad = 12;
    const offsetX = Math.max(0, Math.floor(minX - pad));
    const offsetY = Math.max(0, Math.floor(minY - pad));
    const boxWidth = Math.max(1, Math.min(heroWidth - offsetX, Math.ceil(maxX + pad) - offsetX));
    const boxHeight = Math.max(1, Math.min(heroHeight - offsetY, Math.ceil(maxY + pad) - offsetY));

    canvas.style.left = `${offsetX}px`;
    canvas.style.top = `${offsetY}px`;
    canvas.style.right = "auto";
    canvas.style.bottom = "auto";
    canvas.style.width = `${boxWidth}px`;
    canvas.style.height = `${boxHeight}px`;

    canvas.width = Math.max(1, Math.floor(boxWidth * ratio));
    canvas.height = Math.max(1, Math.floor(boxHeight * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Draw all static edges (deduplicated & batched) + static inactive nodes once
    context.clearRect(0, 0, boxWidth, boxHeight);
    context.lineWidth = 1.25;

    const activeEdges = new Path2D();
    const inactiveEdges = new Path2D();

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        const horizontal = dx < 2 && dy < 120;
        const diagonal = dx < 95 && dy < 55 && a.z !== b.z;
        if (!horizontal && !diagonal) continue;
        if (dx * dx + dy * dy > 115 * 115) continue;

        const targetPath = a.active && b.active ? activeEdges : inactiveEdges;
        targetPath.moveTo(a.x - offsetX, a.y - offsetY);
        targetPath.lineTo(b.x - offsetX, b.y - offsetY);
      }
    }

    context.strokeStyle = "rgba(23, 32, 42, 0.13)";
    context.stroke(inactiveEdges);

    context.strokeStyle = "rgba(0, 143, 140, 0.42)";
    context.stroke(activeEdges);

    context.beginPath();
    context.fillStyle = "rgba(23, 32, 42, 0.28)";
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (!node.active) {
        const lx = node.x - offsetX;
        const ly = node.y - offsetY;
        context.moveTo(lx + 2.4, ly);
        context.arc(lx, ly, 2.4, 0, Math.PI * 2);
      } else {
        const el = document.createElement("span");
        el.className = "tensor-node";
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
        el.style.backgroundColor = node.color;
        el.style.animationDelay = `${node.delay}s`;
        fragment.appendChild(el);
      }
    }
    context.fill();

    nodeLayer.replaceChildren(fragment);
  }

  window.addEventListener("resize", () => {
    if (resizeRafId !== null) return;
    resizeRafId = window.requestAnimationFrame(() => {
      resizeRafId = null;
      render();
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        updatePauseState();
      },
      { threshold: 0 }
    );
    observer.observe(canvas);
  }

  document.addEventListener("visibilitychange", updatePauseState);

  render();
  updatePauseState();
})();
