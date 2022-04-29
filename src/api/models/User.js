const validator = require('mongoose-validator');
const mongoose = require('../../database');

const emailValidator = [
  validator({
    validator: 'isEmail',
    passIfEmpty: false,
    httpStatus: 400,
  }),
];

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, validate: emailValidator, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: 'user' },
  },
);

UserSchema.set('toJSON', {
  versionKey: false,
  transform: (_document, userObj) => {
    const user = userObj;
    delete user.password;
  },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;