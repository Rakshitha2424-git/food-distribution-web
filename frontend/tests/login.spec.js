
import { test, expect } from '@playwright/test';

test('Login page should work', async ({ page }) => {

    await page.goto('http://localhost:5173');

    // Enter email
    await page.getByPlaceholder('Enter your email')
        .fill('admin@gmail.com');

    // Enter password
    await page.getByPlaceholder('Enter your password')
        .fill('admin123');

    // Click the login submit button
    await page.getByRole('button', {
        name: 'Login to FoodBridge'
    }).click();

    // Verify dashboard
    await expect(page.getByText('FoodBridge')).toBeVisible();

});

test('Invalid login should show an error', async ({ page }) => {

    await page.goto('http://localhost:5173');

    await page.getByPlaceholder('Enter your email')
        .fill('wrong@example.com');

    await page.getByPlaceholder('Enter your password')
        .fill('wrongpassword123');

    await page.getByRole('button', {
        name: 'Login to FoodBridge'
    }).click();

    // Check that an error message appears
    await expect(page.locator('.alert.error')).toBeVisible();

});
