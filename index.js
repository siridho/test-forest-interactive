const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');

dotenv.config(); // passing data from .env file

const port = process.env.PORT || 3000;
const app = express();
const { messages } = require('./app/controllers');

const { getAll, getSent, create, sendMessage, updateStatus } = messages;

// parse application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

// app.use(express.urlencoded({ extended: true }))

// parse application/json
app.use(
  bodyParser.json({
    type: 'application/json',
  })
);

app.use(cors({ credentials: true, origin: true }));

app.get('/', async (req, res) => {
  res.status(200).json({
    code: 200,
    status: 'success',
    message: 'Welcome to the beginning of nothingness',
  });
});
const router = express.Router();

router.get('/message/list', getAll);
router.get('/message/send', getSent);
router.post('/message', create);
router.post('/message/send', sendMessage);

app.use('/api/', router);

// Schedule tasks to be run on the server.
cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
  sendMessage();
  updateStatus();
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port: ${port}`);
});

module.exports = server;
