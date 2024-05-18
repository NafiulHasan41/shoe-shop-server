const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const formData = require('form-data');
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 3000;


//middleware

const corsOptions = {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    credentials: true,
  }

app.use(cors(corsOptions));
app.use(express.json());




//database connection



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dsubcfq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  
  }
}
run().catch(console.dir);







app.get('/', (req, res) => {
    res.send('shop is working')
  })
  
  app.listen(port, () => {
    console.log(`shoe shop is sitting on port ${port}`);
  })