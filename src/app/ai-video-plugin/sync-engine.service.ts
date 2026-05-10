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

  isPaused = signal(false);

  isStopped = signal(false);

  // reusable audio player
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

    // pre-generate first audio
    let nextAudioBuffer =
      await tts.speak(
        sentences[0]
      );

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

      const previousEmotion =

        i > 0

        ? emotions[i - 1]

        : null;

      // IMPORTANT
      // switch ONLY when emotion changes
      const shouldSwitch =

        emotion !== previousEmotion;

      const src =
        shouldSwitch

        ? EMOTION_VIDEO_MAP[
            emotion
          ]

        : undefined;

      // preload next video
      const nextEmotion =
        emotions[i + 1]
        ?? emotion;

      preload(
        EMOTION_VIDEO_MAP[
          nextEmotion
        ]
      );

      // generate NEXT audio
      // while CURRENT plays
      const nextAudioPromise =

        i < sentences.length - 1

        ? tts.speak(
            sentences[i + 1]
          )

        : null;

      // use pre-generated audio
      const audioBuffer =
        nextAudioBuffer;

      // cleanup previous audio
      this.audio.pause();

      this.audio.onplay = null;
      this.audio.onended = null;
      this.audio.onerror = null;

      this.audio.currentTime = 0;

      this.audio.src = '';

      // audio blob
      const blob = new Blob(
        [audioBuffer],
        { type: 'audio/mp3' }
      );

      const audioUrl =
        URL.createObjectURL(blob);

      this.audio.src =
        audioUrl;

      this.audio.load();

      this.audio.volume = 1;

      // transcript typing
      const words =
        sentences[i]
          .split(' ');

      this.audio.onplay = () => {

        let currentIndex = 0;

        // sync transcript
        const intervalMs =

          Math.max(

            80,

            (
              this.audio.duration
              * 1000
            )
            / Math.max(
                words.length,
                1
              )
          );

        const interval =
          setInterval(() => {

          if (

            currentIndex >=
            words.length ||

            this.isStopped()

          ) {

            clearInterval(
              interval
            );

            return;
          }

          emitText(
            words[currentIndex]
            + ' '
          );

          currentIndex++;

        }, intervalMs);
      };

      // IMPORTANT
      // switch ONLY if emotion changed
      if (src) {

        switchVideo(src);
      }

      await this.sleep(40);

      // play audio
      await this.audio.play();

      // wait completion
      await new Promise<void>(
        (res) => {

        this.audio.onended = () => {

          URL.revokeObjectURL(
            audioUrl
          );

          res();
        };
      });

      // next audio already ready
      if (nextAudioPromise) {

        nextAudioBuffer =
          await nextAudioPromise;
      }
    }

    // stop videos
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