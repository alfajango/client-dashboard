function validatePresenceOf(value) {
  return value && value.length;
}

var UserSchema = new Schema({
  email:            {
    type: String,
    validate: [validatePresenceOf, 'an email is required'],
    index: { unique: true }
  },
  hashedPassword:   String
});

UserSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.hashed_password = passwordHash.generate(password);
  })
  .get(function() { return this._password; });

mongoose.model('User', UserSchema);
