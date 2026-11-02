/** Shared, keyboard-operable tabs. All panel content remains in the document. */
export function setupTabs(selector, onSelect) {
  const buttons = [...document.querySelectorAll(selector)];
  if (!buttons.length) return;
  function select(index, focus = false) {
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    const current = buttons[index];
    const panel = document.getElementById(current.getAttribute('aria-controls'));
    panel.setAttribute('aria-labelledby', current.id);
    onSelect(index);
    if (focus) current.focus();
  }
  buttons.forEach((button, i) => {
    button.addEventListener('click', () => select(i));
    button.addEventListener('keydown', event => {
      const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
        (i + direction + buttons.length) % buttons.length;
      select(next, true);
    });
  });
  select(0);
}

const resources = [
  ['THE CROP / THE CARE', 'More of the harvest, valued.', 'The aim is to help more produce remain marketable. The actual loss reduction will need to be measured crop by crop.'],
  ['THE WATER / THE WORK', 'Resources already invested.', 'Growing a crop uses water and agricultural inputs. Preventing avoidable losses could preserve more of that investment. Water savings have not been quantified.'],
  ['THE ENERGY / THE WHOLE SYSTEM', 'Account for every part.', 'Passive heat absorption is one part of the picture. Monitoring, PCM recharge and transport must also be included before making energy or emissions claims.'],
];
const notebook = [
  ['START WITH THE SYSTEM', 'Bring the pieces together.', 'CAD lets the team study how the shell, insulation and internal components relate before refining the physical prototype.'],
  ['LOOK BETWEEN THE LAYERS', 'Every interface matters.', 'The exploded view separates the physical components. Materials, seals, containment and assembly all influence the behaviour of the complete crate.'],
  ['ASK WHAT THE TEST SHOULD SHOW', 'A drawing is a beginning.', 'The next step is repeatable thermal and usability testing. This illustration shows a research concept, not simulated or measured performance data.'],
];

// Equal-length cubic paths let supporting browsers interpolate the original SVG.
function curvedPath(points, tension = .16) {
  const n = points.length;
  let path = `M${points[0].join(' ')}`;
  for (let i = 0; i < n; i++) {
    const before = points[(i + n - 1) % n], from = points[i];
    const to = points[(i + 1) % n], after = points[(i + 2) % n];
    const a = [from[0] + (to[0] - before[0]) * tension, from[1] + (to[1] - before[1]) * tension];
    const b = [to[0] - (after[0] - from[0]) * tension, to[1] - (after[1] - from[1]) * tension];
    path += `C${a.join(' ')} ${b.join(' ')} ${to.join(' ')}`;
  }
  return path + 'Z';
}
const resourcePaths = [
  [[140,35],[208,39],[245,105],[229,176],[171,231],[100,239],[39,183],[45,104]],
  [[140,25],[178,82],[225,140],[228,193],[187,239],[126,248],[69,197],[74,131]],
  [[163,20],[60,148],[123,148],[92,256],[218,100],[160,100],[188,20],[175,20]],
].map((points, i) => curvedPath(points, i === 2 ? .025 : .16));

