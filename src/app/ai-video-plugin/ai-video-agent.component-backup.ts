import {
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
  signal,
  effect,
  OnChanges,
  SimpleChanges
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
implements OnChanges {

  // INPUTS
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

  // transcript output
  transcript =
    output<string>();

  // double buffer videos
  @ViewChild(
    'videoA',
    { static: true }
  )
  videoA!:
    ElementRef<HTMLVideoElement>;

  @ViewChild(
    'videoB',
    { static: true }
  )
  videoB!:
    ElementRef<HTMLVideoElement>;

  // active video tracker
  private active =
    signal<'A' | 'B'>('A');

  // prevents duplicate playback
  private isRunning =
    false;

  // prevents same text reruns
  private lastText = '';

  // preload tracker
  private preloaded =
    new Set<string>();

  constructor(

    private emotion:
      EmotionService,

    private tts:
      TtsService,

    private sync:
      SyncEngine

  ) {

    // preload all videos
    [
      '/assets/videos/explaining.mp4',

      '/assets/videos/thumbs_up.mp4',

      '/assets/videos/hand_raise.mp4'

    ].forEach(src => {

      const v =
        document.createElement(
          'video'
        );

      v.src = src;

      v.preload = 'auto';
    });

    // pause/stop sync
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

  // only runs when INPUT changes
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

  // reset all videos
  resetVideos() {

    const videos = [

      this.videoA.nativeElement,

      this.videoB.nativeElement
    ];

    videos.forEach(v => {

      v.pause();

      v.removeAttribute(
        'src'
      );

      v.load();

      v.style.opacity =
        '0';
    });

    this.active.set('A');
  }

  // preload next video
  preload(src: string) {

    if (
      this.preloaded.has(src)
    ) {
      return;
    }

    const v =
      document.createElement(
        'video'
      );

    v.src = src;

    v.preload = 'auto';

    this.preloaded.add(src);
  }

  // smooth video switching
//   switchVideo(
//     src?: string,
//     stop: boolean = false
//   ) {

//     const current =
//       this.active() === 'A'
//       ? this.videoA.nativeElement
//       : this.videoB.nativeElement;

//     const next =
//       this.active() === 'A'
//       ? this.videoB.nativeElement
//       : this.videoA.nativeElement;

//     // stop mode
//     if (stop) {

//       current.pause();

//       current.style.opacity =
//         '0';

//       return;
//     }

//     if (!src) return;

//     next.pause();

//     // clear handlers
//     next.oncanplay = null;
//     next.onerror = null;

//     next.removeAttribute(
//       'src'
//     );

//     next.src = src;

//     // IMPORTANT
//     // force proper reload
//     next.load();

//     next.currentTime = 0;

//     // HARD mute
//     next.defaultMuted = true;

//     next.muted = true;

//     next.volume = 0;

//     next.setAttribute(
//       'muted',
//       'true'
//     );

//     next.oncanplay = () => {

//       next.play()

//       .then(() => {

//         next.style.opacity =
//           '1';

//         current.style.opacity =
//           '0';

//         this.active.set(

//           this.active() === 'A'
//             ? 'B'
//             : 'A'
//         );
//       })

//       .catch(err => {

//         console.error(
//           'Video play error:',
//           err
//         );
//       });
//     };

//     next.onerror = (e) => {

//       console.error(
//         'Video load failed:',
//         src,
//         e
//       );
//     };
//   }

switchVideo(
  src?: string,
  stop: boolean = false
) {

  const videoA =
    this.videoA.nativeElement;

  const videoB =
    this.videoB.nativeElement;

  const current =
    this.active() === 'A'
    ? videoA
    : videoB;

  const next =
    this.active() === 'A'
    ? videoB
    : videoA;

  // COMPLETE STOP
  if (stop) {

    [videoA, videoB]
      .forEach(v => {

      v.pause();

      // IMPORTANT
      // stop looping
      v.loop = false;

      // reset playback
      v.currentTime = 0;

      // remove source fully
      v.removeAttribute(
        'src'
      );

      // force browser unload
      v.load();

      // hide
      v.style.opacity = '0';

      // cleanup handlers
      v.oncanplay = null;
      v.onerror = null;
    });

    return;
  }

  if (!src) return;

  // IMPORTANT
  // keep same video alive
  // avoids freeze between sentences
  if (

    current.src.includes(src) &&

    !current.paused

  ) {

    current.loop = true;

    return;
  }

  next.pause();

  next.loop = false;

  next.oncanplay = null;
  next.onerror = null;

  next.removeAttribute(
    'src'
  );

  next.src = src;

  // force browser reload
  next.load();

  next.currentTime = 0;

  // HARD mute
  next.defaultMuted = true;

  next.muted = true;

  next.volume = 0;

  next.setAttribute(
    'muted',
    'true'
  );

  next.oncanplay = () => {

    // smooth looping
    next.loop = true;

    next.play()

    .then(() => {

      next.style.opacity =
        '1';

      current.style.opacity =
        '0';

      // IMPORTANT
      // stop previous video
      current.pause();

      current.loop = false;

      current.currentTime = 0;

      this.active.set(

        this.active() === 'A'
          ? 'B'
          : 'A'
      );
    })

    .catch(err => {

      console.error(
        'Video play error:',
        err
      );
    });
  };

  next.onerror = (e) => {

    console.error(
      'Video load failed:',
      src,
      e
    );
  };
}
  async start(
    text: string
  ) {

    // prevent duplicate starts
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {

      // cleanup text
      text = text
        .replace(/\s+/g, ' ')
        .trim();

      // stop previous playback
      this.sync.isStopped
        .set(true);

      await new Promise(
        r => setTimeout(r, 50)
      );

      this.sync.isStopped
        .set(false);

      // reset videos
      this.resetVideos();

      // improved sentence splitting
      const sentences =
        text.match(
          /[^.!?]+(?:[.!?]+|$)/g
        )?.map(s => s.trim())
        || [text];

      // detect emotions
      const emotions =
        await this.emotion
          .analyze(text);

      console.log(
        'Sentences:',
        sentences
      );

      console.log(
        'Emotions:',
        emotions
      );

      // synchronized playback
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

      // allow future playback
      this.isRunning = false;
    }
  }
}