import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../middlewares/connection';
import config from '../../config';
import response from '../middlewares/response';

class usersController {
   static index(req, res) {
        response.successResponse(res, 200, 'Welcome to GETDEV BookMart');
   }

   /**
    * Required fields to be specified during sign up
    * 
    * @param {*} req 
    * @param {*} res 
    * 
    * @returns { Object } status, user details, 
    * HTTP response code, message
    */

   static register(req, res) {
       const { email, fullName, password, address, phoneNumber } = req.body;
       const hashedPassword = bcrypt.hashSync(password, 8);
        try {
            const query = 'SELECT email FROM users WHERE email = $1 ';
            pool.query(query, [email], (err, result) => {
                if(err) return err;
                if(result.rowCount > 0){
                    return response.errorResponse(
                        res, 409, `A user with ${email} already exists`
                    );
                }
            })
        }
        catch(err) {
            return response.errorResponse(
                res, 500, 'Internal Server Error.'
            )
        }
        finally { 
            const insertQuery = 'INSERT INTO users (fullname, email, password, address, phonenumber) VALUES($1, $2, $3, $4, $5) RETURNING id ';
            pool.query(insertQuery, [fullName, email, hashedPassword, address, phoneNumber], (err, data) => {
                if(err) return err;
                const token = jwt.sign({ email }, config.secret, { expiresIn: 86400 });
                const accessToken = `Bearer ${token}`;
                const { id } = data.rows[0];
                return response.successResponse(
                    res, 201, 'Registration Succesful', 
                    { id, fullName, email, address, phoneNumber, accessToken }
                )
            })            
        }
   }

   /**
    * Required fields for successful login
    * 
    * @param { string } req 
    * @param { Object } res 
    * 
    * @throws {errException}
    * 
    * @returns {Object} token, id, HTTP Response
    */

   static  login(req, res) {
        const { email, password } = req.body;
        let verifyPassword;
        try {
            const checkEmailExist = 'SELECT * FROM users WHERE email = $1';
            pool.query(checkEmailExist, [email], (err, data)=>{
                if(data.rowCount <= 0) 
                {
                    return response.errorResponse(
                        res, 401, 'This login credentials does not match our record.'
                    );
                }

                verifyPassword = data.rows[0].password;
                const passwordCompare = bcrypt.compareSync(password, verifyPassword); 
                if(!passwordCompare) {
                    return response.errorResponse(
                        res, 401, 'Email and Password does not match'
                    );
                } else {
                    const { id, fullname, email, address, phonenumber } = data.rows[0];
                    const token = jwt.sign({ id }, config.secret, { expiresIn: 86400 }); 
                    return response.successResponse(
                        res, 200, 'Login Successful', { token, id, fullname, email, address, phonenumber }
                    )
                }
            });
        } catch(err) {
            return response.errorResponse(
                res, 500, 'Internal Server Error'
            );
        }
    }

    /**
     * This endpoint is exposed to the general public
     * to view all kinds of books available at the store
     * 
     * @param {*} req 
     * @param {*} res 
     * 
     * @returns [{...}] Array of Objects
     */
            
   static viewAllBooks(req, res) {
       const books = 'SELECT b.fullname, a.* FROM books a LEFT JOIN users b ON a.userid = b.id ORDER BY a.created_on'
       pool.query(books, (err, data) => {
        return response.successResponse(
            res, 200, 'All Books at GETDEV BookMart', data.rows
         );
       })
   }

   /**
    * This endpoint is exposed to the general public
    * to view single specific books.
    * 
    * @param {integer} req n 
    * @param { Object } res 
    * 
    * @returns { Object}
    */

