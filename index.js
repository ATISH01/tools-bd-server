const express = require('express');
const cors = require('cors');


require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const res = require('express/lib/response');
const ObjectId = require('mongodb').ObjectId;

const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vvlbm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db('tools-bd').collection('products');
    const ordersCollection = client.db('tools-bd').collection('orders');
    const reviewsCollection = client.db('tools-bd').collection('reviews');
    const profileCollection = client.db('tools-bd').collection('profiles');
    console.log('Connected');

    app.get('/tools', async (req, res) => {
      const tools = await toolsCollection.find().toArray();
      res.send(tools);
    })
    app.get('/tools/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const tools = await toolsCollection.findOne(query);
      res.send(tools);
    })

    //update
    app.put('/tools/:id', async (req, res) => {
      const id = req.params.id;
      const updatedCart = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          selected: updatedCart.selected
        }
      };
      const result = await toolsCollection.updateOne(filter, updatedDoc, options);
      res.send(result);

    })
    

    // addToOrder
    app.post('/orders', async (req, res) => {
      const orders = req.body;
      const result = await ordersCollection.insertOne(orders);
      res.send(result)
    })
    // addToProfile
    app.post('/profile', async (req, res) => {
      const orders = req.body;
      const result = await profileCollection.insertOne(orders);
      res.send(result)
    })
    // addToReviews
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result)
    })
    //getMyOrders
    app.get('/orders', async(req,res)=>{
      const allOrder = await ordersCollection.find().toArray();
      res.send(allOrder);
    })
    //getMyReviews
    app.get('/reviews', async(req,res)=>{
      const allReview = await reviewsCollection.find().toArray();
      res.send(allReview);
    })
    //deleteFromCart
    app.delete('/orders/:id',async(req,res)=>{
      const id=req.params.id;
      console.log(id);
      const query={_id:ObjectId(id)};
      const result = ordersCollection.deleteOne(query);
      res.send(result)
    })
  }
  finally { }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})