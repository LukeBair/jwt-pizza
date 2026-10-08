import { expect } from 'playwright-test-coverage';

export async function mockAuth(page) {
    await page.route('*/**/api/auth', async (route) => {
        const loginReq = { email: 'd@jwt.com', password: 'diner' };
        const loginRes = {
            user: {
                id: 3,
                name: 'Kai Chen',
                email: 'd@jwt.com',
                roles: [{ role: 'diner' }],
            },
            token: 'abcdef',
        };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
    });
}

export async function mockUserMe(page) {
    await page.route('*/**/api/user/me', async (route) => {
        expect(route.request().method()).toBe('GET');
        const userMeRes = {
            id: 3,
            name: 'Kai Chen',
            email: 'd@jwt.com',
            roles: [{ role: 'diner' }],
        };
        await route.fulfill({ json: userMeRes });
    });
}

export async function mockMenu(page) {
    await page.route('*/**/api/order/menu', async (route) => {
        expect(route.request().method()).toBe('GET');
        const menuRes = [
            {
                id: 0,
                title: "Veggie",
                description: "Image Description Veggie A",
                image: "pizza1.jpg", //?
                price: 0.0038,
            },
            {
                id: 1,
                title: "Pepperoni",
                description: "Image Description Pepperoni",
                image: "pizza2.jpg", //?
                price: 0.0042,
            }
        ];
        await route.fulfill({ json: menuRes });
    });
}

export async function mockFranchises(page) {
    await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
        expect(route.request().method()).toBe('GET');
        const franchisesRes = [
            { id: 2, name: 'LotaPizza', stores: [{ id: 4, name: 'Lehi' }] },
            { id: 3, name: 'Pizza Planet', stores: [{ id: 5, name: 'Provo' }] }
        ];
        await route.fulfill({ json: { franchises: franchisesRes } });
    });
}

export async function mockOrder(page) {
    await page.route('*/**/api/order', async (route) => {
        expect(route.request().method()).toBe('POST');
        const orderReq = route.request().postDataJSON();
        const orderRes = {
            order: { ...orderReq, id: 23 },
            jwt: 'eyJpYXQ',
        };
        await route.fulfill({ json: orderRes });
    });
}

export async function mockRegister(page) {
    await page.route('*/**/api/auth', async (route) => {
        if (route.request().method() !== 'POST') {
            await route.fallback();
            return;
        }
        const registerReq = route.request().postDataJSON();
        const registerRes = {
            user: {
                id: 4,
                name: registerReq.name,
                email: registerReq.email,
                roles: [{ role: 'diner' }],
            },
            token: 'ghijkl',
        };
        await route.fulfill({ json: registerRes });
    });
}

export async function mockLogout(page) {
    await page.route('*/**/api/auth', async (route) => {
        if (route.request().method() !== 'DELETE') {
            await route.fallback();
            return;
        }
        await route.fulfill({ json: { message: 'logout successful' } });
    });
}

export async function mockOrderHistory(page) {
    await page.route('*/**/api/order', async (route) => {
        if (route.request().method() !== 'GET') {
            await route.fallback();
            return;
        }
        const orderHistoryRes = {
            dinerId: 3,
            orders: [
                {
                    id: 23,
                    franchiseId: 2,
                    storeId: 4,
                    date: '2026-10-01T00:00:00.000Z',
                    items: [
                        { menuId: 0, description: 'Veggie', price: 0.0038 },
                        { menuId: 1, description: 'Pepperoni', price: 0.0042 },
                    ],
                },
            ],
            page: 1,
        };
        await route.fulfill({ json: orderHistoryRes });
    });
}

export async function mockVerifyOrder(page) {
    await page.route('*/**/api/order/verify', async (route) => {
        expect(route.request().method()).toBe('POST');
        const verifyRes = {
            message: 'valid',
            payload: { id: 23 },
        };
        await route.fulfill({ json: verifyRes });
    });
}

export async function mockUserFranchises(page) {
    await page.route(/\/api\/franchise\/\d+$/, async (route) => {
        expect(route.request().method()).toBe('GET');
        const userFranchisesRes = [
            {
                id: 2,
                name: 'LotaPizza',
                admins: [{ id: 3, name: 'Kai Chen', email: 'd@jwt.com' }],
                stores: [{ id: 4, name: 'Lehi', totalRevenue: 0.005 }],
            },
        ];
        await route.fulfill({ json: userFranchisesRes });
    });
}

export async function mockCreateStore(page) {
    await page.route(/\/api\/franchise\/\d+\/store$/, async (route) => {
        if (route.request().method() !== 'POST') {
            await route.fallback();
            return;
        }
        const storeReq = route.request().postDataJSON();
        expect(storeReq).toMatchObject({ name: 'Orem' });
        await route.fulfill({ json: { id: 6, name: storeReq.name } });
    });
}

export async function mockCloseStore(page) {
    await page.route(/\/api\/franchise\/\d+\/store\/\d+$/, async (route) => {
        if (route.request().method() !== 'DELETE') {
            await route.fallback();
            return;
        }
        await route.fulfill({ json: {} });
    });
}

export async function mockDocs(page) {
    await page.route('*/**/api/docs', async (route) => {
        expect(route.request().method()).toBe('GET');
        const docsRes = {
            endpoints: [
                {
                    method: 'POST',
                    path: '/api/auth',
                    requiresAuth: false,
                    description: 'Register a new user',
                    example: 'curl -X POST localhost:3000/api/auth',
                    response: { user: { id: 4, name: 'pizza diner', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'ghijkl' },
                },
            ],
        };
        await route.fulfill({ json: docsRes });
    });
}

export async function basicInit(page) {
    await mockAuth(page);
    await mockUserMe(page);
    await mockMenu(page);
    await mockFranchises(page);
    await mockOrder(page);
}

