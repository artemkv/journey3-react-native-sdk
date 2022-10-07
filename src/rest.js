// TODO:
// const baseUrl = 'http://127.0.0.1:8070';
const baseUrl = 'https://journey3-ingest.artemkv.net:8060';

class ApiError extends Error {
    constructor(statusCode, statusMessage, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }

        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
    }
}

const handleErrors = async response => {
    if (response.status < 400) {
        return response;
    }

    let err = response.statusText;
    try {
        const json = await response.json();
        err = json.err;
    } finally {
        // ignore
    }

    throw new ApiError(
        response.status,
        response.statusText,
        err);
}

const toJson = response => response.json();
const toData = json => json.data;

const postJson = (endpoint, data) => {
    const headers = {
        'Content-Type': 'application/json'
    };

    return fetch(
        baseUrl + endpoint,
        {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers,
            body: data ? JSON.stringify(data) : null
        })
        .then(handleErrors)
        .then(toJson)
        .then(toData);
}

const postSessionHeader = async data => {
    try {
        return await postJson('/session_head', data);
    } catch (err) {
        err.message = "Error sending session header to Journey: " + err.message;
        throw err;
    }
}

const postSession = async data => {
    try {
        return await postJson('/session_tail', data);
    } catch (err) {
        err.message = "Error sending session to Journey: " + err.message;
        throw err;
    }
}

const postSessionFlush = async data => {
    try {
        return await postJson('/session_flush', data);
    } catch (err) {
        err.message = "Error sending session flush to Journey: " + err.message;
        throw err;
    }
}

export default {
    postSessionHeader,
    postSession,
    postSessionFlush
};