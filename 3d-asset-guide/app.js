const guide = window.GUIDE_CONTENT;
const stepsRoot = document.querySelector('#steps');
const railNav = document.querySelector('#rail-nav');
const labels = { must: '一定要做', notice: '需要注意', dont: '不要做' };

guide.forEach((step, stepIndex) => {
  const stepNumber = String(stepIndex + 1).padStart(2, '0');
  const article = document.createElement('article');
  article.className = 'step';
  article.id = `step-${stepIndex + 1}`;
  article.innerHTML = `
    <div class="step-head">
      <div class="step-number"><span>STEP</span><strong>${stepNumber}</strong></div>
      <div class="step-title"><h3>${step.title}</h3><p>${step.intro}</p></div>
    </div>
    <div class="rules"></div>`;

  const rules = article.querySelector('.rules');
  ['must', 'notice', 'dont'].forEach(kind => {
    const group = document.createElement('section');
    group.className = 'rule-group';
    group.dataset.kind = kind;
    const cards = step[kind].map(([title, body], itemIndex) => `
      <article class="rule-card">
        <span>${stepNumber}.${String(itemIndex + 1).padStart(2, '0')}</span>
        <h4>${title}</h4>
        <p>${body}</p>
      </article>`).join('');
    group.innerHTML = `<h4 class="group-label">${labels[kind]}</h4><div class="rule-cards">${cards}</div>`;
    rules.appendChild(group);
  });
  stepsRoot.appendChild(article);

  const li = document.createElement('li');
  li.innerHTML = `<a href="#step-${stepIndex + 1}" aria-label="第 ${stepIndex + 1} 步：${step.title}">${stepNumber}</a>`;
  railNav.appendChild(li);
});

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(item => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.rule-group').forEach(group => {
      group.hidden = filter !== 'all' && group.dataset.kind !== filter;
    });
  });
});

const checkRoot = document.querySelector('#check-list');
window.FINAL_CHECKS.forEach((text, index) => {
  const label = document.createElement('label');
  label.className = 'check-item';
  label.innerHTML = `<input type="checkbox" aria-label="${text}"><span><b>${String(index + 1).padStart(2, '0')}</b>　${text}</span>`;
  checkRoot.appendChild(label);
});

function updateChecklist() {
  const checks = [...checkRoot.querySelectorAll('input')];
  const done = checks.filter(item => item.checked).length;
  document.querySelector('#check-count').textContent = `${done} / ${checks.length}`;
  document.querySelector('#check-progress').style.width = `${done / checks.length * 100}%`;
  document.querySelector('#check-message').textContent = done === checks.length
    ? '可以交给组员了。'
    : done === 0 ? '从第一项开始检查' : `还剩 ${checks.length - done} 项`;
}
checkRoot.addEventListener('change', updateChecklist);

const stepElements = [...document.querySelectorAll('.step')];
const railLinks = [...document.querySelectorAll('#rail-nav a')];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const index = stepElements.indexOf(entry.target);
    railLinks.forEach((link, i) => link.classList.toggle('is-active', i === index));
  });
}, { rootMargin: '-35% 0px -55% 0px' });
stepElements.forEach(step => observer.observe(step));

function updateScrollProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = available > 0 ? window.scrollY / available : 0;
  document.querySelector('#rail-progress').style.height = `${Math.min(1, ratio) * 100}%`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

function makeWireframe(canvas, options = {}) {
  const context = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;

  const points = [];
  let randomState = options.reverse ? 9187 : 4219;
  const random = () => {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState / 4294967296;
  };

  function addEllipsoid(center, radii, count, group) {
    for (let i = 0; i < count; i += 1) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const roughness = .9 + random() * .2;
      points.push({
        x: center[0] + Math.sin(phi) * Math.cos(theta) * radii[0] * roughness,
        y: center[1] + Math.cos(phi) * radii[1] * roughness,
        z: center[2] + Math.sin(phi) * Math.sin(theta) * radii[2] * roughness,
        seed: random() * Math.PI * 2,
        group
      });
    }
  }

  function addLimb(start, end, startRadius, endRadius, count, group) {
    const direction = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
    const length = Math.hypot(...direction);
    const axis = direction.map(value => value / length);
    const helper = Math.abs(axis[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
    let side = [
      axis[1] * helper[2] - axis[2] * helper[1],
      axis[2] * helper[0] - axis[0] * helper[2],
      axis[0] * helper[1] - axis[1] * helper[0]
    ];
    const sideLength = Math.hypot(...side);
    side = side.map(value => value / sideLength);
    const up = [
      axis[1] * side[2] - axis[2] * side[1],
      axis[2] * side[0] - axis[0] * side[2],
      axis[0] * side[1] - axis[1] * side[0]
    ];

    for (let i = 0; i < count; i += 1) {
      const t = random();
      const angle = random() * Math.PI * 2;
      const radius = (startRadius + (endRadius - startRadius) * t) * (.88 + random() * .24);
      points.push({
        x: start[0] + direction[0] * t + (side[0] * Math.cos(angle) + up[0] * Math.sin(angle)) * radius,
        y: start[1] + direction[1] * t + (side[1] * Math.cos(angle) + up[1] * Math.sin(angle)) * radius,
        z: start[2] + direction[2] * t + (side[2] * Math.cos(angle) + up[2] * Math.sin(angle)) * radius,
        seed: random() * Math.PI * 2,
        group
      });
    }
  }

  // Each body part has its own volume. Dense short connections keep the
  // scribbled-line character while preserving a readable human silhouette.
  addEllipsoid([0, -2.45, 0], [.47, .58, .43], 92, 'head');
  addLimb([0, -1.95, 0], [0, -1.62, 0], .2, .23, 26, 'neck');
  addEllipsoid([0, -.9, 0], [.76, .92, .43], 168, 'torso');
  addEllipsoid([0, .05, 0], [.59, .47, .4], 78, 'pelvis');

  addLimb([-.58, -1.35, 0], [-1.08, -.38, .05], .24, .2, 62, 'left-upper-arm');
  addEllipsoid([-1.08, -.38, .05], [.24, .24, .22], 24, 'left-elbow');
  addLimb([-1.08, -.38, .05], [-.86, .72, .08], .19, .13, 58, 'left-forearm');
  addEllipsoid([-.83, .91, .08], [.22, .37, .16], 34, 'left-hand');

  addLimb([.58, -1.35, 0], [1.2, -.9, .04], .24, .19, 60, 'right-upper-arm');
  addEllipsoid([1.2, -.9, .04], [.23, .23, .21], 22, 'right-elbow');
  addLimb([1.2, -.9, .04], [1.72, -1.42, .08], .18, .12, 54, 'right-forearm');
  addEllipsoid([1.89, -1.58, .08], [.34, .2, .14], 32, 'right-hand');

  addLimb([-.31, .32, 0], [-.5, 1.48, .03], .33, .23, 74, 'left-thigh');
  addEllipsoid([-.5, 1.48, .03], [.28, .25, .25], 24, 'left-knee');
  addLimb([-.5, 1.48, .03], [-.73, 2.58, .05], .22, .14, 68, 'left-calf');
  addEllipsoid([-.83, 2.75, -.08], [.42, .18, .27], 34, 'left-foot');

  addLimb([.31, .32, 0], [.5, 1.48, -.03], .33, .23, 74, 'right-thigh');
  addEllipsoid([.5, 1.48, -.03], [.28, .25, .25], 24, 'right-knee');
  addLimb([.5, 1.48, -.03], [.74, 2.58, -.05], .22, .14, 68, 'right-calf');
  addEllipsoid([.86, 2.75, -.08], [.42, .18, .27], 34, 'right-foot');

  const edges = [];
  points.forEach((point, i) => {
    const neighbors = points
      .map((other, j) => ({ j, d: Math.hypot(point.x - other.x, point.y - other.y, point.z - other.z) }))
      .filter(item => item.j !== i && item.d < .82 && (points[item.j].group === point.group || item.d < .3))
      .sort((a, b) => a.d - b.d)
      .slice(0, 9);
    neighbors.forEach(item => { if (item.j > i) edges.push([i, item.j]); });
  });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function project(point, time) {
    const angle = (options.reverse ? -.22 : .18) + time * .00008 + pointerX * .00015;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const wave = Math.sin(time * .00055 + point.seed) * .035;
    const x = (point.x + wave) * cos - point.z * sin;
    const z = (point.x + wave) * sin + point.z * cos;
    const compact = width < 700;
    const anchorX = compact && options.mobileX !== undefined ? options.mobileX : (options.x || .68);
    const anchorY = compact && options.mobileY !== undefined ? options.mobileY : (options.y || .5);
    const scaleValue = compact && options.mobileScale !== undefined ? options.mobileScale : (options.scale || .155);
    const scale = Math.min(width, height) * scaleValue * (1 + z * .035);
    return {
      x: width * anchorX + x * scale + pointerX * .012,
      y: height * anchorY + point.y * scale + pointerY * .008
    };
  }

  function draw(time = 0) {
    context.clearRect(0, 0, width, height);
    const projected = points.map(point => project(point, time));
    context.lineWidth = .56;
    context.strokeStyle = options.color || 'rgba(8, 8, 8, .42)';
    context.beginPath();
    edges.forEach(([a, b]) => {
      context.moveTo(projected[a].x, projected[a].y);
      context.lineTo(projected[b].x, projected[b].y);
    });
    context.stroke();
    context.fillStyle = options.dotColor || 'rgba(8, 8, 8, .3)';
    projected.forEach((point, index) => {
      if (index % 9) return;
      context.beginPath();
      context.arc(point.x, point.y, .8, 0, Math.PI * 2);
      context.fill();
    });
    if (!reduceMotion) frame = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(); });
  window.addEventListener('pointermove', event => {
    pointerX = event.clientX - width / 2;
    pointerY = event.clientY - height / 2;
  }, { passive: true });
  resize();
  draw();
  return () => cancelAnimationFrame(frame);
}

makeWireframe(document.querySelector('#wireframe'), {
  x: .75,
  y: .53,
  scale: .145,
  mobileX: .77,
  mobileY: .68,
  mobileScale: .13
});
makeWireframe(document.querySelector('#closing-wireframe'), { x: .77, y: .52, scale: .13, reverse: true, color: 'rgba(8,8,8,.26)' });
