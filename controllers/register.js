import User from '../models/user.js';
import Bike from '../models/moto.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = new User({
      username,
      email,
      password,
      phoneNumber,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Log input
    console.log("Login Request:", { username, password });

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      console.log("User not found with username or email:", username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Log user retrieved
    console.log("User found:", user);

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log("Password mismatch for user:", username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Login error', error: error.message });
  }
};



export const registerBike = async (req, res) => {
  try {
    const { make, model, year, vin, plaqueNumber, registrationExpiry, dailyTaxRate } = req.body;

    const bike = new Bike({
      make,
      model,
      year,
      vin,
      plaqueNumber,
      registrationExpiry,
      dailyTaxRate,
      owner: req.user.id,
      totalDistance: 0,
      totalTaxPaid: 0,
      income: 0,
    });

    await bike.save();

    // Update user's registered bikes
    await User.findByIdAndUpdate(req.user.id, { $push: { registeredBikes: bike._id } });

    res.status(201).json({ message: 'Bike registered successfully', bike });
  } catch (error) {
    res.status(500).json({ message: 'Error registering bike', error: error.message });
  }
};

export const trackBikeActivity = async (req, res) => {
  try {
    const { bikeId, distance, income } = req.body;

    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    // Update bike metrics
    const tax = distance * bike.dailyTaxRate;
    bike.totalDistance += distance;
    bike.totalTaxPaid += tax;
    bike.income += income;

    await bike.save();

    res.status(200).json({
      message: 'Bike activity tracked successfully',
      bike,
      tax,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking bike activity', error: error.message });
  }
};

export const getUserDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'registeredBikes',
        model: 'Bike',
        select: 'plaqueNumber totalDistance totalTaxPaid income',
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bikeSummary = await Bike.aggregate([
      { $match: { owner: user._id } },
      {
        $group: {
          _id: null,
          totalBikes: { $sum: 1 },
          totalDistance: { $sum: '$totalDistance' },
          totalTaxPaid: { $sum: '$totalTaxPaid' },
          totalIncome: { $sum: '$income' },
        },
      },
    ]);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      bikes: user.registeredBikes,
      summary: bikeSummary[0] || {
        totalBikes: 0,
        totalDistance: 0,
        totalTaxPaid: 0,
        totalIncome: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Dashboard error', error: error.message });
  }
};

export const addUserWithRole = async (req, res) => {
  try {
    const { username, email, password, phoneNumber, role } = req.body;

    if (!['motobikeman', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ username, email, password, phoneNumber, role });
    await user.save();

    res.status(201).json({ message: 'User added successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error adding user', error: error.message });
  }
};

export const getAllBikesForUser = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `isAuthenticated` middleware adds `req.user`
    const bikes = await Bike.find({ owner: userId });
    
    if (!bikes || bikes.length === 0) {
      return res.status(404).json({ message: 'No bikes found for this user' });
    }

    res.json({ bikes });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bikes', error: error.message });
  }
};
export const getBikeHistory = async (req, res) => {
  try {
    const { bikeId } = req.params; // Get bikeId from URL params

    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    // Optionally, if you have daily activity data in a separate collection, 
    // you can fetch it here and aggregate it for the bike's history.
    const activityHistory = await Bike.aggregate([
      { $match: { _id: bikeId } },
      { $unwind: '$activities' }, // Assuming activities is an array of daily activities
      {
        $project: {
          date: '$activities.date',
          distance: '$activities.distance',
          income: '$activities.income',
          tax: '$activities.tax',
        },
      },
      { $sort: { 'activities.date': -1 } } // Sort by date in descending order
    ]);

    // Calculate total distance, total tax paid, and total income from activity history
    const totalDistance = bike.totalDistance;
    const totalTaxPaid = bike.totalTaxPaid;
    const totalIncome = bike.income;

    res.json({
      bike: {
        id: bike._id,
        plaqueNumber: bike.plaqueNumber,
        make: bike.make,
        model: bike.model,
        totalDistance,
        totalTaxPaid,
        totalIncome,
      },
      activityHistory,
    });
  } catch (error) {
    console.error('Error fetching bike history:', error);
    res.status(500).json({ message: 'Error fetching bike history', error: error.message });
  }
};
