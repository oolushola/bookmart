import pool from '../middlewares/connection';
import users from '../models/usersdb';
import books from '../models/booklistdb';
import ratings from '../models/ratingsdb';

const Tables = `CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY NOT NULL,
      fullname VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      address TEXT,
      phonenumber VARCHAR(255) NOT NULL,
      photo VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    );
  CREATE TABLE IF NOT EXISTS books(
    id SERIAL PRIMARY KEY NOT NULL,
    userid INT NOT NULL,
    bookTitle VARCHAR(50) NOT NULL,
    author VARCHAR(50) NOT NULL,
    isbn VARCHAR(50) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT,
    created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ratings(
    id SERIAL PRIMARY KEY NOT NULL,
    bookid INT NOT NULL,
    rating INT NOT NULL,
    userid INT NOT NULL,
    created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`;

const queryDb = async (query) => {
  const res = await pool.query(query);
  return res;
};

const create = async (arr, table) => {
  try {
    await pool.query(Tables);
    for (let i = 0, len = arr.length; i < len; i += 1) {
      const values = Object.values(arr[i]);
      const keys = Object.keys(arr[i]);
      const query = `INSERT INTO ${table} (${keys}) VALUES (${values})`;
      queryDb(query);
    }
  } catch (error) {
    const { log } = console;
    log(error);
  }
};

const createAllTables = async () => {
  try {
    await create(users, 'users');
    await create(books, 'books');
    await create(ratings, 'ratings');
    console.log('all tables has been created');
  } catch (error) {
    console.log(error);
  }
};

createAllTables();
