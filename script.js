document.addEventListener('DOMContentLoaded', () => {
    // --------------------------
    // Contact Button Copy to Clipboard (UNCHANGED)
    // --------------------------
    const contactButtons = document.querySelectorAll('.contact-button');

    contactButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const contactValue = button.dataset.contact;

            if (button.classList.contains('copied')) return;

            try {
                await navigator.clipboard.writeText(contactValue);
                button.classList.add('copied');
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 1500);
            } catch (err) {
                alert('Could not copy automatically. Please copy manually: ' + contactValue);
            }
        });
    });

    // --------------------------
    // Intersection Observer for General Reveal (UNCHANGED)
    // --------------------------
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Unobserve for general sections to run animation once
                // Services section is handled by its own scroll logic (now fixed-step)
                if (entry.target.id !== 'services') {
                    observer.unobserve(entry.target);
                }
            }
        });
    }, { threshold: 0.1 });

    // Observe all main sections with the general section observer
    document.querySelectorAll('#contact, #hero-right, #tools').forEach(el => sectionObserver.observe(el));


    // --------------------------
    // About Section Stagger Reveal (DesignCube-like) (UNCHANGED)
    // --------------------------
    const aboutSection = document.getElementById('about');
    const revealStaggerParent = aboutSection ? aboutSection.querySelector('.profile-card-wrapper.reveal-stagger-parent') : null;
    const revealStaggerChildren = revealStaggerParent ? revealStaggerParent.querySelectorAll('.reveal-stagger') : [];

    if (revealStaggerParent && revealStaggerChildren.length > 0) {
        const staggerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    revealStaggerChildren.forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('revealed');
                        }, index * 200); // 0.2s stagger delay
                    });
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, { threshold: 0.1 });

        staggerObserver.observe(revealStaggerParent);
    } else {
        if (aboutSection) aboutSection.classList.add('revealed');
    }
    if (aboutSection) sectionObserver.observe(aboutSection);


    // --------------------------
    // Services Cube Animation (NEW LOGIC)
    // --------------------------
    const servicesSection = document.getElementById('services');
    const wrapper = servicesSection?.querySelector('.services-content-wrapper');
    const container = servicesSection?.querySelector('.services-items-container');
    const items = Array.from(container?.querySelectorAll('.service-item') || []); // Ensure items are array-like
    const bgNumber = servicesSection?.querySelector('.service-bg-number');

    // Basic existence check for core elements
    if (!wrapper || !container || items.length === 0 || !bgNumber) {
        console.warn("Services cube: required elements missing or no items found. Skipping animation setup.");
        // Ensure section itself still reveals if animation is skipped
        if (servicesSection) servicesSection.classList.add('revealed');
        return;
    }

    let activeIndex = 0;
    let isAnimating = false;

    // Create the scroll spacer if it's not already there (used for overall page length)
    let scrollSpacer = servicesSection.querySelector('.services-section-scroll-spacer');
    if (!scrollSpacer) {
        scrollSpacer = document.createElement('div');
        scrollSpacer.classList.add('services-section-scroll-spacer');
        servicesSection.appendChild(scrollSpacer);
    }

    // Function to set CSS variables based on layout
    function adjustLayout() {
        const wrapperHeight = wrapper.offsetHeight;
        if (wrapperHeight === 0) {
             console.warn("services-content-wrapper has 0 height. Cannot calculate faceZ. Check CSS 'height' for .services-content-wrapper.");
             // Set a default for --faceZ to prevent CSS errors, animation won't work well without height
             servicesSection.style.setProperty('--faceZ', `-150px`);
             return;
        }
        const faceZ = -(wrapperHeight / 2);
        servicesSection.style.setProperty('--faceZ', `${faceZ}px`);

        // Adjust overall page scroll length based on number of items
        const servicesHeadingHeight = servicesSection.querySelector('.services-heading')?.offsetHeight || 0;
        const gapBetweenHeadingAndWrapper = 50; // Based on margin-bottom on heading in CSS
        const totalVisibleStickyHeight = servicesHeadingHeight + gapBetweenHeadingAndWrapper + wrapperHeight;
        let stickyTopH2 = (window.innerHeight - totalVisibleStickyHeight) / 2;
        stickyTopH2 = Math.max(0, stickyTopH2);
        let stickyTopWrapper = stickyTopH2 + servicesHeadingHeight + gapBetweenHeadingAndWrapper;

        servicesSection.style.setProperty('--services-sticky-top-h2', `${stickyTopH2}px`);
        servicesSection.style.setProperty('--services-sticky-top-wrapper', `${stickyTopWrapper}px`);

        // Provide enough scroll space for the section to be fully interactable
        const estimatedScrollPerItem = window.innerHeight * 1.5; // More generous scroll per item
        scrollSpacer.style.height = `${items.length * estimatedScrollPerItem}px`;
    }

    // Function to apply class names for parked states
    function layoutFaces() {
        items.forEach((item, index) => {
            item.className = 'service-item'; // Reset all classes first
            item.classList.remove('active-content'); // Remove active-content class

            if (index === activeIndex) {
                item.classList.add('front', 'active-content'); // Add active-content to the front item
            } else if (index === (activeIndex + 1) % items.length) { // Below active (for scrolling down)
                item.classList.add('below');
            } else if (index === (activeIndex - 1 + items.length) % items.length) { // Above active (for scrolling up)
                item.classList.add('above');
            } else { // All other items, set to a hidden state (either above or below depending on index)
                if (index < activeIndex) { // Item is before activeIndex
                    item.classList.add('above');
                } else { // Item is after activeIndex
                    item.classList.add('below');
                }
            }
        });
        updateBgNumber(); // Update number after classes are set
    }

    // Update the background number text
    function updateBgNumber() {
        const displayIndex = activeIndex + 1;
        bgNumber.textContent = displayIndex < 10 ? `0${displayIndex}` : `${displayIndex}`;
    }

    // Main function to initiate a transition between steps
    function goToIndex(newIndex, directionName) { // directionName: 'up' (for next) or 'down' (for previous)
        if (isAnimating || newIndex === activeIndex) return; // Ignore if animating or no change
        isAnimating = true;

        const current = items[activeIndex];
        const next = items[newIndex];

        // Apply animation classes
        if (directionName === 'up') { // User scrolled down, next item comes from below
            current.classList.replace('front', 'exit-to-top'); // Current moves up and out
            next.classList.replace('below', 'enter-from-bottom'); // Next moves up and in
        } else { // User scrolled up, previous item comes from above
            current.classList.replace('front', 'exit-to-bottom'); // Current moves down and out
            next.classList.replace('above', 'enter-from-top'); // Next moves down and in
        }

        // After animation duration, update activeIndex and reset classes
        setTimeout(() => {
            activeIndex = newIndex;
            layoutFaces(); // This call will reset classes to 'front', 'above', 'below' based on new activeIndex
            isAnimating = false;
        }, 800); // This duration (800ms) must match the CSS 'transition' duration for transform/opacity on .service-item
    }

    // Generic step function to determine target index and direction
    // Returns true if animation starts, false if at boundary and should allow page scroll
    function step(direction) { // direction: 'up' (for next item, scrolling down) or 'down' (for previous item, scrolling up)
        let newIndex;
        if (direction === 'up') { // User scrolls down (moves to next index)
            newIndex = activeIndex + 1;
        } else { // direction === 'down', User scrolls up (moves to previous index)
            newIndex = activeIndex - 1;
        }

        // Check if attempting to scroll past the actual boundaries of the items array
        const atStartBoundary = activeIndex === 0 && direction === 'down';
        const atEndBoundary = activeIndex === items.length - 1 && direction === 'up';

        if (atStartBoundary || atEndBoundary) {
            return false; // Signal to allow default browser scroll
        }

        // Clamp index to valid range (should ideally not be needed if boundary check is correct)
        newIndex = Math.max(0, Math.min(items.length - 1, newIndex));

        // If index hasn't actually changed after clamping (e.g., trying to scroll past end of items, but not section boundary)
        if (newIndex === activeIndex) {
            return true; // Still prevent default, as we're not allowing page scroll yet
        }

        goToIndex(newIndex, direction);
        return true; // Signal that animation started, prevent default browser scroll
    }

    // --- Event Handlers for Navigation ---
    let scrollAccum = 0; // Accumulate scroll delta for mouse wheel sensitivity
    let touchStartY = null; // For touch swipe detection

    // Initial setup logic
    setTimeout(() => {
        adjustLayout(); // Calculate and set CSS variables, spacer height
        layoutFaces(); // Set initial class states for all items
        // Ensure the services section itself gets the 'revealed' class for its general observer.
        sectionObserver.observe(servicesSection);
    }, 500); // Increased delay to 500ms for robust layout calculation

    // Recalculate layout and reset state on window resize
    window.addEventListener('resize', () => {
        adjustLayout();
        // Reset animation state to ensure correct positioning on resize
        isAnimating = false; // Allow animations after resize
        // Re-apply classes to ensure correct visual state based on new dimensions
        layoutFaces();
    });

    // Wheel event listener for desktop scrolling
    window.addEventListener('wheel', (e) => {
        // Only engage if the services section is substantially visible on screen
        const servicesRect = servicesSection.getBoundingClientRect();
        const isServicesMainlyVisible = servicesRect.top < window.innerHeight * 0.75 && servicesRect.bottom > window.innerHeight * 0.25;

        if (!isServicesMainlyVisible) {
            return; // Don't interfere with scroll if section is largely out of view
        }

        // If an animation is active, prevent default and do nothing else.
        if (isAnimating) {
            e.preventDefault();
            return;
        }

        // Accumulate scroll delta
        scrollAccum += e.deltaY;
        const scrollThreshold = 50; // Pixels needed to trigger a step

        let directionToStep = 0; // 1 for down, -1 for up
        if (scrollAccum > scrollThreshold) {
            directionToStep = 1; // User scrolled down
            scrollAccum = 0; // Reset accumulator
        } else if (scrollAccum < -scrollThreshold) {
            directionToStep = -1; // User scrolled up
            scrollAccum = 0; // Reset accumulator
        }

        if (directionToStep !== 0) {
            // Attempt to step. If step() returns true, it means an internal animation will occur.
            if (step(directionToStep === 1 ? 'up' : 'down')) { // 'up' for next item, 'down' for previous
                e.preventDefault(); // Prevent default browser scroll as we're handling it
            }
        } else {
             // Not enough scroll for a step, and not animating.
             // Here, we decide if we still want to prevent default for minor wheel movements
             // or let them contribute to overall page scroll if we're near the edges.
             const atStartBoundary = activeIndex === 0 && e.deltaY < 0;
             const atEndBoundary = activeIndex === items.length - 1 && e.deltaY > 0;
             if (!(atStartBoundary || atEndBoundary)) {
                 e.preventDefault(); // Prevent default if we're inside the section and not at a main exit boundary
             }
        }
    }, { passive: false }); // passive: false is critical for preventDefault()


    // Touch event listeners for mobile swipe
    window.addEventListener('touchstart', (e) => {
        const servicesRect = servicesSection.getBoundingClientRect();
        // Only start tracking touch if it's potentially within the services section's interactive area
        if (e.touches.length === 1 && servicesRect.top < window.innerHeight && servicesRect.bottom > 0) {
            touchStartY = e.touches[0].clientY;
        } else {
            touchStartY = null; // Ignore multi-touch or touches outside section
        }
    }, { passive: false });

    // Touchmove can potentially prevent default, but touchend usually triggers the step.
    // PreventDefault in touchmove for stepped scrolling can make the page feel "stuck" if not enough swipe occurs.
    // It's safer to let touchend decide.
    // Removed touchmove preventDefault unless a very specific pattern is required.

    window.addEventListener('touchend', (e) => {
        if (touchStartY === null || isAnimating) return; // If no touch started or animating, ignore

        const diff = touchStartY - e.changedTouches[0].clientY; // Positive if swiped up (for next item), negative if swiped down (for previous)
        const swipeThreshold = 40; // Pixels needed for a meaningful swipe

        if (Math.abs(diff) > swipeThreshold) {
            const direction = diff > 0 ? 'up' : 'down'; // 'up' for next item, 'down' for previous

            // Attempt to step; step() returns true if animation initiated, false if at boundary/no change
            if (step(direction)) {
                e.preventDefault(); // Prevent default only if an animation was triggered
            }
        }
        touchStartY = null; // Reset for next swipe
    }, { passive: false });

    // Keyboard support for navigation (for testing/accessibility)
    window.addEventListener('keydown', (e) => {
        const servicesRect = servicesSection.getBoundingClientRect();
        const isServicesMainlyVisible = servicesRect.top < window.innerHeight * 0.75 && servicesRect.bottom > window.innerHeight * 0.25;

        if (!isServicesMainlyVisible) return; // Only trigger if section is visible

        if (isAnimating) {
            if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) {
                e.preventDefault(); // Prevent default if animating and key is related to scroll
            }
            return;
        }

        let handled = false;
        if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
            if (step('up')) { // Try to move to next item
                handled = true;
            }
        } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
            if (step('down')) { // Try to move to previous item
                handled = true;
            }
        }

        if (handled) {
            e.preventDefault(); // Prevent default only if an animation was triggered
        }
    });

});

