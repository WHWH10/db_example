const mongoose = require('mongoose')

const heartRateSchema = mongoose.Schema({
    data_category: { type: Number },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userid'
    },
    dateTimeYear: { type: String },
    dateTimeHour: { type: String },
    heart_rate_measurement_location: { type: String },
    status_id: { type: String },
    heart_rate: { type: String },
    accuracy: { type: String }
})

module.exports = mongoose.model('HeartRate', heartRateSchema)