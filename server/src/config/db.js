// const mongoose = require('mongoose');

// const normalizeMongoUri = (rawUri) => {
//   if (!rawUri || typeof rawUri !== 'string') {
//     return '';
//   }

//   // Handle common mistakes like quoted values or trailing spaces.
//   let uri = rawUri.trim();
//   if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
//     uri = uri.slice(1, -1).trim();
//   }

//   return uri;
// };

// const connectDB = async () => {
//   try {
//     const mongoUri = normalizeMongoUri(process.env.MONGO_URI);

//     if (!mongoUri) {
//       throw new Error('MONGO_URI is missing. Add a valid mongodb:// or mongodb+srv:// URI in server/.env');
//     }

//     if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
//       throw new Error('Invalid MONGO_URI scheme. It must start with mongodb:// or mongodb+srv://');
//     }

//     const conn = await mongoose.connect(mongoUri);
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;
const connectDB = async () => {
  try {
    console.log("MONGO_URI value:", process.env.MONGO_URI);
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is missing");
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
