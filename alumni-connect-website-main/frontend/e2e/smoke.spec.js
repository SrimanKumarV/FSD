const { test, expect } = require('@playwright/test');

test.describe('Alumnex Connect E2E Smoke Tests', () => {

  test('should load Login page with correct controls on current viewport', async ({ page }) => {
    await page.goto('/login');

    // Wait for the document to be ready
    await expect(page).toHaveTitle(/Alumnex/i);

    // Verify email and password input elements exist and are visible
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]');
    await expect(emailInput.first()).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput.first()).toBeVisible();

    // Verify submit button exists
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn.first()).toBeVisible();

    // Verify no unexpected horizontal page overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('should load Landing page cleanly with zero horizontal layout overflow', async ({ page }) => {
    await page.goto('/');

    // Check that body is rendered
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify horizontal overflow constraint (No horizontal scrollbar)
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

});
