import pool from '../middlewares/connection';

const dropUsersTable = 'DROP TABLE users';
const dropBooksTable = 'DROP TABLE books CASCADE';
const dropRatingsTable = 'DROP TABLE ratings';

async function deleteTables() {
  try {
    await pool.query(dropUsersTable);
    await pool.query(dropBooksTable);
    await pool.query(dropRatingsTable);
    console.log('all tables dropped');
  } catch (error) {
    console.log('could not drop table');
  }
}

deleteTables();