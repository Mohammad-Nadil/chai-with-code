class apiError extends Error {
    constructor(status , message = "something is wrong" , stack = '' , code = '') {
        super(message);
        this.status = status;
        this.stack = stack;
        this.code = code

        if(stack){
            this.stack = stack
        }else{
            this.stack = this.stack
        }
        
    }
}