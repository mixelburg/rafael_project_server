const { MongoClient } = require("mongodb")
const Express = require("express")

const uri = "mongodb+srv://admin:admin@cluster0.cs465.mongodb.net/attack_patterns?retryWrites=true&w=majority"
const port = 5000

async function findData(collection, searchData) {
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
        await attacks.createIndex({"$**": "text"})
        console.log("[+] DB connected")

        const app = Express()
        app.use(Express.json())
        app.use(Express.urlencoded({extended: true}))

        app.post("/find", ((req, res) => {
            console.log(req.body)
            findData(attacks, req.body).then(result => {
                res.json(result)
            })
        }))

        app.listen(port, () => {
            console.log(`[+] listening on port ${port}`)
        })

    } catch (e) {
        console.log(e)
    }
}

connectDB()

