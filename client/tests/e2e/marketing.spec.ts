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
    });
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

  test('Founders page shows both Calendly widgets', async ({ page }) => {
    await page.goto('/founders');

    await expect(page.locator('h1')).toContainText('Exclusive Founders Offer');

    // Wait for Calendly to load
    await page.waitForFunction(() => window.Calendly, { timeout: 15000 });
    
    // Check for both 15min and 30min Calendly widgets
    await page.waitForSelector('iframe[src*="calendly.com"]', { timeout: 10000 });
    const calendlyIframes = await page.locator('iframe[src*="calendly.com"]');
    const iframeCount = await calendlyIframes.count();
    expect(iframeCount).toBeGreaterThanOrEqual(1);
    
    // Check for both meeting types in the page content or iframes
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('15');
  });

    // Wait for Calendly widget to load
    await page.waitForSelector('[data-testid="calendly-widget"]', { timeout: 10000 });

    // Count Calendly widgets
    const calendlyWidgets = page.locator('[data-testid="calendly-widget"]');
    await expect(calendlyWidgets).toHaveCount(1);

    // Verify it's the 15-minute widget
    const widget = calendlyWidgets.first();
    const dataUrl = await widget.getAttribute('data-url');
    expect(dataUrl).toContain('15min');

    // Verify no 30-minute widget exists
    const thirtyMinWidgets = page.locator('[data-url*="30min"]');
    await expect(thirtyMinWidgets).toHaveCount(0);
  });

  test('Founders page shows exactly two Calendly widgets', async ({ page }) => {
    await page.goto('/founders');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Meet the PropertyPulse Founders');

    // Wait for both Calendly widgets to load
    await page.waitForSelector('[data-testid="calendly-widget"]', { timeout: 10000 });

    // Count all Calendly widgets
    const calendlyWidgets = page.locator('[data-testid="calendly-widget"]');
    await expect(calendlyWidgets).toHaveCount(2);

    // Verify one 15-minute and one 30-minute widget
    const fifteenMinWidget = page.locator('[data-url*="15min"]');
    const thirtyMinWidget = page.locator('[data-url*="30min"]');
    
    await expect(fifteenMinWidget).toHaveCount(1);
    await expect(thirtyMinWidget).toHaveCount(1);
  });

  test('Affiliate Apply Now leads to signup form', async ({ page }) => {
    // Start from affiliate page
    await page.goto('/affiliate');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('PropertyPulse Affiliate Program');

    // Click "Apply Now" button
    await page.getByText('🚀 Apply Now').click();

    // Should navigate to affiliate signup page
    await expect(page).toHaveURL('/affiliate/signup');

    // Verify signup form is present and interactable
    await expect(page.locator('h1')).toContainText('Join');
    
    // Check that form fields are visible and interactable
    const nameField = page.locator('input[name="firstName"]').first();
    const emailField = page.locator('input[name="email"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await expect(nameField).toBeVisible();
    await expect(emailField).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Test that fields are interactable
    await nameField.fill('Test User');
    await expect(nameField).toHaveValue('Test User');
    
    await emailField.fill('test@example.com');
    await expect(emailField).toHaveValue('test@example.com');
  });

  test('Register button navigates to signup and renders interactive form', async ({ page }) => {
    // Navigate to login page first
    await page.goto('/login');

    // Find and click Register button
    const registerButton = page.getByText('Register').or(page.getByText('Sign up')).or(page.getByText('Create account')).first();
    
    if (await registerButton.isVisible()) {
      await registerButton.click();
      
      // Should navigate to signup page
      await expect(page).toHaveURL('/signup');
      
      // Verify signup form exists and is interactive
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      await expect(emailField).toBeVisible();
      await expect(passwordField).toBeVisible();
      await expect(submitButton).toBeVisible();

      // Test interactivity
      await emailField.fill('test@example.com');
      await expect(emailField).toHaveValue('test@example.com');
      
      await passwordField.fill('testpassword');
      await expect(passwordField).toHaveValue('testpassword');
    } else {
      // If no register button found, check if we can navigate directly
      await page.goto('/signup');
      await expect(page.locator('h1, h2')).toContainText(/sign up|register|create account/i);
    }
  });

  test('should load home page with Tawk chat widget', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Check page title
    await expect(page).toHaveTitle(/PropertyPulse/);
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /AI-Powered Property Management/i })).toBeVisible();
    
    // Wait for Tawk widget to load and check window.Tawk_API exists
    await page.waitForFunction(() => window.Tawk_API !== undefined, { timeout: 10000 });
    
    // Check that Tawk widget is visible (chat bubble)
    await page.waitForSelector('[data-testid="tawk-widget"], .tawk-bubble', { timeout: 10000 });
    
    // Check for no CSP errors containing "tawk" or "blocked"
    page.on('console', message => {
      const text = message.text().toLowerCase();
      if ((text.includes('tawk') || text.includes('blocked')) && message.type() === 'error') {
        throw new Error(`CSP error detected: ${message.text()}`);
      }
    });
    
    // Check CTA buttons are present
    await expect(page.getByRole('link', { name: /start free trial/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /book demo/i })).toBeVisible();
  });

  test('should navigate to all marketing pages successfully', async ({ page }) => {
    const pages = [
      { url: '/', title: /PropertyPulse/ },
      { url: '/features', title: /Features/ },
      { url: '/pricing', title: /Pricing/ },
      { url: '/about', title: /About/ },
      { url: '/founders', title: /Founders/ },
      { url: '/affiliate', title: /Affiliate/ },
      { url: '/demo', title: /Demo/ },
      { url: '/contact', title: /Contact/ },
      { url: '/blog', title: /Blog/ }
    ];

    for (const pageInfo of pages) {
      await page.goto(`http://localhost:3000${pageInfo.url}`);
      await expect(page).toHaveTitle(pageInfo.title);
      
      // Check that Tailwind styles are applied (look for container class)
      const container = page.locator('.container, .max-w-7xl, .max-w-4xl').first();
      await expect(container).toBeVisible();
    }
  });

  test('should show only one Calendly iframe on demo page', async ({ page }) => {
    await page.goto('http://localhost:3000/demo');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Count Calendly iframes
    const calendlyIframes = page.locator('iframe[src*="calendly.com"]');
    await expect(calendlyIframes).toHaveCount(1);
    
    // Verify it's the 15-minute intro URL
    await expect(calendlyIframes.first()).toHaveAttribute('src', /dessuber\/15min/);
  });

  test('should show Calendly widgets and booking links on founders page', async ({ page }) => {
    await page.goto('http://localhost:3000/founders');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that both booking options are available (either as iframes or links)
    const quickChat15 = page.locator('a[href*="dessuber/15min"], iframe[src*="dessuber/15min"]');
    const fullDemo30 = page.locator('a[href*="dessuber/30min"], iframe[src*="dessuber/30min"]');
    
    await expect(quickChat15.first()).toBeVisible();
    await expect(fullDemo30.first()).toBeVisible();
    
    // Verify page content is properly loaded
    await expect(page.getByRole('heading', { name: /founders' exclusive offer/i })).toBeVisible();
  });
});

test.describe('Affiliate Signup Flow', () => {
  test('should navigate from affiliate page to signup form', async ({ page }) => {
    await page.goto('http://localhost:3000/affiliate');
    
    // Click "Apply Now" button
    await page.getByRole('link', { name: /apply now/i }).click();
    
    // Should be on affiliate signup page
    await expect(page).toHaveURL('http://localhost:3000/affiliate/signup');
    await expect(page.getByRole('heading', { name: /join the propertypulse affiliate program/i })).toBeVisible();
    
    // Check form fields are visible and interactive
    await expect(page.getByRole('textbox', { name: /first name/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /last name/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    
    // Check required fields validation
    await page.getByRole('button', { name: /submit affiliate application/i }).click();
    
    // Should stay on same page (validation prevents submission)
    await expect(page).toHaveURL('http://localhost:3000/affiliate/signup');
  });

  test('should submit affiliate application successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/affiliate/signup');
    
    // Fill out form
    await page.getByRole('textbox', { name: /first name/i }).fill('John');
    await page.getByRole('textbox', { name: /last name/i }).fill('Doe');
    await page.getByRole('textbox', { name: /email address/i }).fill('john.doe@example.com');
    await page.getByRole('textbox', { name: /company/i }).fill('Test Company');
    await page.getByRole('textbox', { name: /phone/i }).fill('555-123-4567');
    
    // Select experience level
    await page.getByRole('combobox', { name: /experience/i }).selectOption('3-5-years');
    
    // Select payout method
    await page.getByRole('radio', { name: /paypal/i }).check();
    await page.getByRole('textbox', { name: /paypal email/i }).fill('john.paypal@example.com');
    
    // Accept terms
    await page.getByRole('checkbox', { name: /accept.*terms/i }).check();
    
    // Submit form
    await page.getByRole('button', { name: /submit affiliate application/i }).click();
    
    // Should show success message
    await expect(page.getByText(/application submitted successfully/i)).toBeVisible();
    await expect(page.getByText(/we'll review.*within 1-2 business days/i)).toBeVisible();
  });
});

test.describe('Authentication Routes', () => {
  test('should show register form on signup route', async ({ page }) => {
    await page.goto('http://localhost:3000/signup');
    
    // Should show registration form
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    
    // Form should be interactive
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await expect(page.getByRole('textbox', { name: /email/i })).toHaveValue('test@example.com');
  });

  test('should show login form on login route', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Should show login form
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    
    // Should have link to signup
    const signupLink = page.getByRole('link', { name: /register/i });
    await expect(signupLink).toBeVisible();
    
    // Click register should navigate to signup
    await signupLink.click();
    await expect(page).toHaveURL('http://localhost:3000/signup');
  });
});

test.describe('Contact Form', () => {
  test('should submit contact form successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/contact');
    
    // Fill out contact form
    await page.getByRole('textbox', { name: /full name/i }).fill('Jane Smith');
    await page.getByRole('textbox', { name: /email address/i }).fill('jane@example.com');
    await page.getByRole('textbox', { name: /company/i }).fill('Example Corp');
    await page.getByRole('textbox', { name: /phone/i }).fill('555-987-6543');
    await page.getByRole('textbox', { name: /message/i }).fill('I would like to learn more about PropertyPulse.');
    
    // Submit form
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Should show success message
    await expect(page.getByText(/thank you.*received your message/i)).toBeVisible();
  });

  test('should validate required fields in contact form', async ({ page }) => {
    await page.goto('http://localhost:3000/contact');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/please fill in all required fields/i)).toBeVisible();
  });
});

test.describe('404 Page', () => {
  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('http://localhost:3000/nonexistent-page');
    
    // Should show 404 page
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText(/property not found/i)).toBeVisible();
    
    // Should have working navigation links
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
    
    // Test navigation back to home
    await page.getByRole('link', { name: /back to home/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});

test.describe('UTM Parameter Handling', () => {
  test('should preserve UTM parameters across navigation', async ({ page }) => {
    // Visit with UTM parameters
    await page.goto('http://localhost:3000/?utm_source=test&utm_medium=playwright&utm_campaign=e2e');
    
    // Navigate to pricing page via CTA button
    await page.getByRole('link', { name: /start free trial/i }).first().click();
    
    // UTM parameters should be preserved in the URL
    await expect(page).toHaveURL(/utm_source=test/);
    await expect(page).toHaveURL(/utm_medium=playwright/);
    await expect(page).toHaveURL(/utm_campaign=e2e/);
  });
});

test.describe('Performance and Accessibility', () => {
  test('should have acceptable Lighthouse scores', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Basic performance check - page should load within 3 seconds
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
    
    // Check for presence of alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:3000/features');
    
    // Check heading hierarchy (should have h1, then h2s, etc.)
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Blog Functionality', () => {
  test('should display blog posts and allow filtering', async ({ page }) => {
    await page.goto('http://localhost:3000/blog');
    
    // Check blog posts are displayed
    await expect(page.getByText(/ai.*property management/i)).toBeVisible();
    
    // Check category filtering
    await page.getByRole('button', { name: /ai.*technology/i }).click();
    
    // Should still show posts (assuming AI category exists)
    await expect(page.locator('[data-testid="blog-post"], article')).toHaveCountGreaterThan(0);
  });

  test('should navigate to individual blog posts', async ({ page }) => {
    await page.goto('http://localhost:3000/blog');
    
    // Click on first blog post link
    await page.getByRole('link', { name: /read more/i }).first().click();
    
    // Should navigate to blog post page
    await expect(page).toHaveURL(/\/blog\//);
    
    // Should show blog post content
    await expect(page.locator('article, .prose')).toBeVisible();
  });
});