import express from "express";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import joi from "joi";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient
  .connect()
  .then(() => {
    db = mongoClient.db();
    console.log("Banco de dados conectado");
  })
  .catch((err) => res.status(500).send(err.message));

app.post("/sign-up", async (req, res) => {
  const { username, avatar } = req.body;

  const newUser = { username, avatar };

  const loginSchema = joi.object({
    username: joi.string().max(15).required(),
    avatar: joi.string().required(),
  });

  const validation = loginSchema.validate(newUser, { abortEarly: false });

  if (validation.error) {
    return res.status(422).send("Unprocessable Entity");
  }

  try {
    await db.collection("users").insertOne(newUser);
    res.status(201).send("Created");
  } catch (error) {
    res.status(500).send(err.message);
  }
});

app.get("/sign-up", (req, res) => {
  db.collection("users")
    .find()
    .toArray()
    .then((users) => {
      res.send(users);
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
});

app.post("/tweets", async (req, res) => {
  const { username, tweet } = req.body;

  const tweetSchema = joi.object({
    username: joi.string().required(),
    tweet: joi.string().required(),
  });

  const validation = tweetSchema.validate(
    { username, tweet },
    { abortEarly: false }
  );

  if (validation.error) {
    return res.status(422).send("Unprocessable Entity");
  }

  try {
    const usuarioExistente = await db.collection("users").findOne({ username });
    if (!usuarioExistente) {
      return res.status(401).send("Unauthorized");
    }
    const newTweet = { username, tweet, avatar: usuarioExistente.avatar };

    db.collection("tweets").insertOne(newTweet);
    res.status(201).send("Created");
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/tweets", (req, res) => {
  db.collection("tweets")
    .find()
    .sort({ _id: -1 })
    .toArray()
    .then((tweets) => {
      res.send(tweets);
    })
    .catch((err) => {
      console.log(err.message);
    });
});

app.put("/tweets/:id", async (req, res) => {
  const { id } = req.params;
  const { username, tweet } = req.body;

  const tweetSchema = joi.object({
    username: joi.string().required(),
    tweet: joi.string().required(),
  });

  const validation = tweetSchema.validate(
    { username, tweet },
    { abortEarly: false }
  );

  if (validation.error) {
    return res.status(422).send("Unprocessable Entity");
  }

  try {
    const verificarIdExistente = await db.collection("tweets").findOne({
      _id: new ObjectId(id),
    });

    if (!verificarIdExistente) {
      return res.status(404).send("Not Found");
    }

    await db.collection("tweets").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          username,
          tweet,
        },
      }
    );

    return res.status(204).send("No Content");
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

app.delete("/tweets/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await db.collection("tweets").deleteOne({
      _id: new ObjectId(id),
    });

    if (resultado.deletedCount === 0) {
      return res.status(404).send("Esse tweet não existe!");
    }

    return res.status(204).send("No Content");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
