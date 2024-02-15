const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: [true, 'Name must be given'], trim: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    unique: [true, 'Email should be unique'],
    validate: {
      validator: function (v) {
        return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v);
      },
      message: 'Please enter a valid Email'
    }
  },
  password: { type: String, required: false, set: (v) => bcrypt.hashSync(v, bcrypt.genSaltSync(10)) },
  address: { type: String, required: false },
  dateOfBirth: { type: Date, required: false },
  image: {
    type: String,
    default:"uploads/users/user.png"
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  subscription: { type: String, enum: ['default', 'premium', 'premium-plus'], default: 'default' },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: false },
}, { timestamps: true }, {
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
    },
  },
},

);

module.exports = mongoose.model('User', userSchema);