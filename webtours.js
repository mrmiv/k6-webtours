import http from 'k6/http'
import { check, group } from 'k6'
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const BASE_URL = 'http://webtours.load-test.ru:1080/cgi-bin'

export const options = {
//   discardResponseBodies: true, // if you check only http-code
//   scenarios: {
//     base: {
//       executor: 'constant-vus',
//       exec: 'getBase',
//       vus: 50,
//       duration: '30s',
//     },
//     features: {
//       executor: 'per-vu-iterations',
//       exec: 'getFeatures',
//       vus: 10,
//       iterations: 100,
//       startTime: '10s',
//       maxDuration: '1m',
//     },
//   },
//   thresholds: {
//     http_req_failed: ['rate<1'],
//     http_req_duration: ['p(95)<300'],
//   },
}

// LOAD SCENARIO
export default function () {
    
  let flightParams = {

    'departCity': '',
    'arriveCity': '',

    'departDate': '', // ISO formant 2023-07-20 - Date.now() 
    'returnDate': '', // ISO formant 2023-07-20 - Date.now() 

    'seatPref': '',
    'seatType': '',

    'advanceDiscount': '0',
    'numPassengers': '1',

    'roundtrip': undefined, // on or undefined

    'outboundFlight': '',

  }

  let user = {
    "username": "marco", 
    "password": "test123",
    'userSession': '',
    
    'lastName': '',
    'firsName': '',

    'address1': '', // city
    'address2': '', // adress

    'pass1': '',
    'creditCard': '',
    'expDate': ''
  }

   group("home", () => {

    getWelcomePage()
    user['userSession'] = getNavAtHome()
    getHomePage()

  })

  group("login", () => {

    userLogin(user.userSession, user.username, user.password)
    getLoggedInNav()

  })

  group("flights", () => {

    getSearchFlightPage()
    getNavigationInFlights()
    const {departCity, arriveCity, seatPref, seatType} = getReservationsList()

    flightParams['departCity'] = departCity
    flightParams['arriveCity'] = arriveCity
    flightParams['seatPref'] = seatPref
    flightParams['seatType'] = seatType
    flightParams['departDate'] = new Date().toISOString()
    flightParams['returnDate'] = new Date().toISOString()

    flightParams['outboundFlight'] = setFlightOptions(flightParams)
    selectFlight()
    setPaymentDetails({...flightParams, ...user}) // combine object flightParams with object user

  })

}

///// HOME /////

export function getWelcomePage(){

  const params = {
    'signOff': true
  }
  
  const res = http.get(`${BASE_URL}/welcome.pl`, params)
  check(res, {
    'get welcome page status is 200': res => res.status === 200
  })

}

export function getNavAtHome(){

  const params = {
    'in': 'home'
  }
  
  const res = http.get(`${BASE_URL}/nav.pl`, params)
  check(res, {
    'get navigation in home status is 200': res => res.status === 200
  })

  const userSession = res.html().find('input[name="userSession"]').val()
  return userSession

}

export function getHomePage(){

  const res = http.get(`${BASE_URL}/welcome.pl`)
  check(res, {
    'get authorized home page status is 200': res => res.status === 200
  })

}

///// LOGIN /////

export function userLogin(userSession, username, password){

  const payload = {
    'userSession': userSession,
    'username': username,
    'password': password
  }
  
  const headers = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded' 
    }
  }

  const res = http.post(`${BASE_URL}/login.pl`, payload, headers)
  check(res, {
    'login status is 200': res => res.status === 200
  })

}

export function getLoggedInNav(){

  const params = { 
    'in': 'home',
    'page': 'menu'
  }

  const res = http.get(`${BASE_URL}/nav.pl`, params)
  check(res, {
    'get authorized nav in home status is 200': res => res.status === 200
  })

}

///// FLIGHT /////

export function getSearchFlightPage(){

  const params = {
    'page': 'search'
  }

  const res = http.get(`${BASE_URL}/welcome.pl`, params)
  check(res, {
    'get search flight page status is 200': res => res.status === 200
  })

}

export function getNavigationInFlights() {
  
  const params = {
    'page': 'menu',
    'in': 'flights'
  }

  const res = http.get(`${BASE_URL}/nav.pl`, params)
  check(res, {
    'get nav in flights page status is 200': res => res.status === 200
  })

}

export function getReservationsList(){

  const params = {
    'page': 'welcome'
  }

  const res = http.get(`${BASE_URL}/reservations.pl`, params)
  check(res, {
    'get reservations list status is 200': res => res.status === 200
  })

  let flightParams = {
    'departCity': '',
    'arriveCity': '',
    'seatPref': '',
    'seatType': '',
  }

  flightParams['departCity'] = randomItem(res.html().find('select[name=depart]').children().map((idx, el) => el.val()))
  flightParams['arriveCity'] = randomItem(res.html().find('select[name=arrive]').children().map((idx, el) => el.val()))
  flightParams['seatPref'] = randomItem(res.html().find('input[name=seatPref]').map((idx, el) => el.val()))
  flightParams['seatType'] = randomItem(res.html().find('input[name=seatType]').map((idx, el) => el.val()))

  return flightParams

}

export function setFlightOptions({advanceDiscount, departCity, departDate, arriveCity, returnDate, numPassengers, seatPref, seatType, roundtrip}){

  const payload = {

    'advanceDiscount': advanceDiscount,
    'depart': departCity,
    'departDate': departDate,
    'arrive': arriveCity,
    'returnDate': returnDate,
    'numPassengers': numPassengers,
    'seatPref': seatPref,
    'seatType': seatType,
    'roundtrip': roundtrip,

    'findFlights.y': '9',
    'findFlights.x': '54',
    '.cgifields': ['roundtrip', 'seatType', 'seatPref']
  }

  const headers = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Upgrade-Insecure-Requests': '1'
    }
  }

  const res = http.post(`${BASE_URL}/reservations.pl`, payload, headers)
  check(res, {
    'set flight options status is 200': res => res.status === 200,
    'outbound flight exist': res => res.html().find('input[name=outboundFlight]').first().val() !== undefined
  })

  const outboundFlight = randomItem(res.html().find('input[name=seatType]').map((idx, el) => el.val()))

  return outboundFlight

}

export function selectFlight({outboundFlight, advanceDiscount, numPassengers, seatPref, seatType}){

  const payload = {

    'outboundFlight': outboundFlight,
    'advanceDiscount': advanceDiscount,
    'numPassengers': numPassengers,
    'seatPref': seatPref,
    'seatType': seatType,

    'reserveFlights.x': '8',
    'reserveFlights.y': '10'
  }

  const headers = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Upgrade-Insecure-Requests': '1'
    }
  }

  const res = http.post(`${BASE_URL}/reservations.pl`, payload, headers)
  check(res, {
    'select flight status is 200': res => res.status === 200,
    'page Payment Details is open': res => res.html().find('Payment Details').text() !== undefined
  })

}

export function setPaymentDetails({outboundFlight, advanceDiscount, numPassengers, seatPref, seatType, firsName, lastName, address1, address2, pass1, creditCard, expDate}){

  const payload = {

    'outboundFlight': outboundFlight,
    'advanceDiscount': advanceDiscount,
    'numPassengers': numPassengers,
    'seatPref': seatPref,
    'seatType': seatType,
    'firstName': firsName,
    'lastName': lastName,
    'address1': address1,
    'address2': address2,
    'pass1': pass1,
    'creditCard': creditCard,
    'expDate': expDate,

    'buyFlights.x': '40',
    'buyFlights.y': '10',
    '.cgifields': ['saveCC']
  }

  const headers = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Upgrade-Insecure-Requests': '1'
    }
  }

  const res = http.post(`${BASE_URL}/reservations.pl`, payload, headers)
  check(res, {
    'set payment options status is 200': res => res.status === 200,
    'page Invoice is open': res => res.html().find('Invoice').text() !== undefined
  })

}