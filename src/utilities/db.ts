import mongoose from 'mongoose';

export const connectMongo = async () => {
  await mongoose.connect(
    `${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/altstack'}`
  );
};
