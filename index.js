const http = require('http')
const fs = require('fs')

const server = http.createServer()

const CHUNK_SIZE = 10 ** 6 // 1MB
server.on('request', (req, res) => {
    console.log("Request received for: " + req.url);


    if (req.url === '/video') {

        const range = req.headers.range

        console.log(range);
        if (!range) {
            res.writeHead(400, {
                'content-type': 'text/html',
                'Access-Control-Allow-Origin': '*',
            })
            res.end('<h1>Requires Range header</h1>')
            return
        }

        const videoPath = './web.mp4'
        const videoSize = fs.statSync(videoPath).size

        const bytes = range ? range.replace(/bytes=/, '').split('-') : [0]
        const start = parseInt(bytes[0], 10)
        const end = bytes[1] ? parseInt(bytes[1], 10) : videoSize

        // stream the video

        // prepare the header
        const contentLength = end - start + 1

        const headers = {
            'Content-Range': `bytes ${start}-${end}/${videoSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mp4',
            'Access-Control-Allow-Origin': '*',
        }

        res.writeHead(206, headers)

        const videoStream = fs.createReadStream(videoPath, {
            start,
            end,
        })

        videoStream.on('open', () => {
            console.log("Stream opened");
            videoStream.pipe(res)
        })

        videoStream.on("data", (chunk) => {
            console.log("Chunk received");

        })

        videoStream.on("end", () => {
            console.log("Stream ended");

        })
        videoStream.on('error', (err) => {
            res.end(err)
        })

        res.on('close', () => {
            videoStream.destroy()
            console.log("Res closed");
        })
    } else {
        res.writeHead(200, {
            'content-type': 'text/html',
            'Access-Control-Allow-Origin': '*',
        })
        res.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Video Streaming With Node</title>
            <style>
                body {
                    margin: 5% auto;
                    max-width: 100%;
                    padding-top: 10%;
                    padding-left: 35%;
                }
            </style>
        </head>
        <body>
            <h1>Video Streaming</h1>
            <video id="videoPlayer" width="50%" controls muted="muted" autoplay>
                <source src="/video" type="video/mp4" />
            </video>
        </body>
        </html>
        `)
        res.end()
    }
})
server.listen(3000, () => {
    console.log('Server is running...')
})