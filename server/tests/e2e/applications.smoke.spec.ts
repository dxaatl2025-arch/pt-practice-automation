import { test, expect } from '@playwright/test';

test('Homepage loads', async ({ page }) => {
  await page.goto('/');
  const content = await page.textContent('body');
  expect(content && content.length).toBeGreaterThan(0);
});
