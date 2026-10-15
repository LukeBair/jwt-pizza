import { test, expect } from './testSetup.js';
import { basicInit, mockAdminAuth, mockDeleteUser, mockListUsers } from './mocks.js';

test('admin dashboard lists users', async ({ page }) => {
    await basicInit(page);
    await mockAdminAuth(page);
    await mockListUsers(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Admin' }).click();

    const users = page.getByRole('table', { name: 'Users' });
    await expect(users).toContainText('Admin Person');
    await expect(users).toContainText('a@jwt.com');
    await expect(users).toContainText('admin');
    await expect(users).toContainText('Buddy');
    await expect(users).toContainText('Kai Chen');
    await expect(users).not.toContainText('Franny');
});

test('admin dashboard pages through users', async ({ page }) => {
    await basicInit(page);
    await mockAdminAuth(page);
    await mockListUsers(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Admin' }).click();

    const users = page.getByRole('table', { name: 'Users' });
    await users.getByRole('button', { name: '»' }).click();
    await expect(users).toContainText('Franny');
    await expect(users).toContainText('franchisee');
    await expect(users).not.toContainText('Buddy');
    await expect(users.getByRole('button', { name: '»' })).toBeDisabled();

    await users.getByRole('button', { name: '«' }).click();
    await expect(users).toContainText('Buddy');
    await expect(users).not.toContainText('Franny');
});

test('admin dashboard filters users', async ({ page }) => {
    await basicInit(page);
    await mockAdminAuth(page);
    await mockListUsers(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Admin' }).click();

    const users = page.getByRole('table', { name: 'Users' });
    await users.getByPlaceholder('Filter users').fill('kai');
    await users.getByRole('button', { name: 'Submit' }).click();

    await expect(users).toContainText('Kai Chen');
    await expect(users).not.toContainText('Buddy');
});

test('admin dashboard deletes a user', async ({ page }) => {
    await basicInit(page);
    await mockAdminAuth(page);
    const allUsers = await mockListUsers(page);
    await mockDeleteUser(page, allUsers);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Admin' }).click();

    const users = page.getByRole('table', { name: 'Users' });
    await expect(users).toContainText('Buddy');
    await expect(users).not.toContainText('Franny');
    await users.getByRole('row', { name: /Buddy/ }).getByRole('button', { name: 'Delete' }).click();

    await expect(users).not.toContainText('Buddy');
    await expect(users).toContainText('Franny');
});

async function loginAsAdmin(page) {
    await basicInit(page);
    await mockAdminAuth(page);
    await mockListUsers(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Admin' }).click();
}

test('admin dashboard lists franchises and filters them', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByRole('main')).toContainText('LotaPizza');
    await expect(page.getByRole('main')).toContainText('Pizza Planet');
    await page.getByPlaceholder('Filter franchises').fill('Lota');
    await page.getByRole('table').first().getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('main')).toContainText('LotaPizza');
});

test('admin dashboard add franchise', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: 'Add Franchise' }).click();

    await expect(page).toHaveURL(/create-franchise/);
});

test('admin dashboard close franchise', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('row', { name: /LotaPizza/ }).getByRole('button', { name: 'Close' }).click();

    await expect(page).toHaveURL(/close-franchise/);
});

test('admin dashboard close store', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('row', { name: /Lehi/ }).getByRole('button', { name: 'Close' }).click();

    await expect(page).toHaveURL(/close-store/);
});
