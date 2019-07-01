import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import config from '../../config';
import response from '../middlewares/response';

import users from '../models/usersdb';
import books from '../models/booklistdb';
import ratings from '../models/ratingsdb';

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
       const { email, fullname, password, address, phoneNumber } = req.body;
       const hashedPassword = bcrypt.hashSync(password, 8);
        try {
            users.map((value, index)=>{
                if(value.email === email) {
                    return response.errorResponse(
                        res, 409, 'A user with the email already exists'
                    );
                }
            });
        }
        catch(err){
            return response.errorResponse(
                res, 500, 'Internal Server Error'
            );
        }
        finally { 
            const user = {
                id: users.length + 1,
                email:email,
                fullname: fullname,
                password: hashedPassword,
                address:address,
                phoneNumber: phoneNumber
            }
            const token = jwt.sign({ email }, config.secret, { expiresIn: 86400 });
            users.push(user);
            return response.successResponse(
                res, 200, 'Registration Succesful', user, token
            )
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

   static login(req, res) {
        const { email, password } = req.body;
        
        try {
            users.find((user) => {
                const hashedPassword = bcrypt.compareSync(password, user.password);
                if(user.email === email && hashedPassword){
                    const token = jwt.sign({id:user.id}, config.secret, { expiresIn: 86400 });
                    const data = {
                        email: user.email,
                        address: user.address,
                        phoneNumber: user.phoneNumber,
                        fullname: user.fullname
                    }
                    return response.successResponse(
                        res, 200, 'Login Successful', data, token
                    );
                }
            });
        } catch(err) {
            return response.errorResponse(
                res, 500, 'Internal Server Error'
            );
        }
        finally {
            return response.errorResponse(
                res, 401, 'Invalid login details'
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
       return response.successResponse(
           res, 200, 'All Books at GETDEV BookMart', books
        );
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
        try {
            books.find((book, index) => {
                if(book.id === Number(bookId))
                {
                    return response.successResponse(
                        res, 200, book.bookTitle, book
                    ); 
                }
            })
        }
        catch(err) {
            return response.errorResponse(
                res, 500, 'Internal Server Error'
            );
        }
        finally {
            return response.errorResponse(
                res, 404, 'Sorry, we cant find the requested book.'
            )
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
                    res, 401, 'Can\'t verify bearer token.'
                )
            } 
            try {
                books.find((book) => {
                    if(book.author === author && book.bookTitle === bookTitle)
                    {
                        return response.successResponse(
                            res, 409, 'A book title of the same author already exsists.'
                        )
                    }
                })
            }
            catch(err){
                return response.errorResponse(
                    res, 500, 'Internal Server Error'
                )
            }
            finally {
                const bookDetails = {
                    id: books.length + 1,
                    userId: decoded.id,
                    bookTitle,
                    author,
                    isbn,
                    excerpt,
                    content
                }
                books.push(bookDetails);
                return response.successResponse(
                    res, 200, `${bookTitle} has been added successfully to the BookMart`, bookDetails
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
        const { rating } = req.body;
        const token = req.headers.authorization;

        jwt.verify(token, config.secret, (err, decoded) => {
            
            if(err) return response.errorResponse(
                res, 401, 'Can\'t verify bearer token'
            )
           try {
                ratings.find((userRating) => {
                    const userInstance = userRating.userId === Number(decoded.id);
                    const bookInstance = userRating.bookId === Number(bookId)
                    if(userInstance && bookInstance) {
                        return response.errorResponse(
                            res, 409, 'You have rated this book before.'
                        )
                    }
                })
            } 
            catch(err){
                return response.errorResponse(
                    res, 500, 'Internal Server Error.'
                )
            }
            finally {
                const ratingsValue = {
                    id:ratings.length+1,
                    bookId: Number(bookId),
                    ratings:Number(rating),
                    userId:decoded.id
                }
                ratings.push(ratingsValue);
                books.find(book=>{
                    if(book.id === Number(bookId)){
                         const bookData = {
                             title: book.bookTitle,
                             author:book.author,
                             isbn:book.isbn,
                             response: `You rated ${book.bookTitle} with ${Number(rating)}`
                         }
                         return response.successResponse(
                             res, 201, 'You rating record', bookData, ratingsValue
                         )
                    }
                }) 
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
                    res, 401, 'Can\'t verify bearer token.'
                )
            }
            const { bookId } = req.params;
            const userId = decoded.id;
            try {
                const verifyUser = books.find(book => book.id === Number(bookId));
                if(verifyUser.userId !== userId) return response.errorResponse(
                    res, 403, 'Sorry, you are not authorized to update a book created by another user'
                )
            }
            catch(err) {
                return response.errorResponse(
                    res, 500, 'Internal Server Error.'
                )
            }
            finally {
                const { bookTitle, author, isbn, excerpt, content } = req.body;
                
                const updateBook = books.find(book => book.id === Number(bookId));
                if(updateBook){
                    const bookDetails = {
                        id:Number(bookId),
                        userId,
                        bookTitle,
                        author,
                        isbn,
                        excerpt,
                        content
                    }
                    return response.successResponse(
                        res, 201, 'Book has been updated successfully.', bookDetails
                    );
                }
            }
        });
   }

   static deleteBook(req, res) {

   }
}

export default usersController;

