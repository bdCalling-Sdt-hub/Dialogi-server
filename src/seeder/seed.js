const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

// Sample data
const usersData = [
  {
    "fullName": "Testing Admin",
    "email": "admin.dialogi@gmail.com",
    "phoneNumber": "01735566789",
    "password": 'helloadmin',
    "role": "admin"
  },
  {
    "fullName": "Testing Clinet",
    "email": "user.dialogi@gmail.com",
    "phoneNumber": "01734456873",
    "password": 'helloclient',
    "role": "user",
  }
];

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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_CONNECTION, {});

// Call seeding functions
const seedDatabase = async () => {
  try {
    await dropDatabase(); 
    await seedUsers();
    console.log('--------------> Database seeding completed <--------------');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.disconnect();
  }
};

// Execute seeding
seedDatabase();
