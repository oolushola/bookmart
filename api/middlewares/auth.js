import response from '../middlewares/response';

class tokenChecker {
    static checker(req, res, next) {
      const token = req.headers.authorization;
      if (!token) {
        return response.errorResponse(
          res, 401, 'You are not logged in'
        )
      }
      return next();
    }
  }
  
  export default tokenChecker;
  