const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
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
app.use(cookieParser())



const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'unauthorized access' })
    if (token) {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          console.log(err)
          return res.status(401).send({ message: 'unauthorized access' })
        }
      
  
        req.user = decoded
      
        next()
      })
    }
  }





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


    const userCollection = client.db("shoeShop").collection("users");
    const shoeCollection = client.db("shoeShop").collection("shoes");


       // jwt generating
       app.post('/jwt', async (req, res) => {
        const email = req.body
     
        console.log("email jwt" , email)
        const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '2h',
        })
        res
          .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      })


        // Clear  the token when logout
        app.get('/logout', (req, res) => {

            res
              .clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 0,
              })
              .send({ success: true })
          })

          //user operation
          app.post('/users', async (req, res) => {
            const user = req.body;
            // insert email if user doesnt exists: 
            // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
              return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            console.log('result', result)
            res.send(result);
          });


   
   
          //shoe section
          app.get('/shoes', async (req, res) => {
            const size = parseInt(req.query.size)
            const page = parseInt(req.query.page) - 1
            const filter = req.query.filter
            const sort = req.query.sort
            const search = req.query.search
            const shoeSize = req.query.shoeSize
            
   
      
            let query = {
                title: { $regex:'^' + search, $options: 'i' },
            }
            if (filter) query.category = filter
            if (shoeSize) query.size = shoeSize
            let options = {}
            if (sort) options = { sort: { price: sort === 'asc' ? 1 : -1 } }
            const result = await shoeCollection.find(query, options).skip(page * size).limit(size).toArray()

             

      
            res.send(result)
          })
      
    


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