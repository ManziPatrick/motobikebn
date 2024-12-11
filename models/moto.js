import mongoose from 'mongoose';

const bikeSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  vin: { type: String, required: true, unique: true },
  plaqueNumber: { type: String, required: true, unique: true },
  registrationExpiry: { type: Date, required: true },
});

// Method to calculate tax
bikeSchema.methods.calculateTax = function (kilometers) {
  const ratePerKm = 300; // 300 RWF per kilometer
  return kilometers * ratePerKm;
};

const Bike = mongoose.model('Bike', bikeSchema);

export default Bike;
