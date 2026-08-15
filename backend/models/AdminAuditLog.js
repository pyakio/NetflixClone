/**
 * ============================================================================
 * Administrator Mutation Audit Trail Schema
 * ============================================================================
 * Immutable append-only log capturing administrative actions, target resources,
 * mutation payloads, originating IP addresses, and UTC timestamps.
 */

const mongoose = require('mongoose');

const AdminAuditLogSchema = new mongoose.Schema({
    adminEmail: { type: String, required: true },
    adminUid: { type: String, required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

AdminAuditLogSchema.index({ timestamp: -1 });
AdminAuditLogSchema.index({ adminUid: 1, timestamp: -1 });

module.exports = mongoose.model('AdminAuditLog', AdminAuditLogSchema);