// ===== Mosaic Background Drawing =====
(() => {
  const canvas = document.getElementById('mosaic-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  const SETTINGS = {
    targetStonesPerMP: 420,
    minStone: 16,
    maxStone: 40,
    groutWidth: 2.2,
    groutColor: 'rgba(18,18,18,0.95)',
    baseDarkA: '#0a0a0a',
    baseDarkB: '#181818',
    accentChance: 0.18,
    accentTints: [
      [8, 16, 22],
      [18, 12, 22],
      [10, 20, 16],
      [20, 16, 10],
    ],
    highlightOpacity: 0.18,
    highlightSize: 0.65,
    polygonMinSides: 6,
    polygonMaxSides: 10,
    jitter: 0.24,
    overlapAttempts: 24,
    noiseOpacity: 0.035,
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const randint = (a, b) => Math.floor(rand(a, b + 1));
  const lerp = (a, b, t) => a + (b - a) * t;

  const px = v => v * devicePixelRatio;

  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.round(window.innerWidth);
    const h = Math.round(window.innerHeight);

    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function generateStones(width, height) {
    const areaMP = (width * height) / 1_000_000;
    const targetCount = Math.round(areaMP * SETTINGS.targetStonesPerMP);
    const stones = [];
    let guard = targetCount * 30;

    while (stones.length < targetCount && guard-- > 0) {
      const r = rand(SETTINGS.minStone, SETTINGS.maxStone);
      const x = rand(r + 8, width - r - 8);
      const y = rand(r + 8, height - r - 8);

      let ok = true;
      for (let i = 0; i < stones.length; i++) {
        const s = stones[i];
        const dx = x - s.x;
        const dy = y - s.y;
        const d2 = dx * dx + dy * dy;
        const minDist = (r + s.r) * 0.9;
        if (d2 < minDist * minDist) { ok = false; break; }
      }
      if (!ok) continue;

      stones.push({ x, y, r, sides: randint(SETTINGS.polygonMinSides, SETTINGS.polygonMaxSides) });
    }
    return stones;
  }

  function stonePath(ctx, cx, cy, baseR, sides) {
    const angleStep = (Math.PI * 2) / sides;
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = i * angleStep + rand(-0.08, 0.08);
      const jitter = 1 + rand(-SETTINGS.jitter, SETTINGS.jitter);
      const r = baseR * jitter * lerp(0.88, 1.06, Math.random());
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }

    const radius = Math.max(2, baseR * 0.18);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[(i - 1 + pts.length) % pts.length];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];

      const v01x = p1.x - p0.x, v01y = p1.y - p0.y;
      const v12x = p2.x - p1.x, v12y = p2.y - p1.y;
      const len01 = Math.hypot(v01x, v01y);
      const len12 = Math.hypot(v12x, v12y);
      const nx1 = p1.x - (v01x / len01) * radius;
      const ny1 = p1.y - (v01y / len01) * radius;
      const nx2 = p1.x + (v12x / len12) * radius;
      const ny2 = p1.y + (v12y / len12) * radius;

      if (i === 0) ctx.moveTo(nx1, ny1);
      else ctx.lineTo(nx1, ny1);
      ctx.quadraticCurveTo(p1.x, p1.y, nx2, ny2);
    }
    ctx.closePath();
  }

  function fillStone(ctx, cx, cy, r) {
    const angle = rand(-Math.PI, Math.PI);
    const dx = Math.cos(angle) * r * 1.2;
    const dy = Math.sin(angle) * r * 1.2;

    const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    grad.addColorStop(0, SETTINGS.baseDarkA);
    grad.addColorStop(1, SETTINGS.baseDarkB);

    ctx.save();
    ctx.fillStyle = grad;
    ctx.fill();

    if (Math.random() < SETTINGS.accentChance) {
      const [tr, tg, tb] = SETTINGS.accentTints[Math.floor(Math.random() * SETTINGS.accentTints.length)];
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = `rgb(${tr},${tg},${tb})`;
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = SETTINGS.highlightOpacity;
    const h = ctx.createRadialGradient(cx - dx * 0.25, cy - dy * 0.25, 0, cx, cy, r * SETTINGS.highlightSize);
    h.addColorStop(0.0, 'rgba(255,255,255,0.7)');
    h.addColorStop(0.4, 'rgba(255,255,255,0.08)');
    h.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = h;
    ctx.fill();

    ctx.restore();
  }

  function drawNoise(ctx, w, h) {
    const density = Math.round((w * h) / 700);
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = SETTINGS.noiseOpacity;
    for (let i = 0; i < density; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const s = Math.random() * 1.5 + 0.2;
      ctx.fillStyle = `rgba(${rand(200,255)},${rand(200,255)},${rand(200,255)},${rand(0.02,0.06)})`;
      ctx.fillRect(x, y, s, s);
    }
    ctx.restore();
  }

  function render() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#000');
    bgGrad.addColorStop(1, '#050505');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const stones = generateStones(w, h);

    ctx.lineWidth = SETTINGS.groutWidth;
    ctx.strokeStyle = SETTINGS.groutColor;

    for (const s of stones) {
      stonePath(ctx, s.x, s.y, s.r, s.sides);
      fillStone(ctx, s.x, s.y, s.r);
      ctx.stroke();
    }

    drawNoise(ctx, w, h);
  }

  let resizeRAF = null;
  function onResize() {
    if (resizeRAF) cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(() => {
      resizeCanvas();
      render();
      resizeRAF = null;
    });
  }

  resizeCanvas();
  render();
  window.addEventListener('resize', onResize, { passive: true });

  window.__mosaic = {
    redraw() { render(); },
    settings: SETTINGS
  };
})();

/* ===== JS for the mosaic background only ===== */
(() => {
  const cfg = {
    cell: 24,                 // grid size in px (tweak 22–28 to match taste)
    baseAlpha: 0.035,         // faint base grid line alpha
    brightAlphaMin: 0.18,     // min alpha of highlighted segments
    brightAlphaMax: 0.35,     // max alpha of highlighted segments
    hueBase: 220,             // cool steel-blue
    hueJitter: 12,            // subtle per-segment hue variance
    lineWidth: 1,             // 1px crisp lines
    walkers: 380,             // how many “step” paths to carve
    minSteps: 6,              // min steps per walker
    maxSteps: 28,             // max steps per walker
    turnProb: 0.33,           // chance to turn left/right
    shadowBlur: 1.5,          // soft halo for highlighted lines
    gradientOpacity: 0.5,     // ~50% overlay only on brightest segments
    gradientSpeed: 0.035      // speed of the subtle color drift
  };

  const wrapper = document.getElementById('lux-mosaic-bg');
  const canvas  = document.getElementById('lux-mosaic-canvas');
  if (!wrapper || !canvas) return;
  const ctx     = canvas.getContext('2d');

  // Offscreen canvases: mask = bright segments; overlay = moving gradient
  const maskCanvas = document.createElement('canvas');
  const maskCtx    = maskCanvas.getContext('2d');
  const overlay    = document.createElement('canvas');
  const octx       = overlay.getContext('2d');

  // Edge stores
  let cols=0, rows=0, W=0, H=0, dpr=1;
  const V = new Map();  // vertical edges: key "v_i_j" -> brightness 0..1
  const HZ = new Map(); // horizontal edges: key "h_i_j" -> brightness 0..1

  // RNG (deterministic-ish but not fixed)
  const rand = (() => {
    let s = (Date.now() % 2147483647);
    return () => (s = (s*48271)%2147483647)/2147483647;
  })();

  function keyV(i,j){ return `v_${i}_${j}`; }   // column i, segment j
  function keyH(i,j){ return `h_${i}_${j}`; }   // row j, segment i

  function resize(){
    dpr = Math.max(1, window.devicePixelRatio || 1);
    W = wrapper.clientWidth;
    H = wrapper.clientHeight;

    [canvas, maskCanvas, overlay].forEach(c=>{
      c.width = Math.floor(W*dpr);
      c.height= Math.floor(H*dpr);
      c.style.width = W+'px';
      c.style.height= H+'px';
    });

    [ctx, maskCtx, octx].forEach(c=>{
      c.setTransform(dpr,0,0,dpr,0,0);
      c.imageSmoothingEnabled = false;
    });

    cols = Math.ceil(W / cfg.cell);
    rows = Math.ceil(H / cfg.cell);

    buildPattern();
    render(0);
  }

  function buildPattern(){
    V.clear(); HZ.clear();

    // Carve “stepped” polylines on grid using random walkers
    const walkers = cfg.walkers;
    for(let w=0; w<walkers; w++){
      let x = Math.floor(rand()*cols);
      let y = Math.floor(rand()*rows);
      let dir = (rand()*4)|0; // 0:R,1:D,2:L,3:U
      const steps = cfg.minSteps + ((cfg.maxSteps-cfg.minSteps)*rand()|0);
      let brightness = cfg.brightAlphaMin + (cfg.brightAlphaMax-cfg.brightAlphaMin)*rand();

      for(let s=0; s<steps; s++){
        // clamp bounds
        x = Math.max(0, Math.min(cols-1, x));
        y = Math.max(0, Math.min(rows-1, y));

        // register edge by direction (edge sits between cell and neighbor)
        if(dir===0){   // right
          const k = keyV(x+1, y);
          V.set(k, Math.max(V.get(k)||0, brightness));
          x++;
        }else if(dir===1){ // down
          const k = keyH(x, y+1);
          HZ.set(k, Math.max(HZ.get(k)||0, brightness));
          y++;
        }else if(dir===2){ // left
          const k = keyV(x, y);
          V.set(k, Math.max(V.get(k)||0, brightness));
          x--;
        }else{            // up
          const k = keyH(x, y);
          HZ.set(k, Math.max(HZ.get(k)||0, brightness));
          y--;
        }

        // random turn to create right-angle “steps”
        if(rand() < cfg.turnProb){
          dir = (dir + (rand()<0.5 ? 1 : 3)) & 3; // left or right turn
        }
      }
    }

    drawStatic();
    drawMask(); // white mask of bright segments for gradient overlay
  }

  function drawStatic(){
    // clear
    ctx.clearRect(0,0,W,H);

    // 1) base faint full grid
    ctx.save();
    ctx.lineWidth = cfg.lineWidth;
    ctx.strokeStyle = `rgba(255,255,255,${cfg.baseAlpha})`;
    ctx.beginPath();

    // pixel-aligned lines: 0.5 offset for crisp 1px strokes
    const offset = 0.5;
    for(let i=0;i<=cols;i++){
      const x = Math.round(i*cfg.cell)+offset;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for(let j=0;j<=rows;j++){
      const y = Math.round(j*cfg.cell)+offset;
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
    ctx.restore();

    // 2) highlighted segments (cool steel with tiny hue jitter)
    ctx.save();
    ctx.lineCap = 'square';
    ctx.lineWidth = cfg.lineWidth;
    ctx.shadowBlur = cfg.shadowBlur;
    for(const [k,a] of V){
      const [, i, j] = k.split('_').map(Number);
      const x = Math.round(i*cfg.cell) + 0.5;
      const y1= Math.round(j*cfg.cell) + 0.5;
      const y2= Math.round((j+1)*cfg.cell) + 0.5;
      const hue = cfg.hueBase + (rand()*2-1)*cfg.hueJitter;
      ctx.shadowColor = `hsla(${hue},20%,70%,${a*0.9})`;
      ctx.strokeStyle  = `hsla(${hue},12%,80%,${a})`;
      ctx.beginPath(); ctx.moveTo(x,y1); ctx.lineTo(x,y2); ctx.stroke();
    }
    for(const [k,a] of HZ){
      const [, i, j] = k.split('_').map(Number);
      const y = Math.round(j*cfg.cell) + 0.5;
      const x1= Math.round(i*cfg.cell) + 0.5;
      const x2= Math.round((i+1)*cfg.cell) + 0.5;
      const hue = cfg.hueBase + (rand()*2-1)*cfg.hueJitter;
      ctx.shadowColor = `hsla(${hue},20%,70%,${a*0.9})`;
      ctx.strokeStyle  = `hsla(${hue},12%,80%,${a})`;
      ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawMask(){
    // white mask where bright segments exist (used to clip gradient overlay)
    maskCtx.clearRect(0,0,W,H);
    maskCtx.save();
    maskCtx.lineWidth = cfg.lineWidth;
    maskCtx.strokeStyle = 'rgba(255,255,255,1)';
    maskCtx.lineCap = 'square';

    for(const k of V.keys()){
      const [, i, j] = k.split('_').map(Number);
      const x = Math.round(i*cfg.cell) + 0.5;
      const y1= Math.round(j*cfg.cell) + 0.5;
      const y2= Math.round((j+1)*cfg.cell) + 0.5;
      maskCtx.beginPath(); maskCtx.moveTo(x,y1); maskCtx.lineTo(x,y2); maskCtx.stroke();
    }
    for(const k of HZ.keys()){
      const [, i, j] = k.split('_').map(Number);
      const y = Math.round(j*cfg.cell) + 0.5;
      const x1= Math.round(i*cfg.cell) + 0.5;
      const x2= Math.round((i+1)*cfg.cell) + 0.5;
      maskCtx.beginPath(); maskCtx.moveTo(x1,y); maskCtx.lineTo(x2,y); maskCtx.stroke();
    }
    maskCtx.restore();
  }

  function render(t){
    // redraw static grid (already drawn once) + animated subtle gradient only on bright segments
    // repaint static every few frames to keep halos sharp on high-dpi
    // (cheap; everything is vector)
    drawStatic();

    // build a moving soft gradient
    octx.clearRect(0,0,W,H);
    const phase = (t*cfg.gradientSpeed)%1;
    const xoff = (phase-0.5)*W*0.8;         // slow drift
    const g = octx.createLinearGradient(xoff, 0, W+xoff, H);
    g.addColorStop(0.00, 'rgba(238,119,82,0.30)');   // #ee7752
    g.addColorStop(0.25, 'rgba(231,60,126,0.28)');   // #e73c7e
    g.addColorStop(0.50, 'rgba(35,166,213,0.30)');   // #23a6d5
    g.addColorStop(0.75, 'rgba(35,213,171,0.28)');   // #23d5ab
    g.addColorStop(1.00, 'rgba(224,248,130,0.26)');  // #E0F882
    octx.fillStyle = g;
    octx.globalAlpha = cfg.gradientOpacity; // ~50%
    octx.fillRect(0,0,W,H);

    // keep gradient only where mask (bright segments) exists
    octx.globalCompositeOperation = 'destination-in';
    octx.drawImage(maskCanvas, 0, 0);
    octx.globalCompositeOperation = 'source-over';

    // blend onto main canvas with additive light
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(overlay, 0, 0);
    ctx.restore();

    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize, {passive:true});
  resize();
})();