const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken')
require('dotenv').config()
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uxzfht6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
    }
});





async function run() {


    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const database = client.db("AirBnb")
        const RoomCollection = database.collection('Rooms')
        RoomCollection.createIndex({ price: 1, room_type_categories: 1, rating: 1 });




        app.get('/rooms', async (req, res) => {
            try {

                // search object for search params 
                const searchQuery = {
                    country: req.query.country,
                    start_date: req.query.start_date,
                    end_date: req.query.end_date,
                    max_guests: req.query.max_guests,
                    min_price: req.query.min_price,
                    max_price: req.query.max_price,
                    room_type_categories: req.query.room_type_categories,
                    bedrooms: req.query.bedrooms,
                    amenities: req.query.amenities,
                    property_type: req.query.property_type,
                };


                // Calculate available dates based on the start and end dates
                const start = new Date(searchQuery?.start_date);
                const end = new Date(searchQuery?.end_date);



                // Create an array of dates between the start and end date 
                const availableDates = [];
                for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
                    availableDates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
                }


                const pipeline = [
                    // Match by room_type_categories if provided
                    {
                        $match: searchQuery?.room_type_categories ? { room_type_categories: searchQuery?.room_type_categories } : {}
                    },

                    // Match by country if provided
                    {
                        $match: searchQuery?.country ? { country: searchQuery?.country } : {}
                    },

                    // Match by price range if provided
                    {
                        $match: {
                            ...(searchQuery?.min_price ? { price: { $gte: searchQuery?.min_price } } : {}),
                            ...(searchQuery?.max_price ? { price: { $lte: searchQuery?.max_price } } : {})
                        }
                    },

                    // Match by max guest if provided
                    {
                        $match: (searchQuery?.max_guests ? { max_guests: { $lte: parseInt(searchQuery?.max_guests) } } : {}),

                    },

                    // Match by available_dates within the range if provided
                    {
                        $match: searchQuery?.start_date && searchQuery?.end_date ? {
                            available_dates: {
                                $elemMatch: { $gte: searchQuery?.start_date, $lte: searchQuery?.end_date }
                            }
                        } : {}
                    },

                    // Match by bedrooms if provided
                    {
                        $match: searchQuery?.bedrooms ? { bedrooms: searchQuery?.bedrooms } : {}
                    },

                    // Match by amenities if provided
                    {
                        $match: searchQuery?.amenities && searchQuery?.amenities.length > 0 ? { amenities: { $all: searchQuery?.amenities } } : {}
                    },

                    // Match by property_type if provided
                    {
                        $match: searchQuery?.property_type ? { property_type: searchQuery?.property_type } : {}
                    }
                ];

                // Execute the aggregation
                const cursor = RoomCollection.aggregate(pipeline);
                const result = await cursor.toArray();


                // Check if the result is empty
                if (result.length === 0) {
                    return res.status(404).json({ status: 404, message: 'No rooms found for the specified category.' });
                }


                return res.status(200).json({ rooms: result, rooms_length: result.length });


            } catch (error) {
                console.error(`Error fetching rooms: ${error.message}`);
                return res.status(500).json({ status: 500, message: 'An error occurred while fetching rooms. Please try again later.' });
            }
        });




        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);








app.get('/', async (req, res) => {
    res.send("This is server for Airbnb Project @2024")
})
app.listen(port, () => {
    console.log('App listing on PORT:', port)
})