const express = require('express');
const router = express.Router();  // creating a new Router object
const videoController = require('../controllers/videoController');
const downloadController = require('../controllers/downloadController');
const apiDataController = require('../controllers/apiDataController');

// Define routes for the video API
router.get("/videoDetails", videoController.getVideoDetails);
router.get('/relatedVideosData', videoController.relatedVideosData);
router.get('/getVideoFormats', videoController.getVideoFormats);


// Defining routes for youtube data fetching 
router.get('/getSearchData', apiDataController.getSearchData);
router.get('/getSuggestedVideoData', apiDataController.getSuggestedVideoData);
router.get('/getPlayingVideoDetail', apiDataController.getPlayingVideoDetail);
router.get('/getCommentData', apiDataController.getCommentData);


// Define route for the downloading video 
router.post("/downloadVideo", downloadController.downloadVideo)
router.get("/downloadPlaylist", downloadController.downloadPlaylist)
router.get("/serveDownload/:sessionId/:fileName", downloadController.serverDownload)

module.exports = router;
