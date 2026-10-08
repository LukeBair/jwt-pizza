import { test, expect } from './testSetup.js';
import { basicInit, mockCloseStore, mockCreateStore, mockDocs, mockLogout, mockOrderHistory, mockRegister, mockUserFranchises, mockVerifyOrder } from './mocks.js';

test('home page', async ({ page }) => {
    await page.goto('/');

    expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
    await basicInit(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Order now' }).click();
    await expect(page.locator('h2')).toContainText('Awesome is a click away');
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await expect(page.locator('form')).toContainText('Selected pizzas: 2');
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
    await expect(page.locator('tbody')).toContainText('Veggie');
    await page.getByRole('button', { name: 'Pay now' }).click();
    await expect(page.getByRole('main')).toContainText('0.008 ₿');
});

test('login', async ({ page }) => {
    await basicInit(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('register', async ({ page }) => {
    await basicInit(page);
    await mockRegister(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill('Luke Bair');
    await page.getByRole('textbox', { name: 'Email address' }).fill('lukebair@me.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('abc123');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByRole('link', { name: 'LB' })).toBeVisible();
});
test('logout', async ({ page }) => {
    await basicInit(page);
    await mockLogout(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();

    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});

test('diner dashboard shows order history', async ({ page }) => {
    await basicInit(page);
    await mockOrderHistory(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'KC' }).click();

    await expect(page.getByRole('heading', { name: 'Your pizza kitchen' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Kai Chen');
    await expect(page.getByRole('main')).toContainText('d@jwt.com');
    await expect(page.locator('tbody')).toContainText('23');
    await expect(page.locator('tbody')).toContainText('0.008 ₿');
});

test('delivery verify', async ({ page }) => {
    await basicInit(page);
    await mockVerifyOrder(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Order now' }).click();
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Password').fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('button', { name: 'Pay now' }).click();
    await expect(page.getByRole('main')).toContainText('0.008 ₿');
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page.getByRole('heading', { name: 'JWT Pizza - valid' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('"id": 23');
});

test('franchise dashboard', async ({ page }) => {
    await basicInit(page);
    await mockUserFranchises(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Franchise' }).click();

    await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
    await expect(page.locator('tbody')).toContainText('Lehi');
    await expect(page.locator('tbody')).toContainText('0.005 ₿');
});

test('create store', async ({ page }) => {
    await basicInit(page);
    await mockUserFranchises(page);
    await mockCreateStore(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Franchise' }).click();
    await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
    await page.getByRole('button', { name: 'Create store' }).click();
    await page.getByPlaceholder('store name').fill('Orem');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
});

test('close store', async ({ page }) => {
    await basicInit(page);
    await mockUserFranchises(page);
    await mockCloseStore(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Franchise' }).click();
    await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('main')).toContainText('Lehi');
    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
});

test('docs', async ({ page }) => {
    await mockDocs(page);
    await page.goto('/docs');

    await expect(page.getByRole('heading', { name: 'JWT Pizza API' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('[POST] /api/auth');
    await expect(page.getByRole('main')).toContainText('Register a new user');

    await page.goto('/docs/factory');
    await expect(page.getByRole('main')).toContainText('[POST] /api/auth');
});
