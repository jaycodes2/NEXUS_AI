import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '10s', target: 0 },
  ],
};

let logged = 0;

export default function () {
  const res = http.post('http://localhost:5000/api/memory/ask',
    JSON.stringify({ question: 'test query about pricing' }),
    { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${__ENV.TEST_TOKEN}` } }
  );

  if (res.status !== 200 && logged < 5) {
    console.log('STATUS:', res.status, 'BODY:', res.body);
    logged++;
  }

  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}