import { test } from 'tap'
import fastifyCookie from 'fastify-cookie'
import fastifySession from 'fastify-session'
import fastifyPassport, { Strategy } from '../src'
import fastify from 'fastify'
import { AddressInfo } from 'net';
const requestCallback = require('request')

class TestStrategy extends Strategy {
  authenticate(request: any, options?: { pauseStream?: boolean }) {
    if (request.isAuthenticated()) {
      return this.pass!()
    }
    if (request.body && request.body.login === 'test' && request.body.password === 'test') {
      return this.success!({name: 'test'})
    }
    this.fail!()
  }
}

fastifyPassport.use(new TestStrategy('test'))
fastifyPassport.serializeUser((user, done) => {
  done(null, JSON.stringify(user))
})
fastifyPassport.deserializeUser((user, done) => {
  done(null, user)
})

test(`should return 401 Unauthorized if not logged in`, async (t) => {
  t.plan(2)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.get('/', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, async (request: any, reply) => 'hello world!')
  server.post('/login', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address()! as AddressInfo).port 

  const { response, body } = await request('http://localhost:' + port)

  t.is(body.toString(), 'Unauthorized')
  t.is(response.statusCode, 401)
})

test(`should add successMessage to session if logged in`, async (t) => {
  t.plan(4)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.get('/', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, async (request) => request['session'].messages)
  server.post('/login', {
    preValidation: fastifyPassport.authenticate('test', {
      successRedirect: '/',
      successMessage: 'welcome',
      authInfo: false
    })
  }, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 302)
  t.is(result1.response.headers.location, '/')

  const { response, body } = await request({
    url: 'http://localhost:' + port,
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(body.toString(), '["welcome"]')
  t.is(response.statusCode, 200)
})

test(`should execute successFlash if logged in`, async (t) => {
  t.plan(4)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.get('/', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, async (request, reply) => reply.flash('success'))
  server.post('/login', {
    preValidation: fastifyPassport.authenticate('test', {
      successRedirect: '/',
      successFlash: 'welcome',
      authInfo: false
    })
  }, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 302)
  t.is(result1.response.headers.location, '/')

  const { response, body } = await request({
    url: 'http://localhost:' + port,
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(body.toString(), '["welcome"]')
  t.is(response.statusCode, 200)
})

test(`should execute successFlash=true if logged in`, async (t) => {
  t.plan(4)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.get('/', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, async (request, reply) => reply.flash('success'))
  server.post('/login', {
    preValidation: fastifyPassport.authenticate('test', {
      successRedirect: '/',
      successFlash: true,
      authInfo: false
    })
  }, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 302)
  t.is(result1.response.headers.location, '/')

  const { response, body } = await request({
    url: 'http://localhost:' + port,
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(body.toString(), '[]')
  t.is(response.statusCode, 200)
})

test(`should return 200 if logged in`, async (t) => {
  t.plan(4)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.get('/', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, async () => 'hello world!')
  server.post('/login', {preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false })}, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 302)
  t.is(result1.response.headers.location, '/')

  const { response, body } = await request({
    url: 'http://localhost:' + port,
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(body.toString(), 'hello world!')
  t.is(response.statusCode, 200)
})

test(`should return use assignProperty option`, async (t) => {
  t.plan(1)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.post('/login', {
    preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', assignProperty: 'user', authInfo: false })
  }, (request: any, reply: any) => { reply.send(request.user) })

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.body.name, 'test')
})

test(`should return 200 if logged in`, async (t) => {
  t.plan(4)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.addHook('preValidation', async (request: any, reply) => {
    request.session.returnTo = '/success'
  })
  server.get('/success', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, async () => 'hello world!')
  server.post('/login', {preValidation: fastifyPassport.authenticate('test', { successReturnToOrRedirect: '/', authInfo: false })}, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 302)
  t.is(result1.response.headers.location, '/success')

  const { response, body } = await request({
    url: 'http://localhost:' + port + '/success',
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(body.toString(), 'hello world!')
  t.is(response.statusCode, 200)
})

test(`should return 200 if logged in and authInfo)true`, async (t) => {
  t.plan(4)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.get('/', {preValidation: fastifyPassport.authenticate('test', {authInfo: true})}, async () => 'hello world!')
  server.post('/login', {preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true })}, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 302)
  t.is(result1.response.headers.location, '/')

  const { response, body } = await request({
    url: 'http://localhost:' + port,
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(body.toString(), 'hello world!')
  t.is(response.statusCode, 200)
})

test(`should logout`, async (t) => {
  t.plan(4)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.get('/', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, async () => {})
  server.get('/logout', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, async (request: any, reply) => {
    request.logout()
    return 'logged out'
  })
  server.post('/login', {preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false })}, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 302)
  t.is(result1.response.headers.location, '/')

  const result2 = await request({
    url: 'http://localhost:' + port + '/logout',
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(result2.response.statusCode, 200)

  const { response } = await request({
    url: 'http://localhost:' + port,
    headers: {
      cookie: result2.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(response.statusCode, 401)
})

test(`should execute failureRedirect if failed to log in`, async (t) => {
  t.plan(2)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.post('/login', {preValidation: fastifyPassport.authenticate('test', { failureRedirect: '/failure', authInfo: false })}, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test1', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 302)
  t.is(result1.response.headers.location, '/failure')
})

test(`should add failureMessage to session if failed to log in`, async (t) => {
  t.plan(3)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())

  server.get('/', async (request) => request['session'].messages)
  server.post('/login', {
    preValidation: fastifyPassport.authenticate('test', {
      failureMessage: 'try again',
      authInfo: false
    })
  }, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test1', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 401)

  const { response, body } = await request({
    url: 'http://localhost:' + port,
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(body.toString(), '["try again"]')
  t.is(response.statusCode, 200)
})

test(`should add failureFlash to session if failed to log in`, async (t) => {
  t.plan(3)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())

  server.get('/', async (request, reply) => reply.flash('error'))
  server.post('/login', {
    preValidation: fastifyPassport.authenticate('test', {
      failureFlash: 'try again',
      authInfo: false
    })
  }, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test1', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 401)

  const { response, body } = await request({
    url: 'http://localhost:' + port,
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(body.toString(), '["try again"]')
  t.is(response.statusCode, 200)
})

test(`should add failureFlash=true to session if failed to log in`, async (t) => {
  t.plan(3)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())

  server.get('/', async (request, reply) => reply.flash('error'))
  server.post('/login', {
    preValidation: fastifyPassport.authenticate('test', {
      failureFlash: true,
      authInfo: false
    })
  }, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test1', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 401)

  const { response, body } = await request({
    url: 'http://localhost:' + port,
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(body.toString(), '[]')
  t.is(response.statusCode, 200)
})


function request(options): Promise<{response: any, body: any}> {
  return new Promise((resolve, reject) => {
    requestCallback(options, (error, response, body1) => {
      if (error) {
        reject(error)
      } else {
        resolve({response, body :body1})
      }
    })
  })
}
