import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import queries from '../db/queries';
import config from '../config';

const login = async (req) => {
  try {
    const user = await queries.getUserByLogin(req.body.login);
    const isPasswordValid = bcrypt.compareSync(req.body.password, user.password);
    if (isPasswordValid) {
      const token = jwt.sign({id: user.id}, config.serverSecret, {
        expiresIn: 86400
      });
      return {success: true, auth: true, user: {id: user.id, login: user.login, token: token}};
    } else {
      throw {success: false, auth: false, message: 'Wrong password or login'};
    }
  } catch (error) {
    return error;
  }
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers['x-access-token'];
    if (!token) {
      throw res.status(403).send({success: false, auth: false, message: 'Failed to authenticate token.'});
    } else {
      await jwt.verify(token, config.serverSecret, async (err, decoded) => {
        if (err) throw res.status(403).send({success: false, auth: false, message: 'Failed to authenticate token.'});
        next();
      });
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  login,
  verifyToken
};