const path = require('path');
const fs = require('fs');
const express = require('express');
const ytdl = require("ytdl-core");
const mime = require('mime-types');
const WebSocket = require("ws");
const { YtDlp } = require("ytdlp-nodejs");

const ytDlpWrap = require("yt-dlp-wrap").default;
const ytdlp = new ytDlpWrap();
// const ytdlp = new YtDlp();

const DOWNLOAD_FOLDER = path.join(__dirname.split("Downloads")[0], "Downloads");
if (!fs.existsSync(DOWNLOAD_FOLDER)) {
    fs.mkdirSync(DOWNLOAD_FOLDER);
}

let client = null;
const wss = new WebSocket.Server({//creating WebSocket server object. ( instance of the WebSocket server)
    port: 8080,
    path: '/ws'  //URL path that the WebSocket server will respond to
});
wss.on("connection", (ws) => {  // triggers every time a new client successfully connects
    client = ws;
    console.log("Client connected");
    ws.on("message", (message) => {
        console.log("Received from client:", message);
    });
});

function sendProgress(progress) {
    if (client) {
        client.send(JSON.stringify({
            type: "progress",
            progress: {
                percentage_str: progress.percent
            }
        }));
    }
}

async function sendVideoUsingStream(eventFilePath, res) {
    client.send(JSON.stringify({ type: 'download-finished' })); // Send finish message

    let videoPath = getVideoPath(eventFilePath)

    if (fs.existsSync(videoPath)) {
        const filename = path.basename(videoPath);

        // Set appropriate headers for video streaming
        const mimeType = mime.lookup(filename);
        const encodedFilename = encodeURIComponent(filename);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('Content-Type', mimeType); // example : 'video/mp4' or 'video/webm' or 'application/mp4

        // Create a readable stream from the video file
        const videoStream = fs.createReadStream(videoPath);

        console.log(`Sending video to client`, filename);
        // Pipe the stream directly to the response object
        // This efficiently sends data in chunks as it's read from the file
        videoStream.pipe(res);

        videoStream.on('error', (streamErr) => {
            console.error(`Error during video stream for ${filename}:`, streamErr);

        });
        videoStream.on('end', () => {
            console.log('Video sent successfully');
            setTimeout(() => {
                fs.unlink(videoPath, (unlinkErr) => {
                    console.log("file deleted successfully")
                    if (unlinkErr) console.error("Error deleting file:", unlinkErr);
                })
            }, 400)

        });
        res.on('finish', () => {
            console.log(`Finished streaming`);
            client.send(JSON.stringify({ type: "streaming-finished" })); // Send finish message
        });
        res.on('close', () => {
            console.log('Client disconnected. Aborting video stream.');
            videoStream.destroy();
        })

    } else {
        res.status(404).send("File not found.");
    }
}

function sendVideoUsingSocket(videoName) {
    // console.log(client)
    let videoPath = getVideoPath(videoName)
    if (fs.existsSync(videoPath)) {
        console.log(`Sending video: ${videoName}`);
        const filename = path.basename(videoPath);
        // Send the filename first
        client.send(JSON.stringify({ type: 'start', filename }));
        //  Read file and send chunks
        const videoStream = fs.createReadStream(videoPath);
        videoStream.on('data', chunk => {
            console.log('sending video chunk');
            client.send(chunk); // Send each chunk as a binary message
        });
        videoStream.on('end', () => {
            client.send(JSON.stringify({ type: 'finish' })); // Send finish message
            console.log('Video sent successfully', videoName);
            fs.unlink(videoPath, (unlinkErr) => {
                console.log("file deleted successfully", videoName)
                if (unlinkErr) console.error("Error deleting file:", unlinkErr);
            });
        });
        videoStream.on('error', err => {
            console.error('Error reading video file:', err);
            client.send('Error reading video.');
        });
    } else {
        client.send('Video not found.');
    }
}

function normalizeString(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''); // Remove everything that's not a letter or number   
}

async function downloadPlaylist(playlistUrl) {
    const { entries } = await ytdlp.getInfoAsync(playlistUrl);

    console.dir(entries)
    const videos = entries.filter(entry => entry.channel != null).map((entry) => {  // filter out private vidoes not available in public
        return { url: entry.url, fileName: formatFileName(entry.title) }
    })
    console.dir(videos)
    return videos;  // returning all videos of a playlist
}



async function downloadVideo(res, videoUrl, quality, extention) {
    let eventFilePath;
    console.log("\ndownloading video:");

    const args = [
        // "-f","bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
        "-f", `bestvideo[height<=${quality}][ext=${extention}]+bestaudio[ext=${extention == "mp4" ? "m4a" : "webm"}]/best/best`,
        "-o", path.join(DOWNLOAD_FOLDER, "%(title)s.%(ext)s"),

        // // --- SUBTITLES ---
        // '--sub-langs', 'en.*',
        // '--embed-subs',  
        "--embed-thumbnail",

        // // --- DOWNLOAD ---
        // // //  limits the speed to 1.5 Megabytes per second
        // // '--limit-rate', '1.5M',
        // '--retries', '3',

        // // // Download only the 1st, 3rd, 4th, 5th, and 10th videos from a playlist.
        // '--playlist-items', '1,3-5,10',

        // // //The file 'downloaded.txt' will be created and updated
        // '--download-archive', 'downloaded.txt',

        // '--embed-chapters', // Embed video chapters if available and add navigation markers inside it

        // //  Print the file path after download is complete. {} will replaced with the full path of downloaded video.
        // // 'cmd /c echo Final file path is: "{}"',
        '--merge-output-format', 'mp4',
        '--no-restrict-filenames',
        videoUrl,
    ];


    // 1. Create an AbortController
    let wasAbortedByUser = false;

    const controller = new AbortController();

    // // Set a timer to abort the download
    // setTimeout(() => {
    //     console.log('\nAborting download...');
    //     controller.abort();
    //     // 2. Set the flag to true when we abort
    //     wasAbortedByUser = true;
    // }, 10000);


    let hasDownloadStarted = false;
    const downloader = ytdlp.exec(args, { signal: controller.signal }); //  2. Pass the signal to the exec options to abort the downloading process

    downloader.on("progress", (progress) => {
        if (!hasDownloadStarted) {
            client.send(JSON.stringify({ type: 'downloading-start' }));
            hasDownloadStarted = true;
        }
        process.stdout.write(`\r🎧 ${progress.percent}%`); // overwriting previously printed content on the same line using "\r"
        sendProgress(progress);

    });

    // Listen for generic yt-dlp events
    downloader.on('ytDlpEvent', (eventType, eventData) => {
        console.log("eventData is :", eventType, eventData)
        // If it's not a 'Destination' message, check if it's a 'Merger' message
        match = eventData.match(/Adding thumbnail to "(.+)"/);
        if (!match)
            match = eventData.match(/Merging formats into "(.+)"/);

        // If we found a match with either regex, save the path
        if (match && match[1]) {
            eventFilePath = match[1];
            console.dir(match);
            console.log("\nEventFilePath is :", eventFilePath);
            // setTimeout(() => { sendVideoUsingStream(eventFilePath, res) }, 1000);
        }
    });

    downloader.on('close', (code) => {
        if (wasAbortedByUser) {
            console.log('✅ Download was successfully aborted!');
        } else if (code === 0) {
            console.log('✅Download completed successfully.');
        } else {
            console.log(`Download process finished unexpectedly with code: ${code}`);
        }
        client.send(JSON.stringify({ type: "downloading-finished" })); // Send finish message

        sendVideoUsingStream(eventFilePath, res);
    });
}

function getVideoPath(eventFilePath) {

    const eventBaseName = path.basename(eventFilePath);
    const normalizedEventBaseName = normalizeString(eventBaseName);
    const files = fs.readdirSync(DOWNLOAD_FOLDER);
    console.log("\n normalized event base name:", normalizedEventBaseName);
    try {
        // Filter the list to find the file that includes the partial name
        const foundFile = files.find(file => { console.log("\n actual normalized filename", normalizeString(file)); return normalizeString(file) == normalizedEventBaseName });

        if (foundFile) {
            const fullVideoPath = path.join(DOWNLOAD_FOLDER, foundFile);
            // console.log('Found file path:', fullVideoPath);
            return fullVideoPath;
        } else {

            // console.log('File not found with partial name:', normalizedEventBaseName);
            console.log("normalized Event Filename is :", normalizedEventBaseName, "\nall files are:", files, "\n\n");
            return null;
        }
    } catch (err) {
        console.error('Error reading directory:', err);
        return null;
    }
}

module.exports = {
    // sendVideoUsingSocket,
    sendVideoUsingStream,
    sendProgress,
    getVideoPath,
    downloadVideo,
    downloadPlaylist,
};