export function installMotion(motion) {
  const root = document.documentElement;
  const ready = () => root.classList.add('motion-ready');
  if (!document.querySelector('.splash:not(.leaving)')) ready();
  else document.addEventListener('evacrate:intro', ready, {once: true});

  // CSS animations sleep outside the viewport and in a hidden browser tab.
  const animatedRegions = document.querySelectorAll('.home-hero,.page-hero,.harvest-story,.manifesto,.resource-garden,.closing,.feature-triptych,.crop-art,.collab-orbit');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('animation-sleep', !entry.isIntersecting));
    }, {rootMargin: '100px'});
    animatedRegions.forEach(region => observer.observe(region));
  }
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('animation-suspended', document.hidden);
  });

  const header = document.querySelector('.site-header');
  const chapters = [...document.querySelectorAll('[data-story-chapter]')];
  const stage = document.querySelector('.journey-stage');
  const stageModel = stage?.querySelector('[data-scene]');
  let queued = 0, active = -1, previousProgress = -1;
  function measure() {
    queued = 0;
    header.classList.toggle('is-scrolled', scrollY > 160);
    if (!stage || !chapters.length) return;
    const anchor = innerHeight * (innerWidth <= 760 ? .84 : .55);
    const centers = chapters.map(chapter => {
      const rect = chapter.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    let progress = 0;
    for (let i = 0; i < centers.length - 1; i++) {
      if (anchor >= centers[i]) progress = i + Math.min(1, (anchor - centers[i]) / Math.max(1, centers[i + 1] - centers[i]));
    }
    const next = Math.min(chapters.length - 1, Math.round(progress));
    if (next !== active) {
      active = next;
      stage.dataset.chapter = String(next);
      document.querySelector('.journey-scene-word').textContent = chapters[next].dataset.word;
      document.querySelector('#journey-note').textContent = chapters[next].dataset.note;
      document.querySelector('#journey-number').textContent = String(next + 1).padStart(2, '0');
      document.querySelectorAll('[data-story-link]').forEach((link, i) => {
        if (i === next) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    }
    if (Math.abs(progress - previousProgress) > .005) {
      previousProgress = progress;
      stageModel.dispatchEvent(new CustomEvent('evacrate:pose', {detail: {progress}}));
    }
  }
  const queue = () => { if (!queued) queued = requestAnimationFrame(measure); };
  addEventListener('scroll', queue, {passive: true});
  addEventListener('resize', queue);
  addEventListener('pageshow', queue);
  measure();

  // Gentle pointer depth is restricted to decorative surfaces and fine pointers.
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const surfaces = [...document.querySelectorAll('.feature-panel,.spec-sheet,.news-art,.affiliation-note')];
  const resetSurfaces = () => surfaces.forEach(element => element.style.removeProperty('transform'));
  surfaces.forEach(element => {
    let pointerFrame = 0;
    element.addEventListener('pointermove', event => {
      if (!finePointer.matches || motion.paused || event.pointerType !== 'mouse') return;
      if (pointerFrame) return;
      const x = event.clientX, y = event.clientY;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const rect = element.getBoundingClientRect();
        const rx = Math.max(-1, Math.min(1, (x - rect.left) / rect.width - .5));
        const ry = Math.max(-1, Math.min(1, (y - rect.top) / rect.height - .5));
        element.style.transform = `perspective(1000px) rotateX(${-ry * 5}deg) rotateY(${rx * 6}deg) translateY(-3px)`;
      });
    });
    element.addEventListener('pointerleave', () => {
      cancelAnimationFrame(pointerFrame); pointerFrame = 0;
      element.style.removeProperty('transform');
    });
  });
  document.addEventListener('evacrate:motion', () => { resetSurfaces(); previousProgress = -1; queue(); });

  setupTabs('[data-resource]', index => {
    const [kicker, title, copy] = resources[index];
    document.querySelector('#resource-kicker').textContent = kicker;
    document.querySelector('#resource-title').textContent = title;
    document.querySelector('#resource-copy').textContent = copy;
    document.querySelector('.resource-sculpture').dataset.resourceShape = String(index);
    document.querySelector('.resource-morph').setAttribute('d', resourcePaths[index]);
  });
  setupTabs('[data-lab]', index => {
    const [kicker, title, copy] = notebook[index];
    document.querySelector('#lab-kicker').textContent = kicker;
    document.querySelector('#lab-heading').textContent = title;
    document.querySelector('#lab-copy').textContent = copy;
    document.querySelector('.notebook-visual').dataset.labView = String(index);
  });

  const reel = document.querySelector('.chapter-reel');
  if (reel) {
    const controls = [...document.querySelectorAll('[data-reel-step]')];
    const syncControls = () => controls.forEach(button => {
      button.disabled = Number(button.dataset.reelStep) < 0 ? reel.scrollLeft <= 2 :
        reel.scrollLeft + reel.clientWidth >= reel.scrollWidth - 2;
    });
    controls.forEach(button => button.addEventListener('click', () => {
      reel.scrollBy({left: Number(button.dataset.reelStep) * reel.clientWidth * .72, behavior: motion.paused ? 'instant' : 'smooth'});
    }));
    reel.addEventListener('scroll', syncControls, {passive: true});
    addEventListener('resize', syncControls);
    syncControls();
  }
}
