require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { getSubscriptionById } = require('../services/subscriptionService');
const { addPayment } = require('../services/paymentService');
const { getUserById } = require('../services/userService');
const { addMySubscription } = require('../services/mySubscriptionService');
const Payment = require('../models/Payment');
const { addNotification } = require('../services/notificationService');


// const makePaymentWithStripe = async (req, res) => {
//   const { subscriptionId } = req.body;
//   try {
//     if (req.body.userRole !== 'user') {
//       return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'payment', message: req.t('unauthorised') }));
//     }
//     if (!subscriptionId) {
//       return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'payment', message: req.t('subscription-id-required') }));
//     }
//     const subscription = await getSubscriptionById(subscriptionId);
//     if (!subscription) {
//       return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'payment', message: req.t('subscription-not-found') }));
//     }
//     const paymentData = await stripe.paymentIntents.create({
//       amount: subscription.price * 100,
//       currency: 'usd',
//       automatic_payment_methods: {
//         enabled: true,
//       },
//     });
//     console.log('paymentData--->', paymentData);
//     return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'payment', message: req.t('payment-token-created'), data: { client_secret: paymentData.client_secret } }));
//   } catch (error) {
//     console.error(error);
//     logger.error(error.message, req.originalUrl);
//     return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'payment', message: req.t('server-error') }));
//   }
// }

// const makePaymentWithPaypal = async (req, res) => {
//   paypal.configure({
//     'mode': 'sandbox', //sandbox or live
//     'client_id': 'AVmEAzGogaeT0pVHi-N0OviOUVE4N1-7cwVcZBI_QA9SLNBTlXg--o2gf9a1cCc8nly90Q4n4VNa4N3D',
//     'client_secret': 'EB_BsRlHBXB-LWiietI9jPxNRdH6U3n0psI8Rtq2ihop5BQE1GKK5oOwV84tU-JvdZksbRgYmk8iXo8y'
//   });
//   const { subscriptionId } = req.body;
//   try {
//     if (req.body.userRole !== 'user') {
//       return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'payment', message: req.t('unauthorised') }));
//     }
//     if (!subscriptionId) {
//       return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'payment', message: req.t('subscription-id-required') }));
//     }
//     const subscription = await getSubscriptionById(subscriptionId);
//     if (!subscription) {
//       return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'payment', message: req.t('subscription-not-found') }));
//     }

//     var create_payment_json = {
//       "intent": "sale",
//       "payer": {
//         "payment_method": "paypal"
//       },
//       "redirect_urls": {
//         "return_url": "http://192.168.10.18:3000/api/payments/paypal/success",
//         "cancel_url": "http://192.168.10.18:3000/api/payments/paypal/cancel"
//       },
//       "transactions": [{
//         "item_list": {
//           "items": [{
//             "name": subscription.name,
//             "sku": "subscription",
//             "price": subscription.price,
//             "currency": "USD",
//             "quantity": 1
//           }]
//         },
//         "amount": {
//           "currency": "USD",
//           "total": subscription.price
//         },
//         "description": "This is the payment description."
//       }]
//     };
//     paypal.payment.create(create_payment_json, function (error, payment) {
//       if (error) {
//         throw error;
//       } else {
//         console.log("Create Payment Response");
//         console.log(payment);
//         return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'payment', message: req.t('payment-token-created'), data: payment }));
//       }
//     });

//   } catch (error) {
//     console.error(error);
//     logger.error(error.message, req.originalUrl);
//     return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'payment', message: req.t('server-error') }));
//   }
// }

async function addPaymentInfo(userId, paymentData, subscriptionId) {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw Error('user-not-found');
    }
    if (!paymentData || !subscriptionId) {
      throw Error('payment-data-required');
    }
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription) {
      throw Error('subscription-not-found');
    }
    // save payment info
    const paymentInfo = await addPayment({ paymentData, subscription: subscriptionId, user: userId, status: 'success' });
    var myUpdatedSubscription;
    var accessToken;
    if (paymentInfo) {
      // update user subscription
      const user = await getUserById(userId);
      user.subscription = subscription?.type;
      user.subscriptionId = subscription?._id;
      await user.save();

      //add my subscription
      const mySubscription = {
        user: user._id,
        type: subscription?.type,
        isAddAvailable: subscription?.isAddAvailable,

        //category access
        categoryAccessNumber: subscription?.categoryAccessNumber,
        isCategoryAccessUnlimited: subscription.isCategoryAccessUnlimited,

        //question access
        questionAccessNumber: subscription.questionAccessNumber,
        isQuestionAccessUnlimited: subscription.isQuestionAccessUnlimited,

        //chat access
        isChatAvailable: subscription.isChatAvailable,
        isGroupChatAvailable: subscription.isGroupChatAvailable,
        isCommunityDiscussionAvailable: subscription.isCommunityDiscussionAvailable,

        //early access
        isEarlyAccessAvailable: subscription.isEarlyAccessAvailable,

        //profile update access
        updateProfileAccess: subscription.updateProfileAccess,

        //expiry date shiuld be current date month + expiry time
        expiryTime: subscription.expiryTime,
      }

      myUpdatedSubscription = await addMySubscription(mySubscription);

      accessToken = jwt.sign({userFullName: user.fullName, _id: user._id, email: user.email, role: user.role, subscription: user.subscription }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });
    }
    return { paymentInfo, myUpdatedSubscription, accessToken };
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, 'Add-Payment-Info');
    throw error;
  }
}

