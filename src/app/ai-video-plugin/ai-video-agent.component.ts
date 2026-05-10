import {
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
  effect,
  OnChanges,
  SimpleChanges,
  AfterViewInit
} from '@angular/core';

import {
  EmotionService
} from './emotion.service';

import {
  TtsService
} from './tts.service';

import {
  SyncEngine
} from './sync-engine.service';

@Component({

  selector: 'ai-video-agent',

  standalone: true,

  templateUrl:
    './ai-video-agent.component.html',

  styleUrls: [
    './ai-video-agent.component.scss'
  ]
})
export class AiVideoAgentComponent
implements
  OnChanges,
  AfterViewInit {

  text =
    input<string>('');

  pause =
    input<boolean>(false);

  stop =
    input<boolean>(false);

  width =
    input<string>('100%');

  height =
    input<string>('300px');

  transcript =
    output<string>();

  @ViewChild(
    'videoPlayer',
    { static: true }
  )
  videoPlayer!:
    ElementRef<HTMLVideoElement>;

  private isRunning =
    false;

  private lastText = '';

  // current emotion state
  private currentVideo = '';

  constructor(

    private emotion:
      EmotionService,

    private tts:
      TtsService,

    private sync:
      SyncEngine

  ) {

    effect(() => {

      this.sync.isPaused
        .set(
          this.pause()
        );

      this.sync.isStopped
        .set(
          this.stop()
        );
    });
  }

  ngAfterViewInit() {

    const video =
      this.videoPlayer
        .nativeElement;

    // IMPORTANT
    // browser autoplay safety
    video.muted = true;

    video.defaultMuted = true;

    video.volume = 0;

    video.playsInline = true;

    video.autoplay = true;
  }

  ngOnChanges(
    changes: SimpleChanges
  ) {

    if (
      changes['text'] &&
      this.text()
    ) {

      const current =
        this.text()
          .trim();

      if (
        current &&
        current !== this.lastText
      ) {

        this.lastText =
          current;

        this.start(current);
      }
    }
  }

  switchVideo(
    src?: string,
    stop: boolean = false
  ) {

    const video =
      this.videoPlayer
        .nativeElement;

    // STOP
   if (stop) {

  video.pause();

  video.loop = false;

  video.currentTime = 0;

  // IMPORTANT
  // fully unload video
  video.removeAttribute(
    'src'
  );

  video.load();

  this.currentVideo = '';

  return;
}

    if (!src) return;

    // IMPORTANT
    // same emotion continues
    if (
      this.currentVideo === src
    ) {
      return;
    }

    this.currentVideo = src;

    // smooth switch
    video.pause();

    video.src = src;

    video.load();

    video.loop = true;

    const playVideo = async () => {

      try {

        await video.play();

      } catch (err) {

        console.error(
          'Video play failed:',
          err
        );
      }
    };

    // IMPORTANT
    // wait till browser loads frame
    if (

      video.readyState >= 2

    ) {

      playVideo();

    } else {

      video.onloadeddata = () => {

        playVideo();
      };
    }
  }

  preload(src: string) {

    const v =
      document.createElement(
        'video'
      );

    v.src = src;

    v.preload = 'auto';
  }

  async start(
    text: string
  ) {

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {

      text = text
        .replace(/\s+/g, ' ')
        .trim();

      this.sync.isStopped
        .set(true);

      await new Promise(
        r => setTimeout(r, 50)
      );

      this.sync.isStopped
        .set(false);

      const sentences =
        text.match(
          /[^.!?]+(?:[.!?]+|$)/g
        )?.map(s => s.trim())
        || [text];

      const emotions =
        await this.emotion
          .analyze(text);

      await this.sync.play(

        sentences,

        emotions,

        this.tts,

        this.switchVideo
          .bind(this),

        this.preload
          .bind(this),

        (t: string) =>
          this.transcript
            .emit(t)
      );

    } finally {

      this.isRunning = false;
    }
  }
}