import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import routes from './routes/users-route';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { extended: true }));
app.get('/', routes);
app.use('/api/v1/', routes);

app.all('*', (req, res)=>{
    res.status(404).json({
        status:404,
        response: 'Sorry, the requested URL could not be found',
        error:true
    });
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if (err) {
        throw err;
    }
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});

export default app;


