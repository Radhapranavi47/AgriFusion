const mongoose = require('mongoose');

const { Schema } = mongoose;

const advisorySchema = new Schema({
  farmId: {
    type: Schema.Types.ObjectId,
    ref: 'Farm',
    required: true,
  },
  ndvi: {
    type: Number,
    required: true,
  },
  savi: {
    type: Number,
    required: true,
  },
  healthStatus: {
    type: String,
    required: true,
  },
  riskLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High'],
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  advisory: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Advisory = mongoose.model('Advisory', advisorySchema);

module.exports = Advisory;

