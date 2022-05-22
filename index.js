const express = require('express');
const cors = require('cors');


require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
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
      const toolsCollection = client.db('tools-bd').collection('products')
      console.log('Connected');
  
      app.get('/tools',  async (req, res) => {
        const tools = await toolsCollection.find().toArray();
        res.send(tools);
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