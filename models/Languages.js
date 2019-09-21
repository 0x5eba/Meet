// const mongoose = require('mongoose')
// require('mongoose-double')(mongoose);
// mongoose.set('useCreateIndex', true);

// var SchemaTypes = mongoose.Schema.Types;

// const Languages = new mongoose.Schema({
//     country: { type: String, require: true, default: "" },
//     name: { type: String, require: true, default: "" },
//     lat: { type: SchemaTypes.Double, require: true, default: 0 }, 
//     lng: { type: SchemaTypes.Double, require: true, default: 0 },
// })

// Languages.index({
//     name: 'text',
//     country: "test",
// });

// module.exports = mongoose.model('Languages', Languages)