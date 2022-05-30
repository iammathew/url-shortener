# URL Shortener

Simple url shortener built using Typescript, Node.js and Nest.js.

## Considerations

### Length of url

Since the goal is to shorten the url choosing the right length of the id/code is essential.
For the sake of supporting most character sets, the project uses `base64url` as encoding.
This means we have 64 possible characters:

- 4 characters long => 16.777.216 possible ids
- 5 characters long => 1.073.741.824 possible ids
- 6 characters long => 68.719.476.736 possible ids

5 characters should already be long enough for most url shorteners, but to be on the safe side and reduce collisions 6 characters seems like the best option (tradeoff length / id space).
If we ever run out of possible ids, it is of course possible to increase to 7 characters (contrary to similar cases like IPv4 where it is not possible to increase the address amounts easily).

### Database

URL Shorteners usually have a read-heavy workload, links get accessed multiple hundred or thousand times and created only once.
The data is overall structured, therefore SQL databases can be used. The scalability of NoSQL databases can be achieved by caching.

#### Database choice

For the sake of ease of deployment, this project currently uses a local SQLite database. In a real production scenario a database like postgres is more suitable.
Prisma allows changing the database quite easily, without much complications.

#### Caching

Read-heavy workloads benefit from heavy caching, therefore there is a cache introduced that can utilize Redis in order to speed up lookups for shortened URLs.
In the current configuration the app uses an in-memory cache instead of Redis, but it can easily be switched over to Redis for production.

Drawbacks of caching:

- Redirection may not be up-to-date (in case somebody changes the target url, if it is supported)

### Scalability

The service can be easily deployed horizontally across multiple nodes since it is almost stateless (see stats collection) pointing to the same database and optionally to the same cache.
Once the database can't be scaled vertically any longer, one can add read-replicas which should boost the scalability quite heavily (as mentioned above since the workload is read-heavy)!

### Latency

A redirection service needs to be as unobtrusive as possible, therefore caching is utilized to keep latencies low, and redirections fast.
All stats collection is done asynchronously returning the redirection result as early as possible.

I did some basic load testing and overall the latency is good, but with the amount of concurrent connections the latency increases (as expected).
For results see below!

### Stat collection

Databases can be quite easily overloaded by initiating 1000s of requests, increasing the hit count. Therefore hits get counted first locally and every X milliseconds (specified in settings) flushed into the database.
In addition atomic number operations are used in order to ensure, that multiple running instances of the URL shortener can flush their metrics at the same time, without causing race conditions.

Warning: Stat collection may not be 100% accurate due to the flush interval, but in the scheme of greater things the lost hits (in case of service shutdown) are most likely insignificant.

### Testing philosophy

The application is very IO heavy therefore unit tests provide little value for most parts (since you need to mock databases and functions do almost just pass data around).
E2E tests reflect the end user experience and guarantee overall functionality of the application better, though not the correctness of each single function.
This application runs e2e tests against the real database (should be switched to a separate created database).

### Privacy concerns & security

#### Stats

Currently stats are openly visible using the same id/code as the redirection, therefore anyone can check the amount of hits a url received.

- If the owner of a service is a single entity the best appraoch is securing each endpoint starting with `/url`
- If the service requires an account in order to create shortened urls, checking if the user is owner of the url should suffice.
- If the service requires no account in order to create shortened urls, two separate ids should be created (one public for redirection, one private for stats checking).

#### TLS

This application is meant (at the moment) to be run behind a reverse proxy like nginx, that takes care of the TLS termination (in this case for tier.app), throttling etc.

### Things left to do

- [] Add CI/CD setup
- [] Add loadtesting setup (comparison between cache/nocache, huge amount of different urls etc.)
- [] Add monitoring for service (metrics like urls created, hits and cache hit rate, last stats flush, as well as all general things like response times, status codes, etc.)
- [] Bundling the application up more nicely (Containerize application)
- [] Switch to production database (Postgres) and production cache (Redis)
- [] Add browser based testing
- [] Nicer way to read config instead of hardcoded code file
- [] Finer grained configuration, like switching between inmemory and redis cache
- [] More elaborate tests, like checking everything works correctly when flushing fails etc.

## Requirements

- Node.js (tested on v17.0.1, but anything recent should work)
- NPM

## Installation

```bash
$ npm install
```

## Running the app

Run this to run migrations before starting the application

```bash
$ npx prisma migrate dev
```

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

Afterwards the app listens on port 3000

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Loadtesting results

Loadtesting results using `autocannon`, not done in the most scientific way since it only checks redirection of one url and its only a single run, but should give some clues!

### With cache

100 connections (333k requests in 60s):

```sh
❯ autocannon -c 100 -p 10 -d 60 http://localhost:3000/pZtPV1
Running 60s test @ http://localhost:3000/pZtPV1
100 connections with 10 pipelining factor


┌─────────┬────────┬────────┬────────┬────────┬───────────┬──────────┬────────┐
│ Stat    │ 2.5%   │ 50%    │ 97.5%  │ 99%    │ Avg       │ Stdev    │ Max    │
├─────────┼────────┼────────┼────────┼────────┼───────────┼──────────┼────────┤
│ Latency │ 156 ms │ 171 ms │ 237 ms │ 263 ms │ 179.86 ms │ 25.16 ms │ 423 ms │
└─────────┴────────┴────────┴────────┴────────┴───────────┴──────────┴────────┘
┌───────────┬────────┬─────────┬─────────┬─────────┬─────────┬────────┬────────┐
│ Stat      │ 1%     │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev  │ Min    │
├───────────┼────────┼─────────┼─────────┼─────────┼─────────┼────────┼────────┤
│ Req/Sec   │ 3361   │ 4095    │ 5579    │ 6151    │ 5539.8  │ 470.21 │ 3361   │
├───────────┼────────┼─────────┼─────────┼─────────┼─────────┼────────┼────────┤
│ Bytes/Sec │ 921 kB │ 1.12 MB │ 1.53 MB │ 1.69 MB │ 1.52 MB │ 129 kB │ 921 kB │
└───────────┴────────┴─────────┴─────────┴─────────┴─────────┴────────┴────────┘

Req/Bytes counts sampled once per second.
# of samples: 60

0 2xx responses, 332361 non 2xx responses
333k requests in 60.05s, 91.1 MB read
```

10 connections (331k requests in 60s):

```sh
❯ autocannon -c 10 -p 10 -d 60 http://localhost:3000/pZtPV1
Running 60s test @ http://localhost:3000/pZtPV1
10 connections with 10 pipelining factor


┌─────────┬───────┬───────┬───────┬───────┬──────────┬─────────┬───────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev   │ Max   │
├─────────┼───────┼───────┼───────┼───────┼──────────┼─────────┼───────┤
│ Latency │ 13 ms │ 16 ms │ 34 ms │ 38 ms │ 17.66 ms │ 6.26 ms │ 92 ms │
└─────────┴───────┴───────┴───────┴───────┴──────────┴─────────┴───────┘
┌───────────┬────────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────┐
│ Stat      │ 1%     │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev   │ Min    │
├───────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ Req/Sec   │ 4387   │ 4719    │ 5599    │ 5895    │ 5510.2  │ 280.52  │ 4386   │
├───────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ Bytes/Sec │ 1.2 MB │ 1.29 MB │ 1.53 MB │ 1.62 MB │ 1.51 MB │ 76.9 kB │ 1.2 MB │
└───────────┴────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┘

Req/Bytes counts sampled once per second.
# of samples: 60

0 2xx responses, 330589 non 2xx responses
331k requests in 60.01s, 90.6 MB read
```

### Without cache

100 connections (288k requests in 60s):

```sh
❯ autocannon -c 100 -p 10 -d 60 http://localhost:3000/pZtPV1
Running 60s test @ http://localhost:3000/pZtPV1
100 connections with 10 pipelining factor


┌─────────┬────────┬────────┬────────┬────────┬──────────┬──────────┬────────┐
│ Stat    │ 2.5%   │ 50%    │ 97.5%  │ 99%    │ Avg      │ Stdev    │ Max    │
├─────────┼────────┼────────┼────────┼────────┼──────────┼──────────┼────────┤
│ Latency │ 178 ms │ 202 ms │ 266 ms │ 292 ms │ 208.2 ms │ 26.66 ms │ 442 ms │
└─────────┴────────┴────────┴────────┴────────┴──────────┴──────────┴────────┘
┌───────────┬────────┬────────┬─────────┬─────────┬─────────┬────────┬────────┐
│ Stat      │ 1%     │ 2.5%   │ 50%     │ 97.5%   │ Avg     │ Stdev  │ Min    │
├───────────┼────────┼────────┼─────────┼─────────┼─────────┼────────┼────────┤
│ Req/Sec   │ 2889   │ 4001   │ 5003    │ 5391    │ 4787.04 │ 419.31 │ 2888   │
├───────────┼────────┼────────┼─────────┼─────────┼─────────┼────────┼────────┤
│ Bytes/Sec │ 792 kB │ 1.1 MB │ 1.37 MB │ 1.48 MB │ 1.31 MB │ 115 kB │ 791 kB │
└───────────┴────────┴────────┴─────────┴─────────┴─────────┴────────┴────────┘

Req/Bytes counts sampled once per second.
# of samples: 60

0 2xx responses, 287148 non 2xx responses
288k requests in 60.05s, 78.7 MB read
```

10 connections (293k requests in 60s):

```sh
❯ autocannon -c 10 -p 10 -d 60 http://localhost:3000/pZtPV1
Running 60s test @ http://localhost:3000/pZtPV1
10 connections with 10 pipelining factor


┌─────────┬───────┬───────┬───────┬───────┬───────┬─────────┬────────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg   │ Stdev   │ Max    │
├─────────┼───────┼───────┼───────┼───────┼───────┼─────────┼────────┤
│ Latency │ 14 ms │ 17 ms │ 39 ms │ 46 ms │ 20 ms │ 9.67 ms │ 265 ms │
└─────────┴───────┴───────┴───────┴───────┴───────┴─────────┴────────┘
┌───────────┬────────┬─────────┬─────────┬─────────┬─────────┬────────┬────────┐
│ Stat      │ 1%     │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev  │ Min    │
├───────────┼────────┼─────────┼─────────┼─────────┼─────────┼────────┼────────┤
│ Req/Sec   │ 3343   │ 3823    │ 4899    │ 5607    │ 4878.94 │ 459.94 │ 3342   │
├───────────┼────────┼─────────┼─────────┼─────────┼─────────┼────────┼────────┤
│ Bytes/Sec │ 916 kB │ 1.05 MB │ 1.34 MB │ 1.54 MB │ 1.34 MB │ 126 kB │ 916 kB │
└───────────┴────────┴─────────┴─────────┴─────────┴─────────┴────────┴────────┘

Req/Bytes counts sampled once per second.
# of samples: 60

0 2xx responses, 292711 non 2xx responses
293k requests in 60.02s, 80.2 MB read
```
