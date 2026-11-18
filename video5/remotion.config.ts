import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setAudioCodec('aac');
Config.setCrf(18);
Config.setOverwriteOutput(true);
// Ambiente sem download do Chrome: usa o Chromium instalado, se existir
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
