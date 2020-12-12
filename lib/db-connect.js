exports = mongoose = require('mongoose');
if (process.env.MONGODB_URI !== undefined) {
  mongoose.connection.openUri(process.env.MONGODB_URI);
} else {
  mongoose.connection.openUri(config.db.uri);
}
exports = Schema = mongoose.Schema;
exports = ObjectId = Schema.ObjectId;
