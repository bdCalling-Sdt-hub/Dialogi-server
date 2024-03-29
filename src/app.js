const express = require('express')
const cors = require('cors');
const userRouter = require('./routes/userRouter');
const aboutUsRouter = require('./routes/aboutUsRouter');
const faqRouter = require('./routes/faqRouter');
const privacyPolicyRouter = require('./routes/privacyPolicyRouter');
const supportRouter = require('./routes/supportRouter');
const categoryRouter = require('./routes/categoryRouter');
const questionRouter = require('./routes/questionRouter');
const discussionRouter = require('./routes/discussionRouter');
const chatRouter = require('./routes/chatRouter');
const subscriptionRouter = require('./routes/subscriptionRouter');
const paymentRouter = require('./routes/paymentRouter');
const friendRouter = require('./routes/friendRouter');
const messageRouter = require('./routes/messageRouter');
const favouriteRouter = require('./routes/favouriteRouter');
const notificationRouter = require('./routes/notificationRouter');
const actvityRouter = require('./routes/activityRouter');
const path = require('path');

const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();

// Connect to the MongoDB database
mongoose.connect(process.env.MONGODB_CONNECTION);

//making public folder static for publicly access
app.use(express.static('public'));

// For handling form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors(
  {
    origin: "*",
    //[
    //   process.env.ALLOWED_CLIENT_URL_DASHBOARD,
    //   process.env.ALLOWED_CLIENT_URL_WEB,
    //   process.env.ALLOWED_CLIENT_URL_SUB_DASHBOARD
    // ],
    optionsSuccessStatus: 200
  }
));

//configuring i18next
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-node-fs-backend');

let translationPath = __dirname + '/translation/{{lng}}/translation.json';

if (process.env.NODE_ENV === 'production') {
  translationPath = path.resolve(__dirname, 'dist', 'translation/{{lng}}/translation.json');
}

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath:translationPath
    },
    detection: {
      order: ['header'],
      caches: ['cookie']
    },
    preload: ['en', 'de'],
    fallbackLng: process.env.API_RESPONCE_LANGUAGE,
  });
app.use(i18nextMiddleware.handle(i18next));

//initilizing API routes
app.use('/api/users', userRouter);
app.use('/api/about-us', aboutUsRouter);
app.use('/api/faqs', faqRouter);
app.use('/api/privacy-policies', privacyPolicyRouter);
app.use('/api/supports', supportRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/questions', questionRouter);
app.use('/api/discussions', discussionRouter);
app.use('/api/chats', chatRouter);
app.use('/api/messages', messageRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/friends', friendRouter);
app.use('/api/favourites', favouriteRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/activities', actvityRouter);

//testing API is alive
app.get('/test', (req, res) => {
  res.send(req.t('Back-end is responding!!'))
})

//invalid route handler
app.use(notFoundHandler);
//error handling
app.use(errorHandler);
module.exports = app;