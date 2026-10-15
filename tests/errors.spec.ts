import { test, expect } from './testSetup.js';
import { basicInit } from './mocks.js';

test('failed login stays on the login page', async ({ page }) => {
    await basicInit(page);
    await page.route('*/**/api/auth', async (route) => {
        if (route.request().method() !== 'PUT') {
            await route.fallback();
            return;
        }
        await route.fulfill({ status: 404, json: { message: 'unknown user' } });
    });
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrong');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('link', { name: 'KC' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('stale token is discarded on load', async ({ page }) => {
    await basicInit(page);
    await page.route('*/**/api/user/me', async (route) => {
        await route.fulfill({ status: 401, json: { message: 'unauthorized' } });
    });
    await page.addInitScript(() => window.localStorage.setItem('token', 'stale'));
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('token'))).toBeNull();
});

async function orderPizza(page) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Order now' }).click();
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Password').fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
}

test('payment failure shows an error', async ({ page }) => {
    await basicInit(page);
    await page.route('*/**/api/order', async (route) => {
        await route.fulfill({ status: 500, json: { message: 'factory down' } });
    });
    await orderPizza(page);
    await page.getByRole('button', { name: 'Pay now' }).click();

    await expect(page.getByRole('main')).toContainText('factory down');
});

test('delivery verify failure shows a bad pizza', async ({ page }) => {
    await basicInit(page);
    await page.route('*/**/api/order/verify', async (route) => {
        await route.fulfill({ status: 500, json: { message: 'invalid' } });
    });
    await orderPizza(page);
    await page.getByRole('button', { name: 'Pay now' }).click();
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page.getByRole('main')).toContainText('bad pizza');
});

test('diner dashboard shows franchisee roles', async ({ page }) => {
    await basicInit(page);
    await page.route('*/**/api/auth', async (route) => {
        if (route.request().method() !== 'PUT') {
            await route.fallback();
            return;
        }
        const loginRes = {
            user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }, { role: 'franchisee', objectId: '2' }] },
            token: 'abcdef',
        };
        await route.fulfill({ json: loginRes });
    });
    await page.route('*/**/api/order', async (route) => {
        if (route.request().method() !== 'GET') {
            await route.fallback();
            return;
        }
        await route.fulfill({ json: { dinerId: 3, orders: [], page: 1 } });
    });
    await page.goto('/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'KC' }).click();

    await expect(page.getByRole('main')).toContainText('Franchisee on 2');
});
