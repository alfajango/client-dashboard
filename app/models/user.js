function validatePresenceOf(value) {
  return value && value.length;
}

var UserSchema = new Schema({
  email: {
    type: String,
    validate: [validatePresenceOf, 'an email is required'],
    index: { unique: true }
  },
  hashedPassword: String,
  apiUser: String,
  apiToken: String,
  admin: Boolean,
  client: {
    type: ObjectId,
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

exports = module.exports = User = mongoose.model('User', UserSchema);
