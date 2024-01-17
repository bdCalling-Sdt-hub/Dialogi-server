const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const PaymentInfo = require('../models/PaymentInfo');
const bcrypt = require('bcryptjs');

// Sample data
const usersData = [
  {
    "fullName": "Testing Admin",
    "email": "ad.residplus@gmail.com",
    "phoneNumber": "01735566789",
    "password": 'helloadmin',
    "role": "admin"
  },
  {
    "fullName": "Testing Worker",
    "email": "sub.residplus@gmail.com",
    "phoneNumber": "01933456040",
    "password": 'helloworker',
    "role": "worker"
  },
  {
    "fullName": "Testing Clinet",
    "email": "testing.client@gmail.com",
    "phoneNumber": "01734456873",
    "password": 'helloclient',
    "role": "user",
    "passcode": "1234"
  }
];

const paymentInfo = {
  "name": "Сбербанк (sberbank)",
  "phoneNumber": "+79050048977",
  "bankName": "ричард манни в",
}

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

const seedPaymentInfo = async () => {
  try {
    await PaymentInfo.deleteMany();
    await PaymentInfo.create(paymentInfo);
    console.log('Payment info seeded successfully!');
  } catch (err) {
    console.error('Error seeding payment info:', err);
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_CONNECTION, {});

// Call seeding functions
const seedDatabase = async () => {
  try {
    await dropDatabase(); 
    await seedUsers();
    await seedPaymentInfo();
    console.log('--------------> Database seeding completed <--------------');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.disconnect();
  }
};

// Execute seeding
seedDatabase();
