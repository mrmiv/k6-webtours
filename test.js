import { check } from 'k6'
import http from 'k6/http'

const config = {
  yaru: {
    baseUrl: 'http://ya.ru',
    maxRpm: 60
  },
  wwwru: {
    baseUrl: 'http://www.ru',
    maxRpm: 120
  }
}

export const options = {
    discardResponseBodies: true, // if you check only http-code
  scenarios: {
    wwwru: {
      executor: 'ramping-vus',
      exec: 'openWWWRu',
      stages: [
        {duration: '5m', target: config.wwwru.maxRpm},
        {duration: '10m', target: config.wwwru.maxRpm},
        {duration: '5m', target: (config.wwwru.maxRpm*1.2).toFixed(0)},
        {duration: '10m', target: (config.wwwru.maxRpm*1.2).toFixed(0)}
      ]
    },
    yaru: {
      executor: 'ramping-vus',
      exec: 'openYaRu',
      stages: [
        {duration: '5m', target: config.yaru.maxRpm},
        {duration: '10m', target: config.yaru.maxRpm},
        {duration: '5m', target: (config.yaru.maxRpm*1.2).toFixed(0) },
        {duration: '10m', target: (config.yaru.maxRpm*1.2).toFixed(0) }
      ]
    },
  },
  thresholds: {
    http_req_failed: ['rate < 0.05'],
    http_req_duration: ['p(95) < 350'],
  },
}

export function openYaRu() {
  
  const res = http.get(config.yaru.baseUrl, {tags: {system: 'ya.ru'}})
  check(res, {
    'ya.ru status is 200': res => res.status === 200
  }, {system: 'ya.ru'})

}

export function openWWWRu() {
  
  const res = http.get(config.wwwru.baseUrl, {tags: {system: 'www.ru'}})
  check(res, {
    'www.ru status is 200': res => res.status === 200
  }, {system: 'www.ru'})

}

export default function(){

  openWWWRu()
  openYaRu()

}

