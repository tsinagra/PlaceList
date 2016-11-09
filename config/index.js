const config = {}

config.redisStore = {
  url: process.env.REDIS_STORE_URI,
  secret: 'SECRET'
}

module.exports = config