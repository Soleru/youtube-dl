import { downloadVideo } from './video.mjs';
import { getDefaultLogger } from 'logger';

const logger = getDefaultLogger(true);

const getPlaylistID = url => {
    let urlObj = new URL(url);
    let id = urlObj.searchParams.get("list");

    if (!id) {
        throw Error(`No playlist id found: "${url}"`);
    }

    return id;
};

/* TODO: Gérer proprement la notion de skip */
let index = 0;
let skip = 0;
const downloadPlaylist = async (url, pageToken = "") => {

    let playlistID = getPlaylistID(url);

    let json = await fetch(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistID}&pageToken=${pageToken}&key=${process.env.API_KEY}`)
        .then(res => res.json())
        .catch(reason => {
            logger.error(reason);
        });

    let promises = [];
    json.items.forEach(item => {
        if (++index > skip) {
            logger.debug(`${index}: ${item.contentDetails.videoId}`);
            promises.push(downloadVideo(item.contentDetails.videoId));
        }
    });

    Promise.allSettled(promises)
        .then(() => {
            if (json.nextPageToken) {
                downloadPlaylist(url, json.nextPageToken);
            }
        })
        .catch(reason => {
            logger.error(reason);
        });
}

export {
    downloadPlaylist
};