import { sleep, check, group, fail } from 'k6'
import http from 'k6/http'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 20, duration: '30s' },
        { target: 40, duration: '30s' },
        { target: 5, duration: '15s' },
        { target: 0, duration: '15s' },
      ],
      gracefulRampDown: '30s',
      exec: 'scenario_1',
    },
  },
}

const SERVICE = 'https://pizza-service.bigbair.com'
const FACTORY = 'https://pizza-factory.cs329.click'
const JSON_HEADERS = { 'content-type': 'application/json' }

function authHeaders(token) {
  return { headers: { ...JSON_HEADERS, authorization: `Bearer ${token}` } }
}

// The service gives identical tokens to the same user logging in within the same
// second, so one VU's logout would invalidate another VU's session. Give every VU
// its own user so tokens never collide.
const USER_COUNT = 40
const PASSWORD = 'loadtest'
const userEmail = (i) => `loadtest-${i}@jwt.com`

export function setup() {
  for (let i = 1; i <= USER_COUNT; i++) {
    const body = JSON.stringify({ name: `load test ${i}`, email: userEmail(i), password: PASSWORD })
    // A missing user is expected here (it gets registered below), so don't count it as a failure
    const login = http.put(`${SERVICE}/api/auth`, body, {
      headers: JSON_HEADERS,
      responseCallback: http.expectedStatuses(200, 404),
    })
    if (login.status !== 200) {
      http.post(`${SERVICE}/api/auth`, body, { headers: JSON_HEADERS })
    }
  }
}

export function scenario_1() {
  let response
  const email = userEmail(((__VU - 1) % USER_COUNT) + 1)

  group('Login and Order - https://pizza.bigbair.com/', function () {
    // Login: capture the auth token from the response
    response = http.put(
      `${SERVICE}/api/auth`,
      JSON.stringify({ email, password: PASSWORD }),
      { headers: JSON_HEADERS }
    )
    if (
      !check(response, {
        'login status equals 200': (r) => r.status === 200,
      })
    ) {
      console.log(response.body)
      fail('Login was *not* 200')
    }
    const token = response.json('token')
    sleep(1.7)

    // Get Menu
    response = http.get(`${SERVICE}/api/order/menu`, { headers: JSON_HEADERS })
    response = http.get(`${SERVICE}/api/franchise?page=0&limit=20&name=*`, authHeaders(token))
    sleep(2.75)

    response = http.get(`${SERVICE}/api/user/me`, authHeaders(token))
    sleep(1.3)

    // Order Pizza: capture the pizza JWT from the response
    response = http.post(
      `${SERVICE}/api/order`,
      JSON.stringify({
        items: [
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          { menuId: 1, description: 'Veggie', price: 0.0038 },
        ],
        storeId: '1',
        franchiseId: 1,
      }),
      authHeaders(token)
    )
    const orderOk = check(response, {
      'order status equals 200': (r) => r.status === 200,
    })
    const pizzaJwt = orderOk ? response.json('jwt') : null
    sleep(2)

    // Verify the pizza JWT (read from the order response, not hard-coded)
    if (pizzaJwt) {
      response = http.post(`${FACTORY}/api/order/verify`, JSON.stringify({ jwt: pizzaJwt }), {
        headers: JSON_HEADERS,
      })
      check(response, {
        'verify status equals 200': (r) => r.status === 200,
      })
      sleep(1)
    }

    // Logout
    response = http.del(`${SERVICE}/api/auth`, null, authHeaders(token))
    check(response, {
      'logout status equals 200': (r) => r.status === 200,
    })
  })
}
