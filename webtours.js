import http from 'k6/http'
import { check, group } from 'k6'
import { SharedArray } from 'k6/data';

const BASE_URL = 'https://test.k6.io'

const data = new SharedArray('users', () => {
  return JSON.parse(open('./users.json')).user
})

export const options = {
//   discardResponseBodies: true, // if you check only http-code
  scenarios: {
    base: {
      executor: 'constant-vus',
      exec: 'getBase',
      vus: 50,
      duration: '30s',
    },
    features: {
      executor: 'per-vu-iterations',
      exec: 'getFeatures',
      vus: 10,
      iterations: 100,
      startTime: '10s',
      maxDuration: '1m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<1'],
    http_req_duration: ['p(95)<300'],
  },
};

export function getBase() {
  // const res = http.get(BASE_URL);
  // check(res, {
  //   'status code is 200': (res) => res.status === 200,
  // });

  // const payload = { name: 'Bert' };
  // const headers = { headers: { 'Content-Type': 'application/json' } };
  // const resPost = http.post(
  //   'https://test.k6.io/flip_coin.php',
  //   JSON.stringify(payload),
  //   headers,
  // );
  // check(resPost, {
  //   'status code is 200': (resPost) => resPost.status === 200,
  // });
}


// HOME

export function getWelcomePage(){
  
  const res = http.get(`${BASE_URL}/welcome.pl`, {'signOff': true})
  check(res, {
    'get welcome page status is 200': res => res.status === 200
  })

}

export function getNavAtHome(){
  
  const res = http.get(`${BASE_URL}/nav.pl`, {'in': 'home'})
  check(res, {
    'get navigation in home status is 200': res => res.status === 200
  })

  const userSession = res.html().find('input[name="userSession"]').first().attr("value")

  return userSession

}

export function getHomePage(){

  const res = http.get(`${BASE_URL}/welcome.pl`)
  check(res, {
    'get authorized home page status is 200': res => res.status === 200
  })

}

// LOGIN
export function userLogin(userSession){

}

// FLIGHT
export function getFlightOptions(){

}


// LAOD SCENARIO
export default function () {
  
  const userSession = group("home", () => {
    getWelcomePage()
    const userSession = getNavAtHome()
    getHomePage()

    return userSession
  })

  group("login", () => userLogin(userSession))

  group("flights", () => {
    getFlightOptions()
  })

}