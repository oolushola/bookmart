import { Router } from 'express';
import validator from '../middlewares/validator';
import token from '../middlewares/auth';
import usersController from '../controllers/usersController';


const routes = Router();

routes.get('/', usersController.index);
routes.post('/register', 
    validator.validateUserSignUp, 
    usersController.register
);

routes.post('/login',
    validator.validateUserSignIn,
    usersController.login
);

routes.get('/books', usersController.viewAllBooks);
routes.get('/book/:bookId', usersController.viewSpecificBook);

routes.post('/create/book',
     token.checker,
     validator.validateCreateABook,
     usersController.createBook
);

routes.post('/rate-a-book/:bookId',
    token.checker,
    validator.validateBookRating,
    usersController.RateBook
);

routes.put('/update/book/:bookId', 
    token.checker,
    validator.validateUpdateBook,
    usersController.updateBook
);


export default routes;