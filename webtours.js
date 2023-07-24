import http from 'k6/http'

export let options = {

  thresholds: {
    // 90% of requests must finish within 400ms.
    http_req_duration: ['p(90) < 400'], 
  }
}

export default function () {

  http.get('https://test.k6.io')

}