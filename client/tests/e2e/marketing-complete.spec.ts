import { test, expect } from '@playwright/test';

test.describe('Marketing Pages E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
  });

  // Test all marketing pages load without errors
  const marketingPages = [
    { path: '/', title: 'AI-Powered Property Management Platform' },
    { path: '/features', title: 'Complete Property Management Platform' },
    { path: '/pricing', title: 'Simple, Transparent Pricing' },
    { path: '/about', title: 'About PropertyPulse' },
    { path: '/affiliate', title: 'PropertyPulse Affiliate Program' },
    { path: '/founders', title: 'Exclusive Founders Offer' },
    { path: '/demo', title: 'See PropertyPulse in Action' },
    { path: '/contact', title: 'Get in Touch' },
    { path: '/blog', title: 'PropertyPulse Blog' }
  ];

  marketingPages.forEach(({ path, title }) => {
    test(`${path} page loads successfully`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      
      // Check page title
      await expect(page).toHaveTitle(new RegExp(title, 'i'));
      
      // Check main heading exists
      await expect(page.locator('h1').first()).toBeVisible();
      
      // Check no 404 or error content
      await expect(page.locator('text=404')).not.toBeVisible();
      await expect(page.locator('text=Page not found')).not.toBeVisible();
      
      // Check navigation exists
      await expect(page.locator('nav')).toBeVisible();
    });
  });

  test('Navigation links work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test primary navigation links
    const navLinks = [
      { text: 'Features', expectedUrl: '/features' },
      { text: 'Pricing', expectedUrl: '/pricing' },
      { text: 'Demo', expectedUrl: '/demo' },
      { text: 'Contact', expectedUrl: '/contact' }
    ];

    for (const { text, expectedUrl } of navLinks) {
      await page.goto('/');
      await page.click(`nav a:has-text("${text}")`);
      expect(page.url()).toContain(expectedUrl);
    }
  });

  test('Tawk chat widget loads without CSP errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for Tawk script to load
    await page.waitForFunction(() => window.Tawk_API, { timeout: 15000 });
    
    // Check that Tawk_API is available
    const tawkAPI = await page.evaluate(() => typeof window.Tawk_API);
    expect(tawkAPI).toBe('object');

    // Wait for potential CSP errors
    await page.waitForTimeout(3000);
    
    // Check for no CSP errors related to Tawk
    const cspErrors = consoleErrors.filter(log => 
      log.toLowerCase().includes('content security policy') ||
      log.toLowerCase().includes('blocked') ||
      log.toLowerCase().includes('tawk')
    );
    
    expect(cspErrors).toHaveLength(0);
  });

  test('Demo page shows Calendly widget correctly', async ({ page }) => {
    await page.goto('/demo');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('See PropertyPulse in Action');

    // Wait for Calendly script to load
    await page.waitForFunction(() => window.Calendly, { timeout: 15000 });
    
    // Check that exactly one Calendly widget is present
    await page.waitForSelector('iframe[src*="calendly.com"]', { timeout: 10000 });
    const calendlyIframes = await page.locator('iframe[src*="calendly.com"]').count();
    expect(calendlyIframes).toBe(1);
    
    // Verify it's the 15-minute meeting
    const iframe = page.locator('iframe[src*="calendly.com"]').first();
    const src = await iframe.getAttribute('src');
    expect(src).toContain('15min');
  });

  test('Founders page shows Calendly widgets', async ({ page }) => {
    await page.goto('/founders');

    await expect(page.locator('h1')).toContainText('Exclusive Founders Offer');

    // Wait for Calendly to load
    await page.waitForFunction(() => window.Calendly, { timeout: 15000 });
    
    // Check for Calendly widgets
    await page.waitForSelector('iframe[src*="calendly.com"], a[href*="calendly.com"]', { timeout: 10000 });
    
    // Check for both meeting types in the page content
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/15.?min/i);
    expect(pageContent).toMatch(/30.?min/i);
  });

  test('UTM parameters persist through navigation flow', async ({ page }) => {
    // Start with UTM parameters on founders page
    const utmParams = 'utm_source=email&utm_medium=outbound&utm_campaign=founders_launch&ref=AFF123';
    await page.goto(`/founders?${utmParams}`);
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Exclusive Founders Offer');
    
    // Click "Start Free Trial" button
    const signupButton = page.locator('a:has-text("Start Free Trial")').first();
    await expect(signupButton).toBeVisible();
    
    // Check that the button href contains UTM parameters
    const href = await signupButton.getAttribute('href');
    expect(href).toContain('utm_source=email');
    expect(href).toContain('utm_medium=outbound');
    expect(href).toContain('utm_campaign=founders_launch');
    expect(href).toContain('ref=AFF123');
    
    // Navigate to signup page
    await signupButton.click();
    
    // Verify UTMs are in the URL
    expect(page.url()).toContain('utm_source=email');
    expect(page.url()).toContain('ref=AFF123');
    
    // Check that UTMs are stored in localStorage
    const storedUTMs = await page.evaluate(() => {
      const stored = localStorage.getItem('utmData');
      return stored ? JSON.parse(stored) : null;
    });
    
    expect(storedUTMs).toBeTruthy();
    expect(storedUTMs.utm_source).toBe('email');
    expect(storedUTMs.ref).toBe('AFF123');
  });

  test('Contact form submits successfully', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.locator('h1')).toContainText('Get in Touch');
    
    // Fill out the contact form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'This is a test message for the contact form.');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Thank you')).toBeVisible({ timeout: 10000 });
    
    // Verify form was reset
    const nameValue = await page.inputValue('input[name="name"]');
    expect(nameValue).toBe('');
  });

  test('404 page works correctly', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should show 404 page
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('a:has-text("Home")')).toBeVisible();
    
    // Click home link
    await page.click('a:has-text("Home")');
    await expect(page).toHaveURL('/');
  });

  test('Affiliate signup flow works', async ({ page }) => {
    await page.goto('/affiliate');
    
    await expect(page.locator('h1')).toContainText('PropertyPulse Affiliate Program');
    
    // Click "Apply Now" button
    const applyButton = page.locator('a:has-text("Apply Now")').first();
    await expect(applyButton).toBeVisible();
    await applyButton.click();
    
    // Should navigate to affiliate signup
    expect(page.url()).toContain('/affiliate/signup');
    
    // Check form exists
    await expect(page.locator('form')).toBeVisible();
  });

  test('Mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile menu button should be visible
    const menuButton = page.locator('button[aria-controls="mobile-menu"]');
    await expect(menuButton).toBeVisible();
    
    // Click to open mobile menu
    await menuButton.click();
    
    // Mobile menu should be visible
    await expect(page.locator('#mobile-menu')).toBeVisible();
    
    // Test a mobile menu link
    await page.click('#mobile-menu a:has-text("Features")');
    expect(page.url()).toContain('/features');
  });

  test('CTA buttons contain UTM parameters', async ({ page }) => {
    await page.goto('/?utm_source=test&utm_campaign=test_campaign');
    
    // Wait for UTM hook to process parameters
    await page.waitForTimeout(1000);
    
    // Check that CTA buttons have UTM parameters
    const ctaButton = page.locator('a:has-text("Start Free Trial")').first();
    const href = await ctaButton.getAttribute('href');
    
    expect(href).toContain('utm_source=test');
    expect(href).toContain('utm_campaign=test_campaign');
  });

  test('All pages have proper SEO meta tags', async ({ page }) => {
    const pages = ['/', '/features', '/pricing', '/founders'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Check meta description exists
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content');
      
      // Check OG tags exist
      const ogTitle = page.locator('meta[property="og:title"]');
      const ogDescription = page.locator('meta[property="og:description"]');
      
      await expect(ogTitle).toHaveAttribute('content');
      await expect(ogDescription).toHaveAttribute('content');
      
      // Check canonical URL
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href');
    }
  });
});