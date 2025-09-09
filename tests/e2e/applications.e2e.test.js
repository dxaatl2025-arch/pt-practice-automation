// Applications E2E Tests
const { test, expect } = require('@playwright/test');

test.describe('Applications End-to-End', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('complete application submission flow', async ({ page }) => {
    // Navigate to properties page
    await page.click('text=Properties');
    await page.waitForURL('**/properties');

    // Find and click on a property
    await page.click('[data-testid="property-card"]:first-child .view-details');
    
    // Should be on property details page
    await expect(page.locator('h1')).toContainText('Downtown Studio Apartment');
    
    // Click apply button
    await page.click('button:has-text("Apply Now")');
    
    // Should navigate to application form
    await page.waitForURL('**/apply/**');
    
    // Fill out application form
    await page.fill('[data-testid="firstName"]', 'John');
    await page.fill('[data-testid="lastName"]', 'Doe');
    await page.fill('[data-testid="email"]', 'john.doe@test.com');
    await page.fill('[data-testid="phone"]', '555-0123');
    
    // Date of birth
    await page.fill('[data-testid="dateOfBirth"]', '1990-01-01');
    
    // Current address
    await page.fill('[data-testid="currentAddress"]', '123 Current St');
    await page.fill('[data-testid="currentCity"]', 'Current City');
    await page.selectOption('[data-testid="currentState"]', 'CA');
    await page.fill('[data-testid="currentZip"]', '90210');
    await page.fill('[data-testid="yearsAtAddress"]', '2');
    
    // Employment info
    await page.fill('[data-testid="employerName"]', 'Test Company');
    await page.fill('[data-testid="jobTitle"]', 'Software Developer');
    await page.fill('[data-testid="employerAddress"]', '456 Work St');
    await page.fill('[data-testid="employerPhone"]', '555-WORK');
    await page.fill('[data-testid="employmentLength"]', '3 years');
    await page.fill('[data-testid="monthlyIncome"]', '5000');
    
    // Reference
    await page.fill('[data-testid="refName"]', 'Jane Reference');
    await page.fill('[data-testid="refRelationship"]', 'Former Landlord');
    await page.fill('[data-testid="refContact"]', 'jane@ref.com');
    
    // Occupants
    await page.fill('[data-testid="occupants"]', '1');
    
    // Move-in date
    await page.fill('[data-testid="desiredMoveIn"]', '2024-04-01');
    
    // Consent and signature
    await page.check('[data-testid="consentBackground"]');
    await page.fill('[data-testid="signature"]', 'John Doe');
    
    // Submit application
    await page.click('button:has-text("Submit Application")');
    
    // Should see success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Application submitted successfully');
    
    // Should show application ID
    await expect(page.locator('[data-testid="application-id"]')).toBeVisible();
  });

  test('landlord application management flow', async ({ page, context }) => {
    // Login as landlord
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'landlord@testlord.com');
    await page.fill('[data-testid="password"]', 'testpass123');
    await page.click('button:has-text("Login")');
    
    // Navigate to applications
    await page.click('text=Applications');
    await page.waitForURL('**/applications');
    
    // Should see list of applications
    await expect(page.locator('[data-testid="application-list"]')).toBeVisible();
    
    // Click on first application
    await page.click('[data-testid="application-item"]:first-child');
    
    // Should see application details
    await expect(page.locator('[data-testid="applicant-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="monthly-income"]')).toBeVisible();
    
    // Download PDF
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download PDF")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // Approve application
    await page.click('button:has-text("Approve")');
    
    // Confirm approval
    await page.click('button:has-text("Confirm")');
    
    // Should see success message
    await expect(page.locator('[data-testid="status-update-success"]')).toContainText('Application approved');
    
    // Status should update
    await expect(page.locator('[data-testid="application-status"]')).toContainText('Approved');
  });

  test('application form validation', async ({ page }) => {
    await page.goto('/apply/property123');
    
    // Try to submit empty form
    await page.click('button:has-text("Submit Application")');
    
    // Should see validation errors
    await expect(page.locator('[data-testid="error-firstName"]')).toContainText('First name is required');
    await expect(page.locator('[data-testid="error-email"]')).toContainText('Email is required');
    
    // Fill invalid email
    await page.fill('[data-testid="email"]', 'invalid-email');
    await page.blur('[data-testid="email"]');
    
    // Should see email format error
    await expect(page.locator('[data-testid="error-email"]')).toContainText('Valid email is required');
    
    // Fill negative income
    await page.fill('[data-testid="monthlyIncome"]', '-1000');
    await page.blur('[data-testid="monthlyIncome"]');
    
    // Should see income validation error
    await expect(page.locator('[data-testid="error-monthlyIncome"]')).toContainText('Income must be positive');
    
    // Try to submit without consent
    await page.fill('[data-testid="firstName"]', 'John');
    await page.fill('[data-testid="email"]', 'john@test.com');
    await page.fill('[data-testid="signature"]', 'John Doe');
    
    await page.click('button:has-text("Submit Application")');
    
    // Should see consent error
    await expect(page.locator('[data-testid="error-consent"]')).toContainText('Background check consent is required');
  });

  test('responsive design on mobile', async ({ page, context }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/apply/property123');
    
    // Form should be usable on mobile
    await expect(page.locator('[data-testid="application-form"]')).toBeVisible();
    
    // Fill a few fields to test mobile interaction
    await page.fill('[data-testid="firstName"]', 'Mobile');
    await page.fill('[data-testid="lastName"]', 'User');
    
    // Check that form inputs are properly sized
    const firstNameInput = page.locator('[data-testid="firstName"]');
    const boundingBox = await firstNameInput.boundingBox();
    expect(boundingBox.width).toBeGreaterThan(200); // Should be reasonably wide
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });

  test('application status updates for tenants', async ({ page }) => {
    // Assume an application was submitted and we have its ID
    const applicationId = 'existing-application-id'; // This would come from seed data
    
    await page.goto(`/my-applications`);
    
    // Should see application in tenant's list
    await expect(page.locator('[data-testid="my-application-list"]')).toBeVisible();
    
    // Click on application
    await page.click(`[data-testid="application-${applicationId}"]`);
    
    // Should see application status
    await expect(page.locator('[data-testid="application-status"]')).toBeVisible();
    
    // If approved, should see next steps
    const status = await page.locator('[data-testid="application-status"]').textContent();
    if (status.includes('Approved')) {
      await expect(page.locator('[data-testid="next-steps"]')).toBeVisible();
    }
  });
});