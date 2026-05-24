import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
    if (typeof window !== 'undefined') {
        return;
    }

    if (!MONGODB_URI) {
        throw new Error('Missing MONGODB_URI')
    }

    const readyState = mongoose.connection.readyState

    // 1 = connected
    if (cached.conn && readyState === 1) {
        return cached.conn
    }

    // If we ended up with a stale cached connection reference, reset and reconnect.
    if (cached.conn && readyState === 0) {
        cached.conn = null
        cached.promise = null
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 20000,
            maxPoolSize: 10,
        }
        console.log('Connecting to db...')
        cached.promise = mongoose.connect(MONGODB_URI, opts).then(mongoose => {
            console.log('Db connected')
            return mongoose
        })
    }
    try {
        cached.conn = await cached.promise
    } catch (e) {
        cached.promise = null
        throw e
    }
    return cached.conn
}

export default dbConnect