const express = require('express');
const router = express.Router();
const redis = require('../redis')

const configs = require('../util/config')

let visits = 0
redis.setAsync("added_todos", 0);


/* GET index data. */
router.get('/', async (req, res) => {
  visits++

  res.send({
    ...configs,
    visits
  });
});

router.get('/statistics', async (req, res) => {
  const stats = await redis.getAsync("added_todos")
  res.send({
    "added_todos": Number(stats) || 0
  })
})


module.exports = router;
