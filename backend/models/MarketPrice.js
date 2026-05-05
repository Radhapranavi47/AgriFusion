const mongoose = require('mongoose');

const { Schema } = mongoose;

const marketPriceSchema = new Schema({
  cropType: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  district: {
    type: String,
    required: true,
    trim: true,
  },
  market: {
    type: String,
    trim: true,
  },
  modalPrice: {
    type: Number,
    required: true,
  },
  minPrice: {
    type: Number,
  },
  maxPrice: {
    type: Number,
  },
  date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient lookups by crop, district, and date
marketPriceSchema.index({ cropType: 1, district: 1, date: -1 });

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

module.exports = MarketPrice;


