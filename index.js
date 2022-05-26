const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const res = require('express/lib/response');
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vvlbm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);

function JWTverify(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized Access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db('tools-bd').collection('products');
    const ordersCollection = client.db('tools-bd').collection('orders');
    const reviewsCollection = client.db('tools-bd').collection('reviews');
    const profileCollection = client.db('tools-bd').collection('profiles');
    const usersCollection = client.db('tools-bd').collection('users');
    const paymentsCollection = client.db('tools-bd').collection('payments');
    console.log('Connected');

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await usersCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next();
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    }


    app.get('/tools', async (req, res) => {
      const tools = await (await toolsCollection.find().toArray()).reverse();
      res.send(tools);
    })
    //addNewItem
    app.post('/tools', async (req, res) => {
      const item = req.body;
      const result = await toolsCollection.insertOne(item);
      res.send(result)
    })
    app.get('/tools/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const tools = await toolsCollection.findOne(query);
      res.send(tools);
    })
    //getOdersForPayment
    app.get('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const order = await ordersCollection.findOne(query);
      res.send(order);
    })
    //deleteFromItems
    app.delete('/tools/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const tools = await toolsCollection.deleteOne(query);
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
  /*   app.post('/profile', async (req, res) => {
      const orders = req.body;
      console.log(orders.email);
      const query = { email: orders.email };
      const exists = await profileCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, user: exists })
      }
      const result = await profileCollection.insertOne(orders);
      res.send(result)
    }) */
    //updateProfile
    app.put('/profile/:email', async (req, res) => {
      const email = req.params.email;
      const updatedInfo = req.body;
      const filter = { email:email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          customerName:updatedInfo.customerName,
          education: updatedInfo.education,
          location: updatedInfo.location,
          phone: updatedInfo.phone
        }
      };
      const result = await profileCollection.updateOne(filter, updatedDoc, options);
      res.send(result);

    })
    // addToReviews
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result)
    })
    //getMyOrders
    app.get('/orders', JWTverify, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email };
        const cursor = ordersCollection.find(query);
        const result = await cursor.toArray();
        return res.send(result);
      }
      else {
        return res.status(403).send({ message: 'Forbidden Access' });
      }

    })

    //getOrderForAdmin
    app.get('/order', async (req, res) => {
      const orders = await ordersCollection.find().toArray();
      res.send(orders)
    })
    //getUserForAdmin
    app.get('/user', JWTverify, verifyAdmin, async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users)
    })

    // createAdmin
    app.put('/user/admin/:email', JWTverify, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const reqAcc = await usersCollection.findOne({ email: requester });
      if (reqAcc.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);

        res.send(result);
      }
      else{
        res.status(403).send({message:'Forbidden'})
      }

    })
    //useAdmin
    app.get('/admin/:email', async(req, res) =>{
      const email = req.params.email;
      const user = await usersCollection.findOne({email: email});
      const isAdmin = user.role === 'admin';
      res.send({admin: isAdmin})
    })
    // createUser
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '6h' })
      res.send({ result, token });
    })
    /* //getMyProfile
    app.get('/profile', async(req,res)=>{
      const profiles = await profileCollection.find().toArray();
      res.send(profiles);
    }) */
    
    //getMyProfile
    app.get('/profile/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email:email};
      console.log(query);
      const user = await profileCollection.findOne(query);
      res.send(user);
    })
    
    //getMyReviews
    app.get('/reviews', async (req, res) => {
      const allReview = await (await reviewsCollection.find().toArray()).reverse();
      res.send(allReview);
    })
    //deleteFromCart
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const result = ordersCollection.deleteOne(query);
      res.send(result)
    })

    app.post('/create-payment-intent',JWTverify, async(req, res) =>{
      const orders = req.body;
      const price = orders.price;
      const amount = price*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: 'usd',
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})
    });

    app.patch('/orders/:id',  async(req, res) =>{
      const id  = req.params.id;
      console.log(id);
      const payment = req.body;
      console.log(payment);
      const filter = {_id: ObjectId(id)};
      const updatedDoc = {
        $set: {
          paid: true,
          
          transactionId: payment.transactionId
        }
      }

      const result = await paymentsCollection.insertOne(payment);
      const updatedOrders = await ordersCollection.updateOne(filter, updatedDoc);
      res.send(updatedOrders);
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