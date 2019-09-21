// const mongoose = require('mongoose')
// require('mongoose-double')(mongoose);
// mongoose.set('useCreateIndex', true);


// const Countries = new mongoose.Schema({
//     country: { 
//         name: { type: String, require: true, default: "" }, 
//         capital: { type: String, require: true, default: "" }, 
//         languages: { type: [String], default: [] } 
//     },
// })

// Countries.index({
//     "country.name": 'text',
//     country: "test",
// });

// module.exports = mongoose.model('Countries', Countries)