class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data       = null;
        this.message    = message;
        this.success    = false;
        this.errors     = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    // BUG FIX 1: When ApiError was serialised to JSON (e.g. res.json(err)
    // accidentally, or in logging), inherited Error properties like `message`
    // and `stack` are non-enumerable and are silently dropped.
    // The statusCode, errors, and success fields were visible but message
    // showed as undefined in some serialisers.
    // Adding toJSON() ensures consistent serialisation everywhere.
    toJSON() {
        return {
            statusCode: this.statusCode,
            success:    this.success,
            message:    this.message,
            errors:     this.errors,
            data:       this.data,
        };
    }
}

export { ApiError };