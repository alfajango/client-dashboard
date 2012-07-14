function validatePresenceOf(value) {
  return value && value.length;
}

var UserSchema = new Schema({
  email:            {
    type: String,
    validate: [validatePresenceOf, 'an email is required'],
    index: { unique: true }
  },
  hashedPassword:   String,
  admin:            Boolean
});

UserSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.hashedPassword = passwordHash.generate(password);
  })
  .get(function() { return this._password; });

exports = module.exports = User = mongoose.model('User', UserSchema);
