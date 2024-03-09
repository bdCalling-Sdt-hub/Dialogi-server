const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: [true, 'Name must be given'], trim: true },
  email: {
    type: String,
    required: false,
    trim: true
  },
  password: { type: String, required: false, set: (v) => bcrypt.hashSync(v, bcrypt.genSaltSync(10)) },
  address: { type: String, required: false },
  dateOfBirth: { type: Date, required: false },
  isDeleted: { type: Boolean, default: false },
  image: {
    type: String,
    default:"/uploads/users/user.png"
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  subscription: { type: String, enum: ['default', 'premium', 'premium-plus'], default: 'default' },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: false },
  loginInWithProvider: { type: Boolean, default: false },
}, { timestamps: true }, {
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
    },
  },
},

);

module.exports = mongoose.model('User', userSchema);