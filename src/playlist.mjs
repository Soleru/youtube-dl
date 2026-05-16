import { downloadVideo } from './video.mjs';

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
        .catch(console.error);

    let promises = [];
    json.items.forEach(item => {
        if (++index > skip) {
            console.log(index);
            promises.push(downloadVideo(item.contentDetails.videoId));
        }
    });

    Promise.all(promises)
        .then(() => {
            if (json.nextPageToken) {
                downloadPlaylist(url, json.nextPageToken);
            }
        })
        .catch(console.error);
}

export {
    downloadPlaylist
};