import AgentRobotAvatar from '../agent-robot-avatar.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DESIGN = {
  'eye-size': [89, 40, 140],
  'arm-length': [100, 60, 140],
  'leg-length': [100, 60, 160],
  'arm-thickness': [20, 12, 44],
  'leg-thickness': [20, 12, 44],
};

// Reuse the upstream eye, action, gesture and lifecycle engine with BytezWork artwork.
class BytezWorkAvatar extends AgentRobotAvatar {
  static get observedAttributes() {
    return [...super.observedAttributes, ...Object.keys(DESIGN)];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (oldValue !== newValue && Object.hasOwn(DESIGN, name)) this._applyDesign();
  }

  _designValue(name) {
    const [fallback, min, max] = DESIGN[name];
    const raw = this.getAttribute(name);
    const value = raw === null || raw.trim() === '' ? fallback : Number(raw);
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  }

  _applyDesign() {
    if (!this._bytezEyeScales) return;
    const eyes = this._designValue('eye-size') / 100;
    this._bytezEyeScales.forEach((group, i) => {
      const x = i === 0 ? 86 : 154;
      const inward = i === 0 ? 4 : -4;
      group.setAttribute('transform', `translate(${inward} 0) translate(${x} 126) scale(${eyes * 0.62} ${eyes}) translate(${-x} -126)`);
    });
    const arms = this._designValue('arm-length') / 100;
    const legs = this._designValue('leg-length') / 100;
    // Length changes the curve only, so thickness stays independently adjustable.
    const paths = [
      [this._bytezLeftArm, [60, 140, -35, -5, -36, 33], arms, 'arm-thickness'],
      [this._bytezRightArm, [180, 140, 35, -5, 36, 33], arms, 'arm-thickness'],
      [this._bytezLeftLeg, [72, 165, -35, -3, -36, 35], legs, 'leg-thickness'],
      [this._bytezRightLeg, [168, 165, 35, -3, 36, 35], legs, 'leg-thickness'],
    ];
    this._bytezArmCurves = [];
    paths.forEach(([limb, [x, y, cx, cy, dx, dy], length, thickness], i) => {
      const curve = [x, y, x + cx * length, y + cy * length, x + dx * length, y + dy * length];
      if (i < 2) this._bytezArmCurves.push(curve);
      this._writeLimb(limb, curve, this._designValue(thickness));
    });
    this._poseHands(this._bytezHandBlend || 0);
  }

  _writeLimb(limb, [x, y, cx, cy, ex, ey], width) {
    const d = `M${x} ${y} Q${cx} ${cy} ${ex} ${ey}`;
    const body = limb.querySelector('.bytezLimbBody');
    body.setAttribute('d', d);
    body.setAttribute('stroke-width', width);
    const edge = limb.querySelector('.bytezLimbEdge');
    edge.setAttribute('d', d);
    edge.setAttribute('stroke-width', width + 2);
    const shine = limb.querySelector('.bytezLimbShine');
    shine.setAttribute('d', d);
    shine.setAttribute('transform', `translate(${-width * 0.24} ${-width * 0.12})`);
  }

  _poseHands(blend) {
    this._bytezHandBlend = blend;
    const parent = blend > 0 ? this._bytezHandsFront : this._bytezLimbs;
    const targets = [
      [60, 140, 65, 188, 105, 162],
      [180, 140, 175, 188, 135, 162],
    ];
    [this._bytezLeftArm, this._bytezRightArm].forEach((limb, i) => {
      if (limb.parentNode !== parent) parent.append(limb);
      const curve = this._bytezArmCurves[i].map((value, j) => value + (targets[i][j] - value) * blend);
      this._writeLimb(limb, curve, this._designValue('arm-thickness'));
    });
  }

  _renderShell() {
    super._renderShell();
    const svg = this.shadowRoot.querySelector('svg');
    svg.setAttribute('aria-label', 'Arañita de BytezWork');
    const style = document.createElement('style');
    style.textContent = ':host{--face-size:221px} #antennaDot{display:none!important} #bytezLimbs,#bytezHandsFront{pointer-events:none}';
    this.shadowRoot.append(style);

    // A sampled circle keeps the engine's elastic point-based deformation intact.
    this._baseHeadPoints = Array.from({ length: 96 }, (_, i) => {
      const angle = i * Math.PI * 2 / 96 - Math.PI / 2;
      return { x: 120 + 70 * Math.cos(angle), y: 118 + 76 * Math.sin(angle) };
    });
    this._baseHeadPathD = this._pointsToPath(this._baseHeadPoints);
    this._headShape.setAttribute('d', this._baseHeadPathD);
    this._headFlattenedR32 = true;

    const finishes = document.createElementNS(SVG_NS, 'defs');
    finishes.innerHTML = `
      <clipPath id="bytezEyeSafeClip">
        <use href="#headShape" transform="translate(24 23.72) scale(.8)"/>
      </clipPath>
    `;
    svg.prepend(finishes);
    // A smaller, concentric eye area keeps a visible margin in every expression.
    // It follows the same head shape when the avatar stretches.
    this._leftEye.parentNode.setAttribute('clip-path', 'url(#bytezEyeSafeClip)');
    // Keep the oval eyes white and flat through every expression.
    [this._leftBase, this._rightBase, this._leftInputBase, this._rightInputBase].forEach(eye => {
      eye.setAttribute('fill', '#fff');
      eye.removeAttribute('filter');
    });
    const limbs = document.createElementNS(SVG_NS, 'g');
    limbs.id = 'bytezLimbs';
    limbs.innerHTML = `
      <g id="bytezLeftArm"><path d="M60 140 Q25 135 24 173" fill="none" stroke="#08090b" stroke-width="20" stroke-linecap="round"/></g>
      <g id="bytezRightArm"><path d="M180 140 Q215 135 216 173" fill="none" stroke="#08090b" stroke-width="20" stroke-linecap="round"/></g>
      <g id="bytezLeftLeg"><path d="M72 165 Q37 162 36 200" fill="none" stroke="#08090b" stroke-width="20" stroke-linecap="round"/></g>
      <g id="bytezRightLeg"><path d="M168 165 Q203 162 204 200" fill="none" stroke="#08090b" stroke-width="20" stroke-linecap="round"/></g>
    `;
    limbs.querySelectorAll('path').forEach(body => {
      body.classList.add('bytezLimbBody');
      const edge = body.cloneNode();
      edge.classList.replace('bytezLimbBody', 'bytezLimbEdge');
      edge.setAttribute('stroke', '#fff');
      edge.setAttribute('stroke-opacity', '.12');
      body.before(edge);
      const shine = body.cloneNode();
      shine.classList.replace('bytezLimbBody', 'bytezLimbShine');
      shine.setAttribute('stroke', '#fff');
      shine.setAttribute('stroke-opacity', '.08');
      shine.setAttribute('stroke-width', '3');
      body.after(shine);
    });
    this._headMotion.prepend(limbs);
    this._bytezHandsFront = document.createElementNS(SVG_NS, 'g');
    this._bytezHandsFront.id = 'bytezHandsFront';
    this._headMotion.append(this._bytezHandsFront);
    this._bytezLimbs = limbs;
    this._bytezLeftArm = this.shadowRoot.getElementById('bytezLeftArm');
    this._bytezRightArm = this.shadowRoot.getElementById('bytezRightArm');
    this._bytezLeftLeg = this.shadowRoot.getElementById('bytezLeftLeg');
    this._bytezRightLeg = this.shadowRoot.getElementById('bytezRightLeg');
    // Separate wrappers let the engine animate each eye without overwriting its chosen size.
    this._bytezEyeScales = [this._leftEye, this._rightEye].map((eye, i) => {
      const group = document.createElementNS(SVG_NS, 'g');
      group.id = i === 0 ? 'bytezLeftEyeSize' : 'bytezRightEyeSize';
      eye.parentNode.insertBefore(group, eye);
      group.append(eye);
      return group;
    });
    this._applyColor(this.getAttribute('color'));
    this._applyDesign();
  }

  _applyColor(value) {
    super._applyColor(value);
    const color = this._head?.getAttribute('fill') || '#08090b';
    this.shadowRoot?.querySelectorAll('.bytezLimbBody').forEach(path => path.setAttribute('stroke', color));
  }

  _updateHeadFollow(now, dt) {
    const pose = this._headFollowPose;
    const velocity = this._headFollowVel;
    velocity.x = velocity.y = velocity.rot = 0;
    if (this._isReducedMotion?.()) {
      pose.x = pose.y = pose.rot = 0;
      this._headFollow?.setAttribute('transform', '');
      return;
    }
    const fresh = now - this._pointer.lastMove < 900;
    const canFollow = fresh && this._pointer.active && (this._pointer.influence || 0) > 0.03
      && !this._dragJelly.active && !this._dragJelly.returning && !this._sleeping
      && !this._boredRoutine && now >= (this._headCenteringUntil || 0) && !this._expressionLock;
    const clamp = value => Math.max(-1, Math.min(1, value));
    const x = canFollow ? clamp(this._pointer.x / 48) : 0;
    const y = canFollow ? clamp(this._pointer.y / 34) : 0;
    // A small range and exponential easing avoid the original spring's abrupt tilt.
    const mix = 1 - Math.exp(-Math.max(0, Math.min(dt, 34)) / 220);
    const targets = { x: x * 1.8, y: y * 1.8, rot: x * y * 2.2 };
    for (const key of ['x', 'y', 'rot']) {
      pose[key] += (targets[key] - pose[key]) * mix;
      if (!canFollow && Math.abs(pose[key]) < 0.01) pose[key] = 0;
    }
    this._headFollow?.setAttribute('transform',
      `translate(${pose.x.toFixed(2)} ${pose.y.toFixed(2)}) translate(120 120) rotate(${pose.rot.toFixed(2)}) translate(-120 -120)`);
  }

  _draw(now) {
    super._draw(now);
    if (!this._bytezLeftArm) return;
    const still = this._isReducedMotion?.() || this._sleeping;
    const thinking = Boolean(this._inspectFx) && !this._sleeping;
    const working = Boolean(this._waitingFx || this._state === 'input');
    const celebrating = this._state === 'happy';
    const amplitude = still ? 0 : thinking ? 1.2 : celebrating ? 9 : working ? 6 : 2;
    const phase = now / (thinking ? 900 : working || celebrating ? 210 : 850);
    const swing = Math.sin(phase) * amplitude;
    let handBlend = 0;
    if (thinking) {
      const elapsed = Math.max(0, now - this._inspectFx.start);
      const remaining = Math.max(0, this._inspectFx.duration - elapsed);
      const t = still ? 1 : Math.min(1, elapsed / 420, remaining / 360);
      handBlend = t * t * (3 - 2 * t);
    }
    this._poseHands(handBlend);
    this._bytezLeftArm.setAttribute('transform', `rotate(${swing.toFixed(2)} 60 140)`);
    this._bytezRightArm.setAttribute('transform', `rotate(${(-swing).toFixed(2)} 180 140)`);

    // Tiny alternating steps, with no separate animation loop or timers.
    const legSwing = swing * 0.6;
    const lift = still ? 0 : (working || celebrating ? 2 : 0.5);
    const leftLift = -Math.max(0, Math.sin(phase)) * lift;
    const rightLift = -Math.max(0, -Math.sin(phase)) * lift;
    this._bytezLeftLeg.setAttribute('transform',
      `translate(0 ${leftLift.toFixed(2)}) rotate(${legSwing.toFixed(2)} 72 165)`);
    this._bytezRightLeg.setAttribute('transform',
      `translate(0 ${rightLift.toFixed(2)}) rotate(${(-legSwing).toFixed(2)} 168 165)`);
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('bytezwork-avatar')) {
  customElements.define('bytezwork-avatar', BytezWorkAvatar);
}

export { BytezWorkAvatar };
export default BytezWorkAvatar;
