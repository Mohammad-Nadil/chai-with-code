class apiError extends Error {
    constructor(status , message = "something is wrong" , stack = '' , code = '') {
        super(message);
        this.status = status;
        this.stack = stack;
        this.success = false
        this.code = code

        if(stack){
            this.stack = stack
        }else{
           Error.captureStackTrace(this , this.constructor)
        }
        
    }
}

export {apiError}