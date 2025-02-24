require("dotenv").config();

const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.cwzf5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {


    // all the collection are here
    const userCollection = client.db("taskoraDB").collection("users");
    const taskCollection = client.db("taskoraDB").collection("tasks");
    const counterCollection = client.db("taskoraDB").collection("counter");
    const doneTaskCollection = client.db("taskoraDB").collection("doneTask");
    const inProgressCollection = client
      .db("taskoraDB")
      .collection("inProgressTask");

    // create task
    app.post("/post/task", async (req, res) => {
      const taskInfo = { ...req.body };

      const counterDoc = await counterCollection.findOne({
        id: "taskIdCounter",
      });

      const newId = counterDoc.lastId + 1;

      await counterCollection.updateOne(
        { id: "taskIdCounter" },
        { $set: { lastId: newId } }
      );

      taskInfo.order = newId;
      const result = await taskCollection.insertOne(taskInfo);
      res.send(result);
    });

    // get task to update::: by id

    app.get("/get/task/:id", async (req, res) => {
      const { id } = req.params;

      const query = { _id: new ObjectId(id) };

      const result = await taskCollection.findOne(query);
      res.send(result);
    });

    // update task by id
    app.patch("/patch/task/:id", async (req, res) => {
      const { id } = req.params;
      const taskInfo = { ...req.body };
      // console.log(id, taskInfo);

      const query = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          user: taskInfo?.user,
          title: taskInfo?.title,
          description: taskInfo?.description,
          deadline: taskInfo?.deadline,
          editAt: taskInfo?.editAt,
          category: taskInfo?.category,
        },
      };

      const result = await taskCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // get task::: for specific user ::: identified by user email
    app.get("/get/tasks", async (req, res) => {
      const user = req.query;

      // const query = { user: user.email, category: user.category };
      const query = { user: user.email };

      const result = await taskCollection
        .find(query)
        // .sort({ order: 1 })
        .toArray();
      res.send(result);
      // }
    });

    // Update task category
    app.patch("/update/task/:id", async (req, res) => {
      const { id } = req.params; // Task ID from URL
      const { category } = req.body; // New category from frontend

      // console.log(id, category);

      const query = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          category: category,
        },
      };

      const result = await taskCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // delete task
    app.delete("/delete/task/:id", async (req, res) => {
      const { id } = req.params;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await taskCollection.deleteOne(query);
      res.send(result);
      // console.log(id);
    });

    // create user
    app.post("/post/create-user", async (req, res) => {
      const user = req.body;
      // check user exist or not
      const query = { userEmail: user.userEmail };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({
          message: "User already exists",
          insertedId: null,
        });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
