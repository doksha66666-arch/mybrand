const mongoose = require('mongoose');

const liveStreamSchema = new mongoose.Schema(
  {
    broadcasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    status: { type: String, enum: ['live', 'ended'], default: 'live', index: true },
    ingestMode: { type: String, enum: ['browser', 'obs', 'upload'], default: 'upload', index: true },
    videoUrl: { type: String, default: null },
    videoPublicId: { type: String, default: null },
    obsStreamKey: { type: String, default: null, select: false },
    obsStreamKeyHash: { type: String, default: null, select: false },
    obsStreamPath: { type: String, default: null },
    startedAt: { type: Date, default: Date.now, index: true },
    endedAt: { type: Date, default: null },
    lastHeartbeatAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

liveStreamSchema.index({ status: 1, startedAt: -1 });
liveStreamSchema.index({ broadcasterId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'live' } });

module.exports = mongoose.model('LiveStream', liveStreamSchema);
