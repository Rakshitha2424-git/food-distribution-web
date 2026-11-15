
import { test, expect } from '@playwright/test';

test('New donor should be able to register', async ({ page }) => {

    // 1. Open FoodBridge
    await page.goto('http://localhost:5173');

    // 2. Switch to registration page
    await page.getByRole('button', {
        name: 'Register',
        exact: true
    }).click();

    // 3. Generate unique details for every test run
    const uniqueId = Date.now();

    // 4. Enter username
    await page.getByPlaceholder('Choose a username')
        .fill(`donor${uniqueId}`);

    // 5. Enter organization name
    await page.getByPlaceholder('Enter organization name')
        .fill('Test Food Restaurant');

    // 6. Enter phone number
    await page.getByPlaceholder('Enter phone number')
        .fill('9876543210');

    // 7. Enter email
    await page.getByPlaceholder('Enter your email')
        .fill(`donor${uniqueId}@example.com`);

    // 8. Enter password
    await page.getByPlaceholder('Enter your password')
        .fill('Test@FoodBridge123');

    // 9. Select donor role
    await page.locator('select[name="role"]')
        .selectOption('donor');

    // 10. Submit registration
    await page.getByRole('button', {
        name: 'Create account'
    }).click();

    // 11. Verify successful registration
    await expect(
        page.getByRole('heading', {
            name: 'Test Food Restaurant',
            exact: true
        })
    ).toBeVisible({ timeout: 10000 });
});


test('Should reject invalid email', async ({ page }) => {

    // 1. Open FoodBridge homepage
    await page.goto('http://localhost:5173');

    // 2. Switch to registration mode
    await page.getByRole('button', {
        name: 'Register',
        exact: true
    }).click();

    // 3. Enter username
    await page.getByPlaceholder('Choose a username')
        .fill('RahulTest');

    // 4. Enter organization name
    await page.getByPlaceholder('Enter organization name')
        .fill('Test Organization');

    // 5. Enter phone number
    await page.getByPlaceholder('Enter phone number')
        .fill('9876543210');

    // 6. Enter invalid email
    await page.getByPlaceholder('Enter your email')
        .fill('rahulgmail.com');

    // 7. Enter password
    await page.getByPlaceholder('Enter your password')
        .fill('Rahul@123');

    // 8. Verify browser rejects invalid email
    await expect(
        page.getByPlaceholder('Enter your email')
    ).toHaveJSProperty('validity.valid', false);

});



