const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Sample data
const usersData = [
  {
    "fullName": "Testing Admin",
    "email": "admin.dialogi@gmail.com",
    "phoneNumber": "01735566789",
    "password": 'helloadmin',
    "role": "admin",
    "subscription":"default"
  },
  {
    "fullName": "Testing Clinet",
    "email": "user.dialogi@gmail.com",
    "phoneNumber": "01734456873",
    "password": 'helloclient',
    "role": "user",
    "subscription":"default"
  }
];

const subscriptionData = [
  {
    _id: "65cde4e7294393c969cff434",
    name: "Default",
    type: "default",
    isAddAvailable: true,

    //category access
    categoryAccessNumber: 4,
    isCategoryAccessUnlimited: false,

    //question access
    questionAccessNumber: 18,
    isQuestionAccessUnlimited: false,

    //chat access
    isChatAvailable: false,
    isGroupChatAvailable: false,
    isCommunityDiscussionAvailable: false,

    //early access
    isEarlyAccessAvailable: false,

    //profile update access
    updateProfileAccess: false,

    //expiry time
    expiryTime:1,

    //price
    price: 0,
  },
  {
    _id: "65cde4e7294393c969cff435",
    name: "Premium",
    type: "premium",
    isAddAvailable: false,

    //category access
    categoryAccessNumber: 111,
    isCategoryAccessUnlimited: true,

    //question access
    questionAccessNumber: 150,
    isQuestionAccessUnlimited: false,

    //chat access
    isChatAvailable: true,
    isGroupChatAvailable: false,
    isCommunityDiscussionAvailable: false,

    //early access
    isEarlyAccessAvailable: false,

    //profile update access
    updateProfileAccess: false,

    //expiry time
    expiryTime:1,

    //price
    price: 1.5,
  },
  {
    _id: "65cde4e7294393c969cff436",
    name: "Premium Plus",
    type: "premium-plus",
    isAddAvailable: false,

    //category access
    categoryAccessNumber: 111,
    isCategoryAccessUnlimited: true,

    //question access
    questionAccessNumber: 111,
    isQuestionAccessUnlimited: true,

    //chat access
    isChatAvailable: true,
    isGroupChatAvailable: true,
    isCommunityDiscussionAvailable: true,

    //early access
    isEarlyAccessAvailable: true,

    //profile update access
    updateProfileAccess: true,

    //expiry time
    expiryTime:1,

    //price
    price: 2.5,
  }
]

// Function to drop the entire database
const dropDatabase = async () => {
  try {
    await mongoose.connection.dropDatabase();
    console.log('------------> Database dropped successfully! <------------');
  } catch (err) {
    console.error('Error dropping database:', err);
  }
};

// Function to seed users
const seedUsers = async () => {
  try {
    await User.deleteMany();
    await User.insertMany(usersData);
    console.log('Users seeded successfully!');
  } catch (err) {
    console.error('Error seeding users:', err);
  }
};

const seedSubscriptions = async () => {
  try {
    await Subscription.deleteMany();
    await Subscription.insertMany(subscriptionData);
    console.log('Subscriptions seeded successfully!');
  } catch (err) {
    console.error('Error seeding subscriptions:', err);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_CONNECTION);

// Call seeding functions
const seedDatabase = async () => {
  try {
    await dropDatabase();
    await seedUsers();
    await seedSubscriptions();
    console.log('--------------> Database seeding completed <--------------');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.disconnect();
  }
};

// Execute seeding
seedDatabase();
