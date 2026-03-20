class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data       = data ?? null; // BUG FIX 1: undefined data should be
                                         // serialised as null, not omitted from
                                         // JSON. Some controllers passed no data
                                         // arg which left data as undefined —
                                         // JSON.stringify drops undefined fields,
                                         // so the frontend received no `data` key
                                         // at all instead of `data: null`.
        this.message    = message;
        this.success    = statusCode < 400;
    }

    // BUG FIX 2: Same issue as ApiError — non-enumerable Error properties
    // dropped during serialisation. ApiResponse is a plain object so this
    // is less severe, but an explicit toJSON guarantees consistent output
    // regardless of how res.json() serialises the instance.
    toJSON() {
        return {
            statusCode: this.statusCode,
            success:    this.success,
            message:    this.message,
            data:       this.data,
        };
    }
}

export { ApiResponse };