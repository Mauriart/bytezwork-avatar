import { expect, test } from '@playwright/test';

test('flat eyes and gentle cursor follow stay stable on direction changes', async ({ page }) => {
  await page.goto('/demo/bytezwork.html');
  const avatar = page.locator('bytezwork-avatar');
  await expect(avatar).toHaveCSS('filter', 'none');
  const result = await avatar.evaluate(el => {
    el.setAttribute('motion', 'full');
    el._headFollowPose = { x: 0, y: 0, rot: 0 };
    el._headFollowVel = { x: 0, y: 0, rot: 0 };
    el._pointer = { active: true, influence: 1, x: 48, y: 34, lastMove: 0 };
    const step = now => { el._pointer.lastMove = now; el._updateHeadFollow(now, 16); };
    step(16);
    const first = el._headFollowPose.x;
    for (let i = 2; i < 200; i++) step(i * 16);
    const steady = { ...el._headFollowPose };
    el._pointer.x = -48;
    step(3200);
    const jump = Math.abs(steady.x - el._headFollowPose.x);
    el._pointer.active = false;
    for (let i = 201; i < 400; i++) step(i * 16);
    return {
      first, steady, jump, center: { ...el._headFollowPose },
      eyes: [el._leftBase, el._rightBase].map(eye => ({
        fill: eye.getAttribute('fill'), filter: eye.getAttribute('filter'),
      })),
    };
  });
  expect(result.first).toBeGreaterThan(0);
  expect(result.first).toBeLessThan(0.15);
  expect(result.steady.x).toBeLessThanOrEqual(1.8);
  expect(result.steady.rot).toBeLessThanOrEqual(2.2);
  expect(result.jump).toBeLessThan(0.26);
  expect(result.center).toEqual({ x: 0, y: 0, rot: 0 });
  expect(result.eyes).toEqual([{ fill: '#fff', filter: null }, { fill: '#fff', filter: null }]);
});

test('BytezWork artwork loads with four limbs and no visible robot antenna', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/demo/bytezwork.html');
  const avatar = page.locator('bytezwork-avatar');
  await expect(avatar).toBeVisible();
  await expect(avatar).toHaveCSS('width', '221px');
  await expect(avatar.locator('#bytezHelmet')).toHaveCount(0);
  await expect(avatar.locator('#bytezCostume')).toHaveCount(0);
  await expect(avatar.locator('#bytezPlans')).toHaveCount(0);
  await expect(avatar.locator('#bytezPencil')).toHaveCount(0);
  await expect(avatar.locator('#antennaDot')).toBeHidden();
  const count = await avatar.evaluate(el => ({
    limbs: el.shadowRoot.querySelectorAll('#bytezLimbs > g').length,
    points: el._baseHeadPoints.length,
  }));
  expect(count).toEqual({ limbs: 4, points: 96 });
  await page.getByRole('button', { name: 'Pensar', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Pensando cómo resolverlo');
  await page.getByRole('button', { name: 'Normal', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Lista para construir');
  expect(errors).toEqual([]);
});

test('waiting can be interrupted, then the avatar detaches and reconnects cleanly', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/demo/bytezwork.html');
  const result = await page.locator('bytezwork-avatar').evaluate(async el => {
    const phases = [];
    el.addEventListener('action-state', e => phases.push(e.detail));
    await el.startWaiting();
    await el.play('surprise');
    el.reset();
    const parent = el.parentNode;
    el.remove();
    parent.prepend(el);
    await el.play('success');
    el.reset();
    return { phases, connected: el.isConnected, waiting: Boolean(el._waitingFx) };
  });
  expect(result.connected).toBe(true);
  expect(result.waiting).toBe(false);
  expect(result.phases.some(e => e.action === 'waiting' && e.phase === 'cancel')).toBe(true);
  expect(result.phases.some(e => e.action === 'success' && e.phase === 'end')).toBe(true);
  expect(errors).toEqual([]);
});

test('reduced motion keeps all four limbs still and color applies to limbs', async ({ page }) => {
  await page.goto('/demo/bytezwork.html');
  const avatar = page.locator('bytezwork-avatar');
  const transforms = await avatar.evaluate(el => {
    el.setAttribute('motion', 'reduce');
    el.setAttribute('color', '#303030');
    el._draw(1000);
    const limbs = [el._bytezLeftArm, el._bytezRightArm, el._bytezLeftLeg, el._bytezRightLeg];
    const first = limbs.map(limb => limb.getAttribute('transform'));
    el._draw(2000);
    return {
      first,
      second: limbs.map(limb => limb.getAttribute('transform')),
      stroke: el.shadowRoot.querySelector('#bytezLimbs .bytezLimbBody').getAttribute('stroke'),
    };
  });
  expect(transforms.first).toEqual(transforms.second);
  expect(transforms.stroke).toBe('#303030');
  await page.getByLabel('Tamaño').fill('180');
  await expect(avatar).toHaveCSS('width', '180px');
});

test('working animates patitas while sleep stops them', async ({ page }) => {
  await page.goto('/demo/bytezwork.html');
  const result = await page.locator('bytezwork-avatar').evaluate(async el => {
    el.setAttribute('motion', 'full');
    await el.startWaiting();
    el._draw(0);
    const limbs = [el._bytezLeftArm, el._bytezRightArm, el._bytezLeftLeg, el._bytezRightLeg];
    const first = limbs.map(limb => limb.getAttribute('transform'));
    el._draw(330);
    const second = limbs.map(limb => limb.getAttribute('transform'));
    el.reset();
    await el.sleep();
    el._draw(1000);
    const asleep = limbs.map(limb => limb.getAttribute('transform'));
    el._draw(2000);
    return { first, second, asleep, later: limbs.map(limb => limb.getAttribute('transform')) };
  });
  result.first.forEach((value, i) => expect(value).not.toBe(result.second[i]));
  expect(result.asleep).toEqual(result.later);
});

test('design sliders persist, export and restore the chosen proportions', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/demo/bytezwork.html');
  const chosen = {
    size: 220,
    'eye-size': 72,
    'arm-length': 85,
    'arm-thickness': 36,
    'leg-length': 120,
    'leg-thickness': 28,
  };
  for (const [name, value] of Object.entries(chosen)) {
    await page.locator('#' + name).fill(String(value));
  }
  expect(JSON.parse(await page.locator('#design-values').inputValue())).toEqual(chosen);
  await page.reload();
  const avatar = page.locator('bytezwork-avatar');
  for (const [name, value] of Object.entries(chosen)) {
    await expect(page.locator('#' + name)).toHaveValue(String(value));
    await expect(avatar).toHaveAttribute(name, String(value));
  }
  const result = await avatar.evaluate(async el => {
    const eye = el.shadowRoot.getElementById('bytezLeftEyeSize');
    const before = [eye].map(part => part.getAttribute('transform'));
    await el.startWaiting();
    el._draw(performance.now());
    return {
      before,
      after: [eye].map(part => part.getAttribute('transform')),
      armWidth: el._bytezLeftArm.querySelector('.bytezLimbBody').getAttribute('stroke-width'),
      legWidth: el._bytezLeftLeg.querySelector('.bytezLimbBody').getAttribute('stroke-width'),
    };
  });
  expect(result.before).toEqual(result.after);
  expect(result.armWidth).toBe('36');
  expect(result.legWidth).toBe('28');
  await page.getByRole('button', { name: 'Restablecer', exact: true }).click();
  await expect(page.locator('#eye-size')).toHaveValue('89');
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('thinking brings hands to the chin and reset restores their position', async ({ page }) => {
  await page.goto('/demo/bytezwork.html');
  const avatar = page.locator('bytezwork-avatar');
  await avatar.evaluate(el => {
    el.setAttribute('motion', 'full');
    el._testInspect = el.play('inspect');
  });
  await expect.poll(() => avatar.evaluate(el => Boolean(el._inspectFx))).toBe(true);
  const result = await avatar.evaluate(el => {
    const paths = [el._bytezLeftArm, el._bytezRightArm];
    const curves = () => paths.map(limb => limb.querySelector('.bytezLimbBody').getAttribute('d'));
    el._draw(el._inspectFx.start + 600);
    const thinking = curves();
    const inFront = paths.every(limb => limb.parentNode === el._bytezHandsFront);
    el.setAttribute('motion', 'reduce');
    el._draw(el._inspectFx.start + 1000);
    const still = curves();
    el._draw(el._inspectFx.start + 2000);
    const later = curves();
    el.setAttribute('color', '#303030');
    const colors = paths.map(limb => limb.querySelector('.bytezLimbBody').getAttribute('stroke'));
    el.reset();
    el._draw(performance.now());
    return { thinking, inFront, still, later, colors, rest: curves(),
      back: paths.every(limb => limb.parentNode === el._bytezLimbs) };
  });
  expect(result.inFront).toBe(true);
  expect(result.thinking).toEqual(result.still);
  expect(result.still).toEqual(result.later);
  expect(result.colors).toEqual(['#303030', '#303030']);
  expect(result.back).toBe(true);
  expect(result.rest).not.toEqual(result.thinking);
});
