import { expect, test } from '@playwright/test';

test('BytezWork artwork loads with four limbs and no visible robot antenna', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/demo/bytezwork.html');
  const avatar = page.locator('bytezwork-avatar');
  await expect(avatar).toBeVisible();
  await expect(avatar).toHaveCSS('width', '240px');
  await expect(avatar.locator('#bytezHelmet')).toBeVisible();
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
    el.startWaiting();
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
      stroke: el.shadowRoot.querySelector('#bytezLimbs path').getAttribute('stroke'),
    };
  });
  expect(transforms.first).toEqual(transforms.second);
  expect(transforms.stroke).toBe('#303030');
  await page.getByLabel('Tamaño').fill('180');
  await expect(avatar).toHaveCSS('width', '180px');
});

test('working animates patitas while sleep stops them', async ({ page }) => {
  await page.goto('/demo/bytezwork.html');
  const result = await page.locator('bytezwork-avatar').evaluate(el => {
    el.setAttribute('motion', 'full');
    el.startWaiting();
    el._draw(0);
    const limbs = [el._bytezLeftArm, el._bytezRightArm, el._bytezLeftLeg, el._bytezRightLeg];
    const first = limbs.map(limb => limb.getAttribute('transform'));
    el._draw(330);
    const second = limbs.map(limb => limb.getAttribute('transform'));
    el.reset();
    el.sleep();
    el._draw(1000);
    const asleep = limbs.map(limb => limb.getAttribute('transform'));
    el._draw(2000);
    return { first, second, asleep, later: limbs.map(limb => limb.getAttribute('transform')) };
  });
  result.first.forEach((value, i) => expect(value).not.toBe(result.second[i]));
  expect(result.asleep).toEqual(result.later);
});
