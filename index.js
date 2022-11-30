const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId, ObjectID, Timestamp } = require('mongodb')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const stripe = require("stripe")(process.env.ACCESS_STRIPE_KEY);

const app = express()
const port = process.env.PORT || 5000

// middlewares
app.use(cors())
app.use(express.json())

// Database Connection


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0avqkuj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
  try {
    const usersCollection = client.db('buyselldb').collection('users');
    const categoryCollection = client.db('buyselldb').collection('categories');
    const bookingsCollection = client.db('buyselldb').collection('bookings');
    const paymentsCollection = client.db('buyselldb').collection('payments');

  //   const verifyAdmin = async (req, res, next) => {
  //     const decodedEmail = req.decoded.email;
  //     const query = { email: decodedEmail };
  //     const user = await usersCollection.findOne(query);

  //     if (user?.role !== 'admin') {
  //         return res.status(403).send({ message: 'forbidden access' })
  //     }
  //     next();
  // }



    // become seller 


    // app.put('/users/:email', async (req, res) => {

    //   const email = req.params.email;
    //    const user=req.body
    //    console.log(user)

    //     const filter={email:email}
    //     const options = { upsert: true };

    //     const updateDoc={
    //        $set:
    //         user
           
    //     }

      
    // const result = await usersCollection.updateOne(filter,updateDoc,options);
    //   res.send(result);
    // });

     // Save user email & generate JWT
     app.put('/users/:email',async (req, res) => {
      const email = req.params.email
      const user = req.body
      const filter = { email: email}
      const options = { upsert: true }
      const updateDoc = {
        $set: user,
      }
      const result = await usersCollection.updateOne(filter, updateDoc, options)
      console.log(result)

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '7d',
      })

      console.log(token)
    
      res.send({ result,accessToken: token })
    })


    
    // app.get('/jwt', async (req, res) => {
    //     const email = req.query.email;
    //     const query = { email: email };
    //     const user = await usersCollection.findOne(query);
    //     if (user) {
    //         const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '7h' })
    //         return res.send({ accessToken: token });
    //     }
    //     res.status(403).send({ accessToken: '' })
    // });
   

    // app.post('/users', async (req, res) => {
    //     const user = req.body;
       
    //     console.log(user);
      
    //     const result = await usersCollection.insertOne(user);
    //     res.send(result);
    // });


    //  get vehicle caterorized 

    app.get('/categories/:id',async (req, res) => {
      const id=parseInt(req.params.id)
      
      const query = {catId:id}
      
     
        
      const vehicles = await categoryCollection.find(query).toArray();
      res.send(vehicles);
  });

  app.get('/users/:email', async (req, res) => {
    const email=req.params.email
    console.log('emailf',email)
    const query = {email:email};

    const user = await usersCollection.findOne(query);
    
    res.send(user);
});





app.get('/users/admin/:email', async (req, res) => {
  const email = req.params.email;
  const query = { email }
  const user = await usersCollection.findOne(query);
  res.send({ isAdmin: user?.role === 'admin' });
})

app.post('/category', async (req, res) => {
  const vehicle = req.body;
  
const result = await categoryCollection.insertOne(vehicle);
  res.send(result);
});

 
  //  update product status after booking

app.put('/categories/:id',  async (req, res) => {
  console.log('i AM HERE')
  const id = req.params.id;
  const product=req.body
  const filter = { _id: ObjectId(id) }
  console.log(product,filter)
  const options = { upsert: true };
  const updatedDoc = {
      $set: 
          product
      
  }
  const result = await categoryCollection.updateOne(filter, updatedDoc, options);
  console.log(result)
  res.send(result);
});

  
  
  
  //  get vehicles by Email 

  app.get('/categories', async (req, res) => {
     let x=req.query.email
    //  console.log(x)
    
    let query = {'sellerInfo.email':x}
    // console.log(query)
   
      
    const vehicles = await categoryCollection.find(query).toArray();
    
    res.send(vehicles);
});
// 

// get all the users

app.get('/users', async (req, res) => {
  const query = {};
  const users = await usersCollection.find(query).toArray();
  res.send(users);
});
    



// get my bookings
app.get('/bookings', async (req, res) => {
  let x=req.query.email
  // console.log(x)
 
 let query = {buyerEmail:x}
//  console.log(query)

   
 const bookings = await bookingsCollection.find(query).toArray();
//  console.log(bookings)
 res.send(bookings);
});

// get bookins for payment
app.get('/bookings/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const booking = await bookingsCollection.findOne(query);
  res.send(booking);
})


 // post Bookings
    app.post('/bookings',async (req, res) => {
      const booking = req.body;
      // console.log(booking);
      
const result = await bookingsCollection.insertOne(booking);
      res.send(result);
  });


// delete my bookings(ja)
  app.delete('/bookings/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await bookingsCollection.deleteOne(filter);
    res.send(result);
})
// Delete Users
  app.delete('/users/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await usersCollection.deleteOne(filter);
    res.send(result);
})


// delete my category products

  app.delete('/category/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await categoryCollection.deleteOne(filter);
    res.send(result);
})

// payment part
app.post('/create-payment-intent',verifyJWT, async (req, res) => {
  const booking = req.body;
  const price = booking.price;
  const amount = parseFloat(price) * 100;

  const paymentIntent = await stripe.paymentIntents.create({
      currency: 'usd',
      amount: amount,
      "payment_method_types": [
          "card"
      ]
  });
  res.send({
      clientSecret: paymentIntent.client_secret,
  });
});

app.post('/payments',verifyJWT, async (req, res) =>{
  const payment = req.body;
  const result = await paymentsCollection.insertOne(payment);
  const id = payment.bookingId
  const filter = {_id: ObjectId(id)}
  const updatedDoc = {
      $set: {
          paid: true,
          transactionId: payment.transactionId
      }
  }
  const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
  res.send(result);
})




    console.log('Database Connected...')
  } finally {
  }
}

run().catch(err => console.error(err))

app.get('/', (req, res) => {
  res.send('Server is running... in session')
})

app.listen(port, () => {
  console.log(` buy and sell Server is running...on ${port}`)
})
