// BUG FIX 1: The original asyncHandler catches errors and calls next(err),
// which is correct. HOWEVER — when an ApiError is thrown, the global error
// handler in server.js reads err.statusCode. The base Error class does not
// have statusCode, so if a plain Error is thrown (not ApiError), statusCode
// is undefined and the response defaults to 500. That's fine.
//
// The real bug is subtler: if an async route throws SYNCHRONOUSLY before
// the first await (e.g. in parameter destructuring), the Promise.resolve()
// wrapper does NOT catch it — it propagates as an unhandled exception.
//
// Fix: wrap the entire handler invocation in a try/catch so both sync
// throws and rejected promises are routed to next(err).

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        try {
            Promise.resolve(requestHandler(req, res, next)).catch(next);
        } catch (err) {
            // Catches synchronous throws before the first await
            next(err);
        }
    };
};

export { asyncHandler };