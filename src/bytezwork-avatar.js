import AgentRobotAvatar from '../agent-robot-avatar.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Reuse the upstream eye, action, gesture and lifecycle engine with BytezWork artwork.
class BytezWorkAvatar extends AgentRobotAvatar {
  _renderShell() {
    super._renderShell();
    const svg = this.shadowRoot.querySelector('svg');
    svg.setAttribute('aria-label', 'Arañita constructora de BytezWork');
    const style = document.createElement('style');
    style.textContent = '#antennaDot{display:none!important} #bytezCostume,#bytezLimbs{pointer-events:none}';
    this.shadowRoot.append(style);

    // A sampled circle keeps the engine's elastic point-based deformation intact.
    this._baseHeadPoints = Array.from({ length: 96 }, (_, i) => {
      const angle = i * Math.PI * 2 / 96 - Math.PI / 2;
      return { x: 120 + 80 * Math.cos(angle), y: 134 + 80 * Math.sin(angle) };
    });
    this._baseHeadPathD = this._pointsToPath(this._baseHeadPoints);
    this._headShape.setAttribute('d', this._baseHeadPathD);
    this._headFlattenedR32 = true;

    const limbs = document.createElementNS(SVG_NS, 'g');
    limbs.id = 'bytezLimbs';
    limbs.innerHTML = `
      <g id="bytezLeftArm"><path d="M60 154 Q29 155 29 178" fill="none" stroke="#08090b" stroke-width="32" stroke-linecap="round"/></g>
      <g id="bytezRightArm"><path d="M180 154 Q211 155 211 178" fill="none" stroke="#08090b" stroke-width="32" stroke-linecap="round"/></g>
      <g id="bytezLeftLeg"><path d="M88 195 Q82 201 82 207" fill="none" stroke="#08090b" stroke-width="32" stroke-linecap="round"/></g>
      <g id="bytezRightLeg"><path d="M152 195 Q158 201 158 207" fill="none" stroke="#08090b" stroke-width="32" stroke-linecap="round"/></g>
    `;
    this._headMotion.prepend(limbs);
    const costume = document.createElementNS(SVG_NS, 'g');
    costume.id = 'bytezCostume';
    costume.innerHTML = `
      <path d="M57 179 Q120 195 183 179" fill="none" stroke="#999" stroke-width="10" stroke-linecap="round"/>
      <rect x="109" y="181" width="22" height="19" rx="4" fill="#fff"/>
      <rect x="115" y="186" width="10" height="9" rx="1" fill="#666"/>
      <g id="bytezHelmet" transform="translate(120 82) scale(0.90) translate(-120 -82)">
        <path d="M44 74 Q48 24 98 20 Q120 8 142 20 Q192 24 196 74" fill="#fff" stroke="#08090b" stroke-width="6" stroke-linecap="round"/>
        <path d="M54 69 Q57 42 74 34 L78 63 Z M166 34 Q184 43 187 69 L162 63 Z" fill="#e6e6e6"/>
        <path d="M97 22 L103 57 M143 22 L137 57" fill="none" stroke="#08090b" stroke-width="6" stroke-linecap="round"/>
        <path d="M43 68 Q120 52 197 68 Q212 72 205 83 Q199 90 193 88 Q120 72 47 88 Q33 89 34 79 Q34 72 43 68 Z" fill="#fff" stroke="#08090b" stroke-width="6" stroke-linejoin="round"/>
        <path d="M50 87 Q120 73 190 87" fill="none" stroke="#333" stroke-width="7" stroke-linecap="round"/>
      </g>
    `;
    this._headMotion.append(costume);
    this._bytezLimbs = limbs;
    this._bytezLeftArm = this.shadowRoot.getElementById('bytezLeftArm');
    this._bytezRightArm = this.shadowRoot.getElementById('bytezRightArm');
    this._bytezLeftLeg = this.shadowRoot.getElementById('bytezLeftLeg');
    this._bytezRightLeg = this.shadowRoot.getElementById('bytezRightLeg');
    this._applyColor(this.getAttribute('color'));
  }

  _applyColor(value) {
    super._applyColor(value);
    const color = this._head?.getAttribute('fill') || '#08090b';
    this._bytezLimbs?.querySelectorAll('path').forEach(path => path.setAttribute('stroke', color));
  }

  _draw(now) {
    super._draw(now);
    if (!this._bytezLeftArm) return;
    const still = this._isReducedMotion?.() || this._sleeping;
    const working = Boolean(this._waitingFx || this._state === 'input' || this._inspectFx);
    const celebrating = this._state === 'happy';
    const amplitude = still ? 0 : celebrating ? 9 : working ? 6 : 2;
    const phase = now / (working || celebrating ? 210 : 850);
    const swing = Math.sin(phase) * amplitude;
    this._bytezLeftArm.setAttribute('transform', `rotate(${swing.toFixed(2)} 60 154)`);
    this._bytezRightArm.setAttribute('transform', `rotate(${(-swing).toFixed(2)} 180 154)`);

    // Tiny alternating steps, with no separate animation loop or timers.
    const legSwing = swing * 0.6;
    const lift = still ? 0 : (working || celebrating ? 2 : 0.5);
    const leftLift = -Math.max(0, Math.sin(phase)) * lift;
    const rightLift = -Math.max(0, -Math.sin(phase)) * lift;
    this._bytezLeftLeg.setAttribute('transform',
      `translate(0 ${leftLift.toFixed(2)}) rotate(${legSwing.toFixed(2)} 88 195)`);
    this._bytezRightLeg.setAttribute('transform',
      `translate(0 ${rightLift.toFixed(2)}) rotate(${(-legSwing).toFixed(2)} 152 195)`);
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('bytezwork-avatar')) {
  customElements.define('bytezwork-avatar', BytezWorkAvatar);
}

export { BytezWorkAvatar };
export default BytezWorkAvatar;
