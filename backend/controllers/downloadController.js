const { spawn } = require('child_process');
const path = require("path");
const fs = require('fs');
const url = require('url');
const { wss } = require("../server.js")
// const { YtDlp } = require("ytdlp-nodejs");
// const ytdlp = new YtDlp();
// const ytDlpWrap = require("yt-dlp-wrap").default;
// const ytdlp = new ytDlpWrap();


// using Map to store active WebSocket connections by a unique session ID
const activeSessions = new Map();

// using Map to store download processes for each session, keyed by sessionId and videoUrl
const activeDownloads = new Map();

wss.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true);
    const sessionId = parameters.query.sessionId;

    if (!sessionId) {
        ws.close(1008, 'Session ID is required.');
        return;
    }

    activeSessions.set(sessionId, ws);
    console.log(`WebSocket connected for session: ${sessionId}`);

    ws.on('close', () => {
        console.log(`WebSocket disconnected for session: ${sessionId}`);
        activeSessions.delete(sessionId);
        // Abort all downloads for this session if a connection is lost
        if (activeDownloads.has(sessionId)) {
            activeDownloads.get(sessionId).forEach(ytDlpProcess => {
                ytDlpProcess.kill('SIGINT');
            });
            activeDownloads.delete(sessionId);
        }
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for session ${sessionId}:`, error);
    });
});


//creating a downloads folder if it doesn't exist
const DOWNLOAD_FOLDER = path.join((__dirname.split("Downloads")[0]), "../", "Downloads");
if (!fs.existsSync(DOWNLOAD_FOLDER)) {
    fs.mkdirSync(DOWNLOAD_FOLDER);
}


exports.downloadPlaylist = async (req, res) => {
    const listUrl = req.query.listUrl;
    console.log("requesting playlist download :", listUrl);
    let videos = await downloadPlaylist(listUrl) // getting all videos of playlist in an array
    res.send({ videos })
}

//---------------------- DOWNLOADING VIDEO -------------------------

exports.downloadVideo = async (req, res) => {
    console.log("downloading video")
    const { videoUrl, quality, extention, sessionId } = req.body;
    console.log("requesting video download", videoUrl);
    // downloadVideo(res, videoUrl, quality, extention)
    // downloadVideo(res, videoUrl)
    // res.json("jhhbjg");

    if (!videoUrl || !sessionId) {
        return res.status(400).send('Video URL and Session ID are required.');
    }
    console.log(videoUrl, quality, extention, sessionId)

    const ws = activeSessions.get(sessionId);
    if (!ws || ws.readyState !== ws.OPEN) {
        return res.status(400).send('WebSocket connection is not active.');
    }

    activeDownloads.set(sessionId, new Map());

    console.log(__dirname);
    const tempDir = path.join(__dirname, "..", 'downloads', sessionId);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const filePath = path.join(tempDir, '%(title)s.%(ext)s');

    const args = [
        videoUrl,
        // '-f', 'bestvideo+bestaudio/best',
        '-f', `bestvideo[height<=${quality}][ext=${extention}]+bestaudio[ext=${extention == "mp4" ? "m4a" : "webm"}]/best/best`,
        // '-f', `bestvideo[height<=${quality}]+bestaudio/best/best`,
        '-o', filePath,
        '--progress',
        '--no-playlist',
        '--embed-thumbnail',
        '--recode-video', 'mp4'
    ];

    // Spawn yt-dlp process
    const ytDlp = spawn('yt-dlp', args);
    activeDownloads.get(sessionId).set(videoUrl, ytDlp);

    ytDlp.stdout.on('data', (data) => {
        const output = data.toString();
        const progressMatch = output.match(/\[download\]\s+(\d+\.\d+)%/);
        const speedMatch = output.match(/at\s+([0-9\.]+[KMG]i?B\/s)/);
        const sizeMatch = output.match(/of\s+([0-9\.]+[KMG]i?B)/);
        const titleMatch = output.match(/\[download\]\s+Destination:\s+(.*)\n/);

        if (progressMatch && ws && ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
                type: 'progress',
                url: videoUrl,
                progress: parseFloat(progressMatch[1]),
                speed: speedMatch ? speedMatch[1] : 'N/A',
                size: sizeMatch ? sizeMatch[1] : 'N/A'
            }));
        }
    });


    ytDlp.stderr.on('data', (data) => {
        console.error(`yt-dlp stderr for ${videoUrl}: ${data}`);
        if (ws && ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
                type: 'error',
                url: videoUrl,
                message: `Download failed: ${data}`
            }));
        }
    });

    ytDlp.on('close', (code) => {
        const downloadsForSession = activeDownloads.get(sessionId);
        if (downloadsForSession) {
            downloadsForSession.delete(videoUrl);
        }

        if (code === 0) {
            // Use a slight delay to ensure the file is not locked
            setTimeout(() => {
                fs.readdir(tempDir, (err, files) => {
                    if (err) {
                        console.error('Error reading directory:', err);
                        if (ws && ws.readyState === ws.OPEN) {
                            ws.send(JSON.stringify({ type: 'error', url: videoUrl, message: 'Download successful, but could not read the downloads directory.' }));
                        }
                        return;
                    }

                    // Find the downloaded file based on common video extensions
                    const videoFile = files.find(file => {
                        const ext = path.extname(file).toLowerCase();
                        return ['.mp4', '.mkv', '.webm'].includes(ext);
                    });

                    if (!videoFile) {
                        console.error(`File not found for ${videoUrl} in ${tempDir}`);
                        if (ws && ws.readyState === ws.OPEN) {
                            ws.send(JSON.stringify({ type: 'error', url: videoUrl, message: 'Download successful, but could not find the downloaded video file.' }));
                        }
                        return;
                    }

                    const downloadUrl = `/api/serveDownload/${sessionId}/${videoFile}`;

                    if (ws && ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'complete',
                            url: videoUrl,
                            downloadUrl: downloadUrl,
                            title: path.parse(videoFile).name
                        }));
                    }
                });
            }, 1000); // 1-second delay
        } else {
            if (ws && ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'error', url: videoUrl, message: 'Download failed.' }));
            }
        }
    });


    res.status(200).send({ message: 'Download started for all videos.' });
}


// New route to serve the downloaded video and clean up the directory after.
exports.serverDownload = async (req, res) => {
    console.log("\n serveing video")
    const { sessionId, fileName } = req.params;
    const filePath = path.join(__dirname, "..", 'downloads', sessionId, fileName);


    res.download(filePath, async (err) => {
        if (err) {
            console.error('File download error:', err);
            if (!res.headersSent) {
                res.status(404).send('File not found or an error occurred.');
            }
        }
    });

    // Listen for the response to finish and then clean up the directory
    res.on('finish', async () => {
        console.log(`Download finished for session ${sessionId}. Deleting directory.`);

        fs.rm(filePath, (err) => {
            if (err) {
                console.error(`Failed to delete file ${filePath}:`, err);
            } else {
                console.log(`Successfully deleted file ${filePath}`);
            }
        });

        // const dirPath = path.join(__dirname, "..", 'downloads', sessionId);
        // if (await isDirectoryEmpty(dirPath)) {
        //     fs.rm(dirPath, { recursive: true, force: true }, (err) => {
        //         if (err) {
        //             console.error(`Failed to delete directory ${dirPath}:`, err);
        //         } else {
        //             console.log(`Successfully deleted directory ${dirPath}`);
        //         }
        //     })
        // }

    });

    // Fallback cleanup in case of a premature client disconnect
    res.on('close', () => {
        console.log(`Connection closed for session ${sessionId}. Deleting directory.`);
        const dirPath = path.join(__dirname, "..", 'downloads', sessionId);
        fs.rm(dirPath, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error(`Failed to delete directory ${dirPath} on close:`, err);
            }
        });
    });
};
