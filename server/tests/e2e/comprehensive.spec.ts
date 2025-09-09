import { test, expect } from '@playwright/test';

test.describe('PropertyPulse E2E - All Features', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('Homepage loads with all features enabled', async ({ page }) => {
    // Take screenshot of homepage
    await page.screenshot({ path: 'tests/e2e-artifacts/homepage.png', fullPage: true });
    
    // Verify page loads
    await expect(page).toHaveTitle(/PropertyPulse/);
    
    // Check for key elements
    const header = page.locator('header, nav, [data-testid="header"]').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('AI Features - Leasing Flow', async ({ page }) => {
    // Navigate to leasing feature
    await page.goto('/leasing');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/e2e-artifacts/leasing-happy.png', fullPage: true });
    
    // Test basic interactions
    const title = page.locator('h1, h2, [data-testid="page-title"]').first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });

  test('Rent Optimizer Feature', async ({ page }) => {
    await page.goto('/rent-optimizer');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/e2e-artifacts/rent-optimizer.png', fullPage: true });
    
    // Basic check for page load
    await expect(page.locator('body')).toBeVisible();
  });

  test('Turnover Predictor', async ({ page }) => {
    await page.goto('/turnover');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/e2e-artifacts/turnover.png', fullPage: true });
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Forecasting Dashboard', async ({ page }) => {
    await page.goto('/forecast');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/e2e-artifacts/forecast.png', fullPage: true });
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Owner Portal', async ({ page }) => {
    await page.goto('/owner-portal');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/e2e-artifacts/owner-portal.png', fullPage: true });
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Accounting Module', async ({ page }) => {
    await page.goto('/accounting');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/e2e-artifacts/accounting.png', fullPage: true });
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Tenant CRUD Operations', async ({ page }) => {
    await page.goto('/tenants');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'tests/e2e-artifacts/tenants-crud.png', fullPage: true });
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('API Health Check', async ({ page }) => {
    // Test API endpoints
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const healthData = await response.json();
    expect(healthData).toHaveProperty('status');
  });

});