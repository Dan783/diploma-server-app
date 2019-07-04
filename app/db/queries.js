const Pool = require('pg').Pool;
import {CryptoController} from '../crypto-service/controllers/cryptoController';
import fs from 'fs-extra'
import bcrypt from 'bcryptjs';

const crypto = new CryptoController();

// const dbConfig = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'signer_db',
//   password: 'Crashday',
//   port: 5432,
// });

const dbConfig = new Pool({
  user: 'uvqgooiedextxu',
  host: 'ec2-23-23-241-119.compute-1.amazonaws.com',
  database: 'd2moojmcls4l84',
  password: '69f9f317965a67206b355b1a0de5659358e723c0566147cedd8286c96b1a2c91',
  port: 5432,
});

const getUsers = async (currentId) => {
  try {
    const result = await dbConfig.query(`SELECT id, login, name, surname, email, avatar_img AS "avatarImg", 
      public_pem AS "publicPem" FROM users WHERE id != $1 ORDER BY id ASC`, [currentId]);
    return result.rows;
  } catch (error) {
    console.log('Error: ', error);
    return error;
  }
};

const getUserById = async (id) => {
  try {
    const result = await dbConfig.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0]
  } catch (error) {
    console.log('Error: ', error);
    throw error;
  }
};

const createUser = async (body) => {
  try {
    const {name, surname, login, password, email, publicPem} = body;
    const getUsers = await dbConfig.query('SELECT * FROM users WHERE login = $1 LIMIT 1', [login]);
    if (getUsers.rows && getUsers.rows.length > 0) {
      throw {success: false, message: 'Login already exists'};
    }
    const avatar = toBase64('app/assets/defaultAvatar.jpg');
    const result = await dbConfig.query(`INSERT INTO users (name, surname, login, password, email, public_pem, avatar_img) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, [name, surname, login, password, email, publicPem, avatar]);
    return {success: true, message: 'User was successfully created'};
  } catch (error) {
    console.log('Error: ', error);
    throw error;
  }
};

function toBase64(file) {
  const bitmap = fs.readFileSync(file);
  return new Buffer(bitmap).toString('base64');
}


const createTransaction = async (body) => {
  try {
    const {sender, receiver, data, signHex, fileName} = body;
    const createDate = new Date();
    const dbSender = await getUserById(sender);
    const isVerified = await crypto.verifySign(signHex, data, dbSender.public_pem);
    const result = await dbConfig.query(`INSERT INTO transactions (sender, receiver, data, create_date, is_verified, file_name) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`, [sender, receiver, data, createDate, isVerified, fileName]);
    return {success: true, message: 'Transaction was successfully created'};
  } catch (error) {
    console.log('Error:', error);
    throw error;
  }
};

const getTransactions = async (id, type) => {
  try {
    let result = null;
    switch (type) {
      case 'all': {
        result = await dbConfig.query(`SELECT u1.avatar_img AS "senderAvatarImg", u1.login AS "senderLogin", 
        u2.avatar_img AS "receiverAvatarImg", u2.login AS "receiverLogin", data, create_date AS "createDate", 
        file_name AS "fileName", is_verified AS "isVerified" FROM transactions 
        LEFT JOIN users AS u1 ON transactions.sender = u1.id 
        LEFT JOIN users AS u2 ON transactions.receiver = u2.id
        WHERE receiver = $1 OR sender = $1 ORDER BY create_date DESC;`, [id]);
        break;
      }
      case 'received': {
        result = await dbConfig.query(`SELECT u1.avatar_img AS "senderAvatarImg", u1.login AS "senderLogin", 
        u2.avatar_img AS "receiverAvatarImg", u2.login AS "receiverLogin", data, create_date AS "createDate", 
        file_name AS "fileName", is_verified AS "isVerified" FROM transactions 
        LEFT JOIN users AS u1 ON transactions.sender = u1.id 
        LEFT JOIN users AS u2 ON transactions.receiver = u2.id
        WHERE receiver = $1ORDER BY create_date DESC;`, [id]);
        break;
      }
      case 'sent': {
        result = await dbConfig.query(`SELECT u1.avatar_img AS "senderAvatarImg", u1.login AS "senderLogin", 
        u2.avatar_img AS "receiverAvatarImg", u2.login AS "receiverLogin", data, create_date AS "createDate", 
        file_name AS "fileName", is_verified AS "isVerified" FROM transactions 
        LEFT JOIN users AS u1 ON transactions.sender = u1.id 
        LEFT JOIN users AS u2 ON transactions.receiver = u2.id
        WHERE sender = $1 ORDER BY create_date DESC;`, [id]);
        break;
        break;
      }
    }
    return result.rows;
  } catch (error) {
    console.log('Error: ', error);
    throw error;
  }
};

const updateUser = async (body, id) => {
  try {
    const {name, surname, login, email} = body;
    const result = await dbConfig.query(
      'UPDATE users SET name = $1, surname = $2, login = $3, email = $4 WHERE id = $5',
      [name, surname, login, email, id]);
    return {success: true, message: 'User was successfully updated'};
  } catch (error) {
    console.log('Error: ', error);
    throw error;
  }
};

const changePassword = async (body, id) => {
  try {
    const {password} = body;
    console.log('Body: ', body);
    console.log('id: ', id);
    const newPassword = bcrypt.hashSync(password, 8);
    const result = await dbConfig.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [newPassword, id]);
    return {success: true, message: 'Password was successfully updated'};
  } catch (error) {
    console.log('Error: ', error);
    throw error;
  }
};

const deleteUser = async (id) => {
  try {
    const result = await dbConfig.query('DELETE FROM users WHERE id = $1', [id]);
    return {success: true, message: 'User was successfully deleted'};
  } catch (error) {
    console.log('Error: ', error);
    throw error;
  }
};

const getUserByLogin = async (login) => {
  try {
    const result = await dbConfig.query('SELECT * FROM users WHERE login = $1 LIMIT 1', [login]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0];
    } else {
      throw {success: false, message: 'Wrong password or login'}
    }
  } catch (error) {
    console.log('Error: ', error);
    throw error;
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  getTransactions,
  updateUser,
  deleteUser,
  getUserByLogin,
  createTransaction,
  changePassword
};



