import mongoose from 'mongoose';

export const connectMongo = async () => {
  await mongoose.connect(
    `${process.env.MONGODB_URI || 'mongodb://localhost:27017/altstack'}`
  );
};