const successPayment = async (req, res) => {
  try {

    // Extract required fields from paymentData
    const { amount, paymentId, paymentMethod, name, sku, price, currency, quantity, subscriptionId } = req.body;
    const paymentData = {
      paymentId,
      paymentMethod,
      amount: Number(amount),
      item: {
        name,
        sku,
        price,
        currency,
        quantity
      }
    }
    const { paymentInfo, myUpdatedSubscription, accessToken } = await addPaymentInfo(req.body.userId, paymentData, subscriptionId);
    
    const senderNotifation = {
      message: "Your payment is successful",
      receiver: req.body.userId,
      linkId: paymentInfo._id,
      type: 'payment',
      role: 'user',
    }

    const adminNotification = {
      message: "You have received " + amount + "$ from " + req.body.userFullName + " for " + name + " subscription.",
      receiver: req.body.userId,
      linkId: paymentInfo._id,
      type: 'payment',
      role: 'admin',
    }

    const adminNewNotification = await addNotification(adminNotification);
    io.emit("dialogi-admin-notification", { status: 1008, message: adminNewNotification.message })
    
    const roomId = 'user-notification::' + req.body.userId.toString();
    const senderNotifationPart = await addNotification(senderNotifation);
    io.emit(roomId, senderNotifationPart)

    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'payment', message: req.t('payment-success'), data: { paymentInfo, myUpdatedSubscription }, accessToken: accessToken }));
  } catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'payment', message: req.t('server-error') }));
  }
}

const paymentList = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const paymentType = !req.query.paymentType ? 'today' : req.query.paymentType;
    var startDate = new Date();
    var endDate;
    var paymentData;
    var totalIncome;
    var pagination;

    const result = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$paymentData.amount' } // Sum up the amount field from paymentData
        }
      }
    ]);

    // Extract the total amount from the result
    const totalAmount = result.length > 0 ? result[0].totalAmount : 0;

    if (paymentType === 'today') {
      endDate = new Date(new Date().setDate(startDate.getDate() - 1));
      paymentData = await Payment.find({ createdAt: { $gte: endDate, $lte: startDate } }).select('paymentData user createdAt').populate('user', 'fullName image email').skip(skip).limit(limit).sort({ createdAt: -1 });
      const totalResults = await Payment.countDocuments({ createdAt: { $gte: endDate, $lte: startDate } });
      const totalPages = Math.ceil(totalResults / limit);
      pagination = {
        totalResults,
        totalPages,
        currentPage: page,
        limit
      }

      const result = await Payment.aggregate([
        {
          $match: { createdAt: { $gte: endDate, $lte: startDate } }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$paymentData.amount' } // Sum up the amount field from paymentData
          }
        }
      ]);

      // Extract the total amount from the result
      totalIncome = result.length > 0 ? result[0].totalAmount : 0;
    }
    if (paymentType === 'weekly') {
      endDate = new Date(new Date().setDate(startDate.getDate() - 7));
      paymentData = await Payment.find({ createdAt: { $gte: endDate, $lte: startDate } }).select('paymentData user createdAt').populate('user', 'fullName image email').skip(skip).limit(limit).sort({ createdAt: -1 });
      const totalResults = await Payment.countDocuments({ createdAt: { $gte: endDate, $lte: startDate } });
      const totalPages = Math.ceil(totalResults / limit);
      pagination = {
        totalResults,
        totalPages,
        currentPage: page,
        limit
      }
      const result = await Payment.aggregate([
        {
          $match: { createdAt: { $gte: endDate, $lte: startDate } }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$paymentData.amount' } // Sum up the amount field from paymentData
          }
        }
      ]);

      // Extract the total amount from the result
      totalIncome = result.length > 0 ? result[0].totalAmount : 0;
    }
    if (paymentType === 'monthly') {
      const endDate = new Date();
      endDate.setFullYear(startDate.getFullYear() - 1);

      paymentData = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: endDate, $lte: startDate }
          }
        },
        {
          $sort: { createdAt: 1 } // Sort by createdAt in ascending order
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalAmount: { $sum: '$paymentData.amount' },
            totalUsers: { $sum: 1 } // Counting documents in each group
          }
        },
        {
          $sort: {
            '_id.year': -1,
            '_id.month': -1
          }
        },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: '$totalAmount' }, // Summing up totalAmount to get totalIncome
            monthlyData: { $push: '$$ROOT' } // Storing monthly data for further processing
          }
        },
        {
          $unwind: '$monthlyData' // Unwinding the array to restore the previous structure
        },
        {
          $replaceRoot: { newRoot: '$monthlyData' } // Restoring the original structure
        },
        {
          $project: {
            _id: 0,
            monthYear: {
              $dateToString: {
                format: '%b %Y',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: 1
                  }
                }
              }
            },
            totalAmount: 1,
            totalUsers: 1
          }
        }
      ]);

      const result = await Payment.aggregate([
        {
          $match: { createdAt: { $gte: endDate, $lte: startDate } }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$paymentData.amount' } // Sum up the amount field from paymentData
          }
        }
      ]);
      // Extract the total amount from the result
      totalIncome = result.length > 0 ? result[0].totalAmount : 0;
    }
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'payment', message: req.t('payments'), data: { "payment": { paymentData, totalAmount, totalIncome }, pagination } }));
  } catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'payment', message: req.t('server-error') }));
  }
}

module.exports = { successPayment, paymentList }