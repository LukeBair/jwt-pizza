import { test, expect } from './testSetup.js';
import { basicInit, mockOrderHistory, mockUpdateUser } from './mocks.js';

test('update user dialog', async ({ page }) => {
    await basicInit(page);
    await mockOrderHistory(page);
    await mockUpdateUser(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'KC' }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.locator('h3')).toContainText('Edit user');
    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await expect(page.getByRole('main')).toContainText('Kai Chen');
});

test('update user name', async ({ page }) => {
    await basicInit(page);
    await mockOrderHistory(page);
    await mockUpdateUser(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'KC' }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('textbox').first().fill('Kai Chen X');
    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await expect(page.getByRole('main')).toContainText('Kai Chen X');
});

test('update user email and password', async ({ page }) => {
    await basicInit(page);
    await mockOrderHistory(page);
    await mockUpdateUser(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'KC' }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('input[type="email"]').fill('kai@jwt.com');
    await page.locator('#password').fill('newpass');
    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await expect(page.getByRole('main')).toContainText('kai@jwt.com');
});
