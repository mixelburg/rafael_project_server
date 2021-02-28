const http = require("http")
const port = 5000

const {MongoClient} = require("mongodb")

const uri = "mongodb+srv://admin:admin@cluster0.cs465.mongodb.net/attack_patterns?retryWrites=true&w=majority"


async function findData(collection, searchData) {

    searchData = searchData.trim()
    if (searchData === "") return []

    searchData = JSON.parse(searchData)

    const {key, lim} = searchData
    console.log("key", key)
    console.log("lim", lim)

    let result
    if (key === "") {
        result = await collection.find().limit(lim)
    } else {
        result = await collection.find(
            { $text: { $search: key } },
            { score: { $meta: "textScore" }}
            ).sort({ score: { $meta: "textScore" } }).limit(lim)
    }
    result = await result.toArray()
    return result
}


async function connectDB() {
    const client = new MongoClient(uri, { useUnifiedTopology: true })
    try{
        await client.connect()
        const attacks = client.db("attack_patterns").collection("attacks")
        await attacks.createIndex({name: "text", description: "text", x_mitre_detection: "text"})

        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');

            let body = "";
            req.on('error', (err) => {
                console.error(err);
            }).on('data', (chunk) => {
                body += chunk;
            }).on('end', () => {


                console.log("search:", body)

                findData(attacks, body).then(result => {
                    res.write(JSON.stringify(result))
                    res.end()
                })
            });
        })

        server.listen(port, (error) => {
            if (error) {
                console.log("[!] Error occurred: ", error)
            } else {
                console.log(`[+] server is listening on port: ${port}`)
            }
        })

    } catch (e) {
        console.log(e)
    }
}

connectDB()

