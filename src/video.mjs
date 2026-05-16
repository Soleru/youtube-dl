import { ClientType, Innertube, Platform } from "youtubei.js";
import ffmpeg from "fluent-ffmpeg";
import sanitize from "sanitize-filename";
import { pipeline, Readable } from 'stream';

Platform.shim.eval = async (data, env) => {
    const properties = [];

    if(env.n) {
        properties.push(`n: exportedVars.nFunction("${env.n}")`)
    }

    if (env.sig) {
        properties.push(`sig: exportedVars.sigFunction("${env.sig}")`)
    }

    const code = `${data.output}\nreturn { ${properties.join(', ')} }`;

    return new Function(code)();
}

const getVideoID = url => {
    let urlObj
    
    try {
        urlObj = new URL(url);
    } catch {
        return url;
    }

    let id = urlObj.searchParams.get("v");

    if (!id) {
        throw Error(`No video id found: "${url}"`);
    }

    return id;
}

const getInfo = async videoID => {
    // todo : https://www.discogs.com
    return await fetch(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${videoID}&key=${process.env.API_KEY}`)
        .then(res => res.json())
        .then(json => json.items[0]?.snippet.title)
        .then(title => {
            if (!title) return null;
            return sanitize(title);
        })
        .catch(console.error);
};

const downloadVideo = async (url) => {
    let yt = await Innertube.create({
        client_type: ClientType.ANDROID
    });
    
    let videoID = getVideoID(url);
    let info = await yt.getBasicInfo(videoID);
    let title = sanitize(info.basic_info.title);
    // let title = await getInfo(videoID);

    if (!title) return;

    let re = /(.+?)\s*-\s*(.+)/;

    const format = await yt.getStreamingData(videoID, {
        type: 'video+audio',
        format: 'any',
        quality: 'best'
    });

    // console.log(format.url);

    return new Promise((resolve, reject) => {
        // let stream = ytdl(`https://www.youtube.com/watch?v=${videoID}`, {quality: "highestaudio"});
        fetch(format.url).then(res => Readable.fromWeb(res.body))
        /*yt.download(videoID, {
            type: 'audio',
            format: "mp4",
            quality: "best",
            client: 'WEB_EMBEDDED'
            })*/
        // yt.download(videoID, {
        //     type: 'video+audio',
        //     format: 'any',
        //     quality: 'best'
        // })
        .then(stream => {
            let command = ffmpeg(stream);
            command.audioCodec("libmp3lame");
            command.output(`${process.env.DOWNLOAD_PATH}/${title}.mp3`);
            if (re.test(title)) {
                command.outputOptions(
                    '-metadata',  `title=${re.exec(title)[2]}`,
                    '-metadata',  `artist=${re.exec(title)[1]}`
                );
            }
            command.on("end", () => {
                console.log(`Téléchargement de la vidéo : ${videoID} : ${title}`);
                resolve();
            });
            command.on("error", err => {
                console.error(`Erreur de la vidéo : ${videoID} : ${title}`);
                console.error(err.message);
                reject(err.message);
            });
            command.run();
        }).catch(reason => {
            console.error(`Erreur lors de la récupération : ${videoID} : ${title}`);
            console.error(reason);
            reject(reason);
        });
    });
};

export {
    downloadVideo
};