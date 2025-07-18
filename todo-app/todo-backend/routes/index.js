const express = require('express');
const router = express.Router();
const redis = require('../redis')

const configs = require('../util/config')

let visits = 0
redis.getAsync("added_todos").then(value => {
  if (value === null) {
    redis.setAsync("added_todos", 0);
  }
});

/* GET index data. */
router.get('/', async (req, res) => {
  visits++

  res.send({
    ...configs,
    visits
  });
});

router.get('/api/todos', (req, res) => res.send('Todos endpoint is working!'));

router.get('/statistics', async (req, res) => {
  const stats = await redis.getAsync("added_todos")
  res.send({
    "added_todos": Number(stats) || 0
  })
})

module.exports = router;
