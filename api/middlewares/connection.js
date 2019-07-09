import { Pool } from 'pg';
import dotenv from 'dotenv'
import config from '../../config';
import '@babel/polyfill';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
    


export default pool;