   static viewSpecificBook(req, res) {
        const { bookId } = req.params;
        let totalNumber;
        let averageRating;
        let totalRating = 0;
        try {
            const checkbook = 'SELECT * FROM books WHERE id = $1';
            pool.query(checkbook, [bookId], (err, data) => {
                if(err) return response.errorResponse(
                    res, 400, 'Invalid Request, Are you human?'
                )
                if(data.rowCount <= 0 ) {
                    return response.errorResponse(
                        res, 404, 'Sorry, we don\'t have what you are looking for.'
                    )
                }
                else {
                    const getRatings = 'SELECT rating FROM ratings WHERE bookid = $1 ';
                    pool.query(getRatings, [bookId], (err, result) => {
                        
                        totalNumber = result.rowCount;
                        result.rows.map((rated)=>{
                            totalRating += rated.rating
                        })
                        averageRating = totalRating / totalNumber
                           
                        
                        return response.successResponse(
                            res, 200, 'We found your book.', data.rows, averageRating
                        )
                    })

                    
                }
            });
        }
        catch(err) {
            return response.errorResponse(
                res, 500, 'Internal Server Error'
            );
        }
   }

   /**
    * This allows only authenticated and authorized
    * user to be able to create books.
    * 
    * @param {(string\|number)} req 
    * @param { Object } res 
    * 
    * @return { Object } bookInfo, HTTP-Response Code
    * 
    */

   static createBook(req, res) {
        const { bookTitle, author, isbn, excerpt, content } = req.body;
        const token = req.headers.authorization;
        jwt.verify(token, config.secret, (err, decoded) => { 
            if(err){
                return response.errorResponse(
                    res, 401, 'Can\'t verify bearer token. Login session expired or invalid'
                )
            } 
            try {
                const checkBookQuery = 'SELECT author, booktitle FROM books where author = $1 AND booktitle = $2'
                pool.query(checkBookQuery, [author, bookTitle], (err, data) => {
                    if(err) return response.errorResponse(
                        res, 400, 'Bad Request. Are you sure you are human?'
                    )
                    if(data.rowCount > 0 ) return response.errorResponse(
                        res, 409, `${bookTitle}, Authored by: ${author} already exists.`
                    )
                    const userId = decoded.id;
                    const createBookQuery = 'INSERT INTO books (userid, booktitle, author, isbn, excerpt, content) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
                    pool.query(createBookQuery, 
                        [userId, bookTitle, author, isbn, excerpt, content], 
                        (err, data) => {
                            if(err) return response.errorResponse(
                                res, 400, 'Bad request. Are you sure you are human?'
                            )
                            const { id } = data.rows[0]; 
                            return response.successResponse(
                                res, 201, 
                                `${bookTitle} has been added successfully to the BookMart`, 
                                {id, userId, bookTitle, author, isbn, excerpt, content }
                            )
                    })
                });
            }
            catch(err){
                return response.errorResponse(
                    res, 500, 'Internal Server Error'
                )
            }
        })
    }

    /**
     * Rate a book with the ID of the book,
     * signed in user as a request query
     * and the bookID as the request parameter
     * 
     * @param { string=n } req 
     * @param { Object } res 
     * 
     * @returns { Object } 
     */

   static RateBook(req, res) {
        const { bookId } = req.params;
        const bookid = Number(bookId);
        const { rating } = req.body;
        const ratings = Number(rating);
        const token = req.headers.authorization;
        

        jwt.verify(token, config.secret, (err, decoded) => {
            if(err) return response.errorResponse(
                res, 401, 'Can\'t verify bearer token. Login session expired or invalid'
            )
            try {
                const userId = decoded.id;
                const checkUserRatings = 'SELECT * FROM ratings WHERE bookid = $1 AND userid = $2';
                pool.query(checkUserRatings, [bookid, userId], (err, data) => {
                    if(err) return response.errorResponse(
                        res, 400, 'Bad Request. Are you human?'
                    )
                    if(data.rowCount > 0) { 
                        return response.errorResponse(
                            res, 409, 'You already rated this book.'
                        )  
                    }
                    else {
                        const insertRatings = 'INSERT INTO ratings (bookid, rating, userid) VALUES ($1, $2, $3) RETURNING id '
                        pool.query(insertRatings, [bookid, ratings, userId], (err, data) => {
                            if(err) return response.errorResponse(
                                res, 400, 'Bad Request. Are you human?'
                            )
                            const { id } = data.rows[0];

                            // put here

                            return response.successResponse(
                                res, 201, 'Your ratings has been successfully recorded', 
                                {id, bookid, ratings, userId }
                            )
                        })
                    }                  
                })                
            } 
            catch(err){
                return response.errorResponse(
                    res, 500, 'Internal Server Error.'
                )
            }
        })
   }

   /**
    * @description This allows only authenticated and authorized
    * user to be able to update books. Authenticated user are not
    * authorised to update books created by another user.
    * 
    * @param {(string\|number)} req 
    * @param { Object } res 
    * 
    * @return { Object } bookInfo, HTTP-Response Code
    * 
    */


   static updateBook(req, res) {
        const token = req.headers.authorization
        jwt.verify(token, config.secret, (err, decoded) => {
            if(err) {
                return response.errorResponse(
                    res, 401, 'Can\'t verify bearer token. Login session expired or invalid'
                )
            }
            const { bookId } = req.params;
            const userId = decoded.id;
            const { bookTitle, author, isbn, excerpt, content } = req.body;
            try {
                const userIdentity = 'SELECT * FROM books WHERE id = $1'
                pool.query(userIdentity, [Number(bookId)], (err, data) => {
                    if(err) return response.errorResponse(
                        res, 400, 'Bad Request. Are you human?'
                    )
                    if(data.rowCount <= 0) return response.errorResponse(
                        res, 404, 'Sorry we cant find a book of that record.'
                    )
                    const getUserId = data.rows[0].userid;
                    if(getUserId !== userId){
                        return response.errorResponse(
                            res, 401, 'Sorry, you are not authorized to update a book created by another user'
                        )
                    } else{
                        const checkupdateBookQuery = 'SELECT * FROM books WHERE booktitle = $1 AND author = $2 AND id != $3'
                        pool.query(checkupdateBookQuery, 
                            [bookTitle, author, Number(bookId)], 
                            (err, data) => {
                            if(err) return response.errorResponse(
                                res, 400, 'Bad Request. Are you human?'
                            )
                            if(data.rowCount > 0) return response.errorResponse(
                                res, 409, 
                                `A book with titled ${bookTitle} by ${author} already exists`
                            )
                            const updateQuery = 'UPDATE books SET userid = $1, booktitle = $2, author = $3, isbn = $4, excerpt = $5, content = $6 WHERE id = $7'
                            pool.query(
                                updateQuery, 
                                [userId, bookTitle, author, isbn, excerpt, content, Number(bookId)], 
                                (err, data) => {
                                return response.successResponse(
                                    res, 201, 
                                    `${bookTitle} Updated Successfully.`, 
                                    { bookId, userId, bookTitle, author, isbn, excerpt, content }
                                )
                            }) 
                        })
                    }
                });
            }
            catch(err) {
                return response.errorResponse(
                    res, 500, 'Internal Server Error.'
                )
            }
        });
   }

   /**
    * @description This allows only authenticated and authorized
    * user to be able to delete books. Authenticated user are not
    * authorised to delete books created by another user.
    * 
    * @param {(string\|number)} req 
    * @param { Object } res 
    * 
    * @return { Object } bookInfo, HTTP-Response Code
    * 
    */

   static deleteBook(req, res) {
    const { id } = req.params;
    const token = req.headers.authorization;
    
    jwt.verify(token, config.secret, (err, decoded) => {
        if(err) return response.errorResponse(
            res, 401, 'Can\'t verify bearer token. Login Session Expired or Invalid.'
        )
        const userId = decoded.id;
        try {
            const checkUserValidity = 'SELECT * FROM books WHERE id = $1 AND userid = $2'
            pool.query(checkUserValidity, [Number(id), userId], (err, data) => {
                if(err) return response.errorResponse(
                    res, 500, 'Something went wrong. Internal Server Error.'
                )
                if(data.rowCount <= 0) return response.errorResponse(
                    res, 401, 'Sorry, we cant find any of your books that matches this record'
                )

                const deleteQuery = 'DELETE FROM books WHERE id = $1 AND userid = $2'
                pool.query(deleteQuery, [Number(id), userId], (err, data) => {
                    if(err) return errorResponse(
                        res, 500, 'Something went wrong. Internal Server Error.'
                    )
                    return response.successResponse(
                        res, 200, 'Book has been deleted successfully.'
                    )
                });
            });
        }
        catch(error) {
            return response.errorResponse(
                res, 500, 'Internal Server Error.'
            )
        } 
    })
   }
}

export default usersController;

