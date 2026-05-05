const mongoose = require('mongoose');

const { Schema } = mongoose;

const ndviHistorySchema = new Schema(
  {
    date: { type: Date },
    value: { type: Number },
  },
  { _id: false }
);

const farmSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmerName: {
      type: String,
      required: true,
      trim: true,
    },
    cropType: {
      type: String,
      required: true,
      trim: true,
    },
    sowingDate: {
      type: Date,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    cropGrowthStage: {
      type: Number,
      default: 2,
    },
    ndviHistory: [ndviHistorySchema],
    latestObservation: {
      pestObserved: { type: Boolean, default: false },
      leafYellowingObserved: { type: Boolean, default: false },
      irrigationDoneRecently: { type: Boolean, default: false },
      updatedAt: { type: Date },
    },
    quickCheck: {
      pestObserved: { type: Boolean, default: false },
      leafYellowing: { type: Boolean, default: false },
      irrigationRecent: { type: Boolean, default: false },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

farmSchema.index({ location: '2dsphere' });
farmSchema.index({ user: 1 });

const Farm = mongoose.model('Farm', farmSchema);

module.exports = Farm;
