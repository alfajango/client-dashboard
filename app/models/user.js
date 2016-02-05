import mongoose from 'mongoose';
import passwordHash from 'password-hash';

function validatePresenceOf(value) {
  return value && value.length;
}

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    validate: [validatePresenceOf, 'an email is required'],
    index: { unique: true }
  },
  hashedPassword: String,
  admin: Boolean,
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client'
  }
});

// TODO: Use setter to prevent admin setting and client setting
// without authorization.

UserSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    if (password && password.length) {
      this.hashedPassword = passwordHash.generate(password);
    }
  })
  .get(function() { return this._password; });

//exports = module.exports = User = mongoose.model('User', UserSchema);
export default mongoose.model('User', UserSchema);
//export
