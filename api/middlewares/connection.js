import { Pool } from 'pg';
import dotenv from 'dotenv'
import config from '../../config';
import '@babel/polyfill';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.CONNINFO
});
    


export default pool;


