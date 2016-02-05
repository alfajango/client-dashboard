import * as mongoose from 'mongoose';
//exports = mongoose = require('mongoose');
mongoose.connect(config.db.uri);
exports = Schema = mongoose.Schema;
exports = ObjectId = Schema.ObjectId;
