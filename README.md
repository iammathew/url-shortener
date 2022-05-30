# URL Shortener

Simple url shortener built using Typescript, Node.js and Nest.js.

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
