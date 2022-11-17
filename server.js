const express = require("express");
const fs = require("fs");
const sqlite = require("sql.js");

const filename = "db/client-manager.sqlite3";

let db;

function writeDB() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(filename, buffer);
}

if (fs.existsSync(filename)) {
    const fileBuffer = fs.readFileSync(filename);
    db = new sqlite.Database(fileBuffer);
}
else {
    db = new sqlite.Database();
    db.exec(`
    BEGIN TRANSACTION;
    CREATE TABLE ip (address VARCHAR(255) PRIMARY KEY, hosting BOOLEAN);
    CREATE TABLE candidate_host (id INTEGER PRIMARY KEY, ip VARCHAR(255), ping INTEGER);
    COMMIT;
    `);
    writeDB();
}

const app = express();

app.set("port", 3001);

if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build"));
}

const IP_COLUMNS = [
    "address",
    "hosting"
];

const CANDIDATE_HOST_COLUMNS = [
    "id",
    "ip",
    "ping"
];

app.get("/startup/candidatehosts", (req, res) => {
    const hosts = db.exec(`
    SELECT * FROM candidate_host ORDER BY ping ASC;
    `);
    res.json(hosts || []);
});

app.get("/startup/connectclient", (req, res) => {
    const timestamp = req.query.timestamp;

    if (!timestamp) {
        res.json({
            error: "Missing required parameter `timestamp`"
        });
        return;
    }

    const response = db.exec(`
        INSERT INTO candidate_host (${CANDIDATE_HOST_COLUMNS.join(", ")}) VALUES (null, '${req.ip}', ${Date.now() - timestamp});
    `);

    res.json(response || []);
});

app.listen(app.get("port"), () => {
    console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});