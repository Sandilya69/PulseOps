import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.click('text=Create an account');
    await expect(page).toHaveURL('/signup');
    await expect(page.locator('h1')).toContainText('Create Account');
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.click('text=Forgot password');
    await expect(page).toHaveURL('/forgot-password');
  });
});

test.describe('Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should display signup form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Create Account');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate password match', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'different');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password must be at least')).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing settings without auth', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL('/login');
  });
});