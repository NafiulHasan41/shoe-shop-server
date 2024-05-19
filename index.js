const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const formData = require('form-data');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 3000;


//middleware



app.use(cors());
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


    const userCollection = client.db("shoeShop").collection("users");
    const shoeCollection = client.db("shoeShop").collection("shoes");
    const reviewCollection = client.db("shoeShop").collection("reviews");
    const cartCollection = client.db("shoeShop").collection("carts");

         // jwt generating
         app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
            res.send({ token });
          })


         // middlewares 
    const verifyToken = (req, res, next) => {
        // console.log('inside verify token', req.headers.authorization);
        if (!req.headers.authorization) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
          }
          req.decoded = decoded;
          next();
        })
      }
    
             // use verify admin after verifyToken
       const verifyAdmin = async (req, res, next) => {
        const email = req.decoded.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const isAdmin = user?.role === 'admin';
        if (!isAdmin) {
          return res.status(403).send({ message: 'forbidden access' });
        }
        next();
       }



    app.get('/users/admin/:email',verifyToken,  async (req, res) => {
        const email = req.params.email;
  
        if (email !== req.decoded.email) {
          return res.status(403).send({ message: 'forbidden access' })
        }
  
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let admin = false;
        if (user) {
          admin = user?.role === 'admin';
        }
        res.send({ admin });
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

          // user cart 

          app.post('/cart',  async (req, res) => {

            const cartData = req.body
            const result = await cartCollection.insertOne(cartData);
            console.log('cart insert result', result)
            res.send(result)
          })

            // get cart data
          app.get('/carts',  async (req, res) => {

                const email = req.query.email;
                
  
                const query = { cartEmail: email };
                const result = await cartCollection.find(query).toArray();
                res.send(result);
           

          })

          //carts data delete 
          app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query);
            res.send(result);
          });


        //   user section end 

   
   
          //shoe section start
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
           
          // new arrival 
          app.get('/shoesNewArrival', async (req, res) => {
          
            const tag = req.query.tag
             let query = { tag : tag}
            const result = await shoeCollection.find(query).toArray()
            res.send(result)
          })
          //single data
          app.get('/shoeDetails/:id', verifyToken ,  async (req, res) => {
               
            const id = req.params.id;
           
            const query = { _id: new ObjectId(id) }
            const result = await shoeCollection.find(query).toArray()
            res.send(result)
          })


            // Get all shoe data count from db
          app.get('/shoesCount', async (req, res) => {
            const filter = req.query.filter
            const shoeSize = req.query.shoeSize
            const search = req.query.search
            let query = {
                title: { $regex: '^' + search, $options: 'i' },
            }
            if (filter) query.category = filter
            if (shoeSize) query.size = shoeSize
            const count = await shoeCollection.countDocuments(query)
            console.log('count', count)
            res.send({ count })
           })
           //adding shoes 
           app.post('/shoes', verifyToken, verifyAdmin, async (req, res) => {
            const item = req.body;
            const result = await shoeCollection.insertOne(item);
            res.send(result);
          });





           //review section 
           app.post('/reviews', async (req, res) => {
            const singleJobData = req.body
            const result = await reviewCollection.insertOne(singleJobData)
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