// This file contains the logic for each root

const ytdl = require("ytdl-core");

exports.getVideoDetails = (req, res) => {
    console.log('\ngettig details ')
    const videoUrl = req.query.videoUrl;
    try {
        ytdl
            .getBasicInfo(videoUrl)
            .then((info) => {
                console.log("getting video details");
                res.json(info.videoDetails);
            })
            .catch((err) => console.log(err));
    }
    catch (err) {
        console.log(err)
    }
}


exports.relatedVideosData = (req, res) => {
    const videoUrl = req.query.videoUrl;
    // ytdlp
    //   .getInfoAsync(videoUrl)
    //   .then((info) =>
    //     console.dir("getting related videos :", info.related_videos)
    //   )
    //   .catch((err) => console.log(err));
    try {
        ytdl
            .getBasicInfo(videoUrl)
            .then((info) => {
                console.log("getting related videos", info.related_videos);
                res.json(info.related_videos);
            })
            .catch((err) => console.log(err));
    }
    catch (err) {
        console.log(err)
    }
}

exports.getVideoFormats = async (req, res) => {
    console.log('getting video format')
    const videoUrl = req.query.videoUrl;
    try {
        ytdl.getBasicInfo(videoUrl).then(data => res.json(getRankedVideoList(data.formats)));
        // ytdlp.getInfoAsync(videoUrl).then(data => res.send(data.formats));
    }
    catch (err) {
        console.log(err)
    }
}

function getRankedVideoList(formatsArray) {
    // 1. Filter for formats that are video streams (excluding audio-only)
    const videoFormats = formatsArray.filter(format => format.width && format.height);

    // 2. Sort the video formats by resolution and then by bitrate for the best quality
    videoFormats.sort((a, b) => {
        if (b.height != a.height) {
            return b.height - a.height;
        }
        return b.bitrate - a.bitrate;
    });

    // 3. Filter out duplicates, keeping only the first (and therefore best) entry for each height.
    const uniqueBestFormats = [];
    const seenQualities = new Set();

    for (const format of videoFormats) {
        if (!seenQualities.has(format.height)) {
            uniqueBestFormats.push(format);
            seenQualities.add(format.height);
        }
    }

    // 4. Map the unique, sorted data to the new, requested object format
    const rankedList = uniqueBestFormats.map(format => {
        let size;
        if (format.contentLength >= 1024 ** 3) {
            size = `${(parseInt(format.contentLength) / (1024 ** 3)).toFixed(2)} GB`
        }
        else if (format.contentLength >= 1024 ** 2) {
            size = `${(parseInt(format.contentLength) / (1024 ** 2)).toFixed(2)} MB`
        }
        else {
            size = `${(parseInt(format.contentLength) / (1024)).toFixed(2)} KB`
        }

        return {
            containerType: format.mimeType.includes('webm') ? 'webm' : 'mp4',
            size: size,
            quality: format.height,
        };
    });

    return rankedList;
}


