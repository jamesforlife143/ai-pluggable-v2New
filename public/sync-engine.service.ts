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

  private stopVersion = 0;

  stopNow() {

    this.stopVersion++;

    this.isStopped.set(true);

    this.isPaused.set(false);

    this.audio.pause();

    this.audio.onplay = null;
    this.audio.onended = null;
    this.audio.onerror = null;

    this.audio.currentTime = 0;

    this.audio.removeAttribute(
      'src'
    );
  }

  setPaused(
    paused: boolean
  ) {

    this.isPaused.set(paused);

    if (paused) {

      this.audio.pause();

      return;
    }

    if (
      this.audio.src &&
      !this.isStopped()
    ) {

      void this.audio.play();
    }
  }

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
      (t: string) => void,

    maxPlaybackMs:
      number = 10 * 60 * 1000

  ) {

    if (!sentences.length) {
      switchVideo('', true);
      return;
    }

    let completedPlaybackMs = 0;

    const playStopVersion =
      this.stopVersion;

    // pre-generate first audio
    let nextAudioBuffer =
      await tts.speak(
        sentences[0]
      );

    if (
      this.isStopped() ||
      playStopVersion !== this.stopVersion
    ) {
      switchVideo('', true);
      return;
    }

    try {

      for (
        let i = 0;
        i < sentences.length;
        i++
      ) {

      // stop playback
      if (
        this.isStopped() ||
        playStopVersion !== this.stopVersion ||
        completedPlaybackMs >=
          maxPlaybackMs
      ) {

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

        if (
          this.isStopped() ||
          playStopVersion !== this.stopVersion
        ) {
          break;
        }

        await this.sleep(50);
      }

      if (
        this.isStopped() ||
        playStopVersion !== this.stopVersion
      ) {
        switchVideo('', true);
        break;
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

      // Generate NEXT audio while CURRENT plays.
      // TtsService uses independent synthesizers per call,
      // so this no longer blocks the current playback path.
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

          if (this.isPaused()) {
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

      if (
        this.isStopped() ||
        playStopVersion !== this.stopVersion
      ) {
        switchVideo('', true);
        break;
      }

      await this.audio.play();

      // wait completion
      const completed =
        await this.waitForAudioEnd(
          audioUrl,
          completedPlaybackMs,
          maxPlaybackMs,
          playStopVersion
        );

      completedPlaybackMs +=
        this.audio.currentTime * 1000;

      if (
        !completed ||
        this.isStopped() ||
        playStopVersion !== this.stopVersion
      ) {

        this.audio.pause();

        this.audio.currentTime = 0;

        this.audio.src = '';

        switchVideo('', true);

        break;
      }

      // next audio should already be ready or nearly ready
      if (nextAudioPromise) {

        nextAudioBuffer =
          await nextAudioPromise;

        if (
          this.isStopped() ||
          playStopVersion !== this.stopVersion
        ) {
          switchVideo('', true);
          break;
        }
      }
    }

    } catch (err) {

      console.error(
        'Playback failed:',
        err
      );

    } finally {

      this.audio.pause();

      this.audio.onplay = null;
      this.audio.onended = null;
      this.audio.onerror = null;

      this.audio.currentTime = 0;

      this.audio.src = '';

    // stop videos
    switchVideo('', true);
    }
  }

  private waitForAudioEnd(
    audioUrl: string,
    completedPlaybackMs: number,
    maxPlaybackMs: number,
    playStopVersion: number
  ) {

    return new Promise<boolean>(
      (resolve) => {

      let settled = false;

      const settle =
        (completed: boolean) => {

        if (settled) {
          return;
        }

        settled = true;

        window.clearInterval(
          timer
        );

          URL.revokeObjectURL(
            audioUrl
          );

        resolve(completed);
      };

      const timer =
        window.setInterval(() => {

        if (
          this.isStopped() ||
          playStopVersion !== this.stopVersion ||
          completedPlaybackMs +
            this.audio.currentTime * 1000 >=
          maxPlaybackMs
        ) {

          settle(false);
        }

      }, 250);

      this.audio.onended = () => {

        settle(true);
      };

      this.audio.onerror = () => {

        settle(false);
      };
    });
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
