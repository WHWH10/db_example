const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    userid: { type: String, required: true },
    user_age: { type: Number },
    user_gender: { type: String },
    user_height: { type: Number },
    user_weight: { type: String },
    user_heart_rate: { type: String },
    user_blood_pressure: { type: String },
    user_temperature: { type: String }
})

module.expors = mongoose.model('User', userSchema)