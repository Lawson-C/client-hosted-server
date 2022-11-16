function connect() {
    fetch(`/startup/connectclient?timestamp=${Date.now()}`, { accept: "application/json" })
        .then(checkStatus);
}

function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }
    const error = new Error(`HTTP Error ${response.statusText}`);
    error.status = response.statusText;
    error.response = response;
    console.log(error);
    throw error;
}

const Client = { connect };
export default Client;