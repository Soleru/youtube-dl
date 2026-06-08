import 'dotenv/config';
import { downloadVideo } from './video.mjs';
import { downloadPlaylist } from './playlist.mjs';
import { getDefaultLogger } from 'logger';

const logger = getDefaultLogger(true);

logger.info("Lancement du script");

if (process.argv[2] == 1) {
    logger.info("Mode vidéo");
    downloadVideo(process.argv[3]).catch(logger.error);
} else if (process.argv[2] == 2) {
    logger.info("Mode Playlist");
    downloadPlaylist(process.argv[3]).catch(logger.error);
}
