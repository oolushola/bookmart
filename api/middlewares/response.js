/**
 * 
 * @description Method to send response in the generic format
 * @param {*} res Express Response Object
 * @param { number } status code in integer
 * @param { string } message Message to be dislayed to the user
 * 
 * @memberof { Object } res
 */

 class response {

    /**
     * @description Successful response. This method
     * will be invoked with a status code of 200 || 201
     * 
     * @param { Object } res The express response Object 
     * @param { Integer } code 
     * @param { string } description 
     * @param { Object } | [Array{...}] payload  
     * @param { String } token : (Optional) 
     */

    static successResponse(res, code, description, payload, token) {
        res.status(code).json({
            status: code,
            message: description,
            data: payload,
            token
        })
    }

    /**
     * @description Error response. This method
     * will be invoked with a status code of 401 || 409 || 422 || 500 || 403
     * 
     * @param { Object } res The express response Object
     * @param { Integer } code 
     * @param { string } description 
     */

    static errorResponse(res, code, description) {
        res.status(code).json({
            status: code,
            message: description,
        })
    }
 }
 export default response