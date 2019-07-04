import express from 'express';
import bodyParser from 'body-parser';
import dbQueries from './db/queries'
import serverConfig from './config';
import bcrypt from 'bcryptjs';
import AuthController from './auth-service/authController';

const server = express();

server.use(bodyParser.json({limit: '100mb'}));
server.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '100mb'
  })
);

server.post('/api/v1/login', async (req, res) => {
  try {
    const result = await AuthController.login(req);
    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(error);
  }
});

server.get('/api/v1/users/:id', AuthController.verifyToken, async (req, res) => {
  try {
    await dbQueries.getUserById(req.params.id).then(result => {
      if (result) {
        return res.status(200).json(result)
      }
    });
  } catch (error) {
    return res.status(500).send(error)
  }
});

server.put('/api/v1/users/:id/changePassword', AuthController.verifyToken, async (req, res) => {
  try {
    await dbQueries.changePassword(req.body, req.params.id).then(result => {
      return res.status(200).json(result)
    });
  } catch (error) {
    return res.status(500).send(error)
  }
});

server.put('/api/v1/users/:id', AuthController.verifyToken, async (req, res) => {
  try {
    await dbQueries.updateUser(req.body, req.params.id).then(result => {
      return res.status(200).json(result)
    });
  } catch (error) {
    return res.status(500).send(error)
  }
});

server.get('/api/v1/users/:id/receivers', AuthController.verifyToken, async (req, res) => {
  try {
    const currentId = req.params.id;

    await dbQueries.getUsers(currentId).then(result => {
      return res.status(200).json(result)
    });
  } catch (error) {
    return res.status(500).send(error)
  }
});

server.post('/api/v1/users', async (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync(req.body.password, 8);

    await dbQueries.createUser(Object.assign(req.body, {password: hashedPassword})).then(result => {
      return res.status(200).json(result)
    });
  } catch (error) {
    return res.status(500).send(error)
  }
});

server.delete('/api/v1/users/:id', AuthController.verifyToken, async (req, res) => {
  try {
    await dbQueries.deleteUser(req.params.id).then(result => {
      return res.status(200).json(result)
    });
  } catch (error) {
    return res.status(500).send(error)
  }
});

server.post('/api/v1/transactions', AuthController.verifyToken, async (req, res) => {
  try {
    await dbQueries.createTransaction(req.body).then(result => {
      return res.status(200).json(result)
    });
  } catch (error) {
    return res.status(500).send(error)
  }
});

server.get('/api/v1/transactions/:type/:id', AuthController.verifyToken, async (req, res) => {
  try {
    const currentId = req.params.id;
    const type = req.params.type || 'all';
    await dbQueries.getTransactions(currentId, type).then(result => {
      return res.status(200).json(result)
    });
  } catch (error) {
    return res.status(500).send(error)
  }
});

const PORT = process.env.PORT || serverConfig.port;

server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});