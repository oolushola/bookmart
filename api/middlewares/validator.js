import Joi from 'joi';
import response from '../middlewares/response';

class Validator {
    static validateUserSignUp(req, res, next) {
        const data  = req.body;
        const schema = Joi.object().keys({
            fullName: Joi.string().required().regex(/^[A-Z]+ [A-Z]+$/i),
            email: Joi.string().required().email(),
            password: Joi.string().regex(/^[a-zA-Z0-9]{6,80}$/).required(),
            address: Joi.string().required(),
            phoneNumber: Joi.string().regex(/^\d{4}-\d{3}-\d{4}$/).required(),
        });
        Joi.validate(data, schema, (err, value) => {
            if(err)
            {
                return response.errorResponse(
                    res, 422, err.message.replace(/['"]/g, '')
                )
            }
            return next();
        }) 
    }

    static validateUserSignIn(req, res, next) {
        const data = req.body;
        const schema = Joi.object().keys({
            email: Joi.string().required().email(),
            password: Joi.string().regex(/^[a-zA-Z0-9]{6,16}$/).required(),
        });

        Joi.validate(data, schema, (err) => {
            if(err) {
                return response.errorResponse(
                    res, 422, err.message.replace(/['"]/g, '')
                )
            }
            return next();
        })
    }

    static validateCreateABook(req, res, next) {
        const data = req.body;
        const schema = Joi.object().keys({
            bookTitle: Joi.string().trim().required(),
            author: Joi.string().required(),
            isbn: Joi.string().required(),
            excerpt: Joi.string().required(),
            content: Joi.string()
        });

        Joi.validate(data, schema, (err) => {
            if(!err) return next(); 
            return response.errorResponse(
                res, 422, err.message.replace(/['"]/g, '')
            )
        })
    }

    static validateBookRating(req, res, next) {
        const data = req.body;
        const schema = Joi.object().keys({
            rating: Joi.number().required().min(1).max(5),
        });

        Joi.validate(data, schema, (err) => {
            if(!err) return next();
            return response.errorResponse(
                res, 422, err.message.replace(/['"]/g, '')
            )            
        })
    }

    static validateUpdateBook(req, res, next) {
        const data = req.body;
        const schema = Joi.object().keys({
            bookTitle: Joi.string().trim().required(),
            author: Joi.string().required(),
            isbn: Joi.string().required(),
            excerpt: Joi.string().required(),
            content: Joi.string()
        });
        
        Joi.validate(data, schema, err => {
            if(!err) return next();
            return response.errorResponse(
                res, 422, err.message.replace(/['"]/g, '')
            )
        })
    }
}

export default Validator;