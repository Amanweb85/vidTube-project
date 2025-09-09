const API_KEY = process.env.API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
//  
// getting API calls data
//

exports.getSearchData = (req, res) => {
    const { searchQuery } = req.query;
    console.log('\n', searchQuery, searchQuery == null);
    const searchApi_Url = searchQuery == '' ? "j" : `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${searchQuery || "popular indian videos"} &regionCode=in&key=${API_KEY}`;

    fetch(`${searchApi_Url}`)
        .then((response) => response.json())
        .then((data) => { res.json(data) })
        .catch((err) => res.send(err));
}

exports.getPlayingVideoDetail = (req, res) => {
    const { videoId } = req.query;
    const playingVideoDetail_Url = `df`;
    // `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&thumbnails&id=${videoUrl}&maxResults=12&key=${API_KEY}`;

    fetch(`${playingVideoDetail_Url}`)
        .then((response) => response.json())
        .then((data) => { res.json(data) })
        .catch((err) => res.send(err));
}

exports.getSuggestedVideoData = (req, res) => {

    const { videoId } = req.query;
    const suggestedData_Url =
        // `f`;
        `https://youtube-data8.p.rapidapi.com/video/related-contents/?id=${videoId}&timestamp=${Date.now()}&rapidapi-key=${RAPIDAPI_KEY}`;

    fetch(`${suggestedData_Url}`)
        .then((response) => response.json())
        .then((data) => {
            console.log(data); res.json(data)
        })
        .catch((err) => res.send(err));
}


exports.getCommentData = (req, res) => {
    const { videoId, pageToken } = req.query;
    let commentData_Url =
        `gf`;
    // `https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet%2Creplies&videoId=${videoId}&maxResults=2&key=${API_KEY}`;

    if (pageToken)
        commentData_Url = commentData_Url + "&pageToken=" + pageToken;

    fetch(`${commentData_Url}`)
        .then((response) => response.json())
        .then((data) => { res.json(data) })
        .catch((err) => res.send(err));
}

