import 'dotenv/config';
import { downloadVideo } from './video.mjs';
import { downloadPlaylist } from './playlist.mjs';

if (process.argv[2] == 1) {
    downloadVideo(process.argv[3]).catch(console.error);
} else if (process.argv[2] == 2) {
    downloadPlaylist(process.argv[3]).catch(console.error);
}
