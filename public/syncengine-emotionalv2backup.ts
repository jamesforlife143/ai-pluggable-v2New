import {
  Injectable,
  signal
} from '@angular/core';

import {
  EmotionType,
  EMOTION_VIDEO_MAP
} from './emotion.model';

import {
  TtsService
} from './tts.service';

@Injectable({
  providedIn: 'root'
})
export class SyncEngine {

  // pause / stop controls
  isPaused = signal(false);

  isStopped = signal(false);

  // SINGLE reusable audio player
  private audio = new Audio();

  async play(

    sentences: string[],

    emotions: EmotionType[],

    tts: TtsService,

    switchVideo:
      (
        src?: string,
        stop?: boolean
      ) => void,

    preload:
      (src: string) => void,

    emitText:
      (t: string) => void

  ) {

    for (
      let i = 0;
      i < sentences.length;
      i++
    ) {

      // stop playback
      if (this.isStopped()) {

        this.audio.pause();

        this.audio.onplay = null;
        this.audio.onended = null;
        this.audio.onerror = null;

        this.audio.currentTime = 0;

        this.audio.src = '';

        switchVideo('', true);

        break;
      }

      // pause support
      while (this.isPaused()) {

        await this.sleep(50);
      }

      const emotion =
        emotions[i]
        ?? 'EXPLAIN';

      const src =
        EMOTION_VIDEO_MAP[
          emotion
        ];

      // preload next video
      const nextEmotion =
        emotions[i + 1]
        ?? emotion;

      preload(
        EMOTION_VIDEO_MAP[
          nextEmotion
        ]
      );

      // generate speech
      const audioBuffer =
        await tts.speak(
          sentences[i]
        );

      // FULL AUDIO CLEANUP
      this.audio.pause();

      this.audio.onplay = null;
      this.audio.onended = null;
      this.audio.onerror = null;

      this.audio.currentTime = 0;

      this.audio.src = '';

      // create audio blob
      const blob = new Blob(
        [audioBuffer],
        { type: 'audio/mp3' }
      );

      const audioUrl =
        URL.createObjectURL(blob);

      // reuse SAME audio element
      this.audio.src = audioUrl;

      this.audio.load();

      this.audio.volume = 1;

      // transcript typing effect
      const words =
        sentences[i].split(' ');

      this.audio.onplay = () => {

        let currentIndex = 0;

        const interval =
          setInterval(() => {

          if (
            currentIndex >=
            words.length
          ) {

            clearInterval(
              interval
            );

            return;
          }

          // emit ONLY new word
          emitText(
            words[currentIndex]
            + ' '
          );

          currentIndex++;

        }, 140);
      };

      // switch video first
      switchVideo(src);

      // tiny sync delay
      await this.sleep(60);

      // play speech
      await this.audio.play();

      // wait till speech ends
      await new Promise<void>(
        (res) => {

        this.audio.onended = () => {

          URL.revokeObjectURL(
            audioUrl
          );

          res();
        };
      });
    }

    // stop final video
    switchVideo('', true);
  }

  private sleep(
    ms: number
  ) {

    return new Promise(
      res => setTimeout(
        res,
        ms
      )
    );
  }
}