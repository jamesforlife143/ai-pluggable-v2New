import { Injectable } from '@angular/core';

import * as SpeechSDK
from 'microsoft-cognitiveservices-speech-sdk';

@Injectable({
  providedIn: 'root'
})
export class TtsService {

  private speechConfig:
    SpeechSDK.SpeechConfig;

  // SINGLE reusable synthesizer
  private synthesizer:
    SpeechSDK.SpeechSynthesizer;

  constructor() {

    // Azure config
    this.speechConfig =
      SpeechSDK.SpeechConfig
        .fromSubscription(

          '5uE2FAFX7Ezy2xERQhRVIo7P6TpLsna8f3hcSJX9T13qGvxtgGFaJQQJ99CDACYeBjFXJ3w3AAAYACOGn0La',

          'eastus'
        );

    // voice
    this.speechConfig
      .speechSynthesisVoiceName =
        'en-IN-PrabhatNeural';

    // mp3 output
    this.speechConfig
      .speechSynthesisOutputFormat =
        SpeechSDK
          .SpeechSynthesisOutputFormat
          .Audio16Khz128KBitRateMonoMp3;

    // IMPORTANT
    // disables direct speaker playback
    const audioConfig = null;

    // SINGLE synthesizer instance
    this.synthesizer =
      new SpeechSDK
        .SpeechSynthesizer(

          this.speechConfig,

          audioConfig
        );
  }

  speak(
    text: string
  ): Promise<ArrayBuffer> {

    return new Promise(
      (resolve, reject) => {

      this.synthesizer
        .speakTextAsync(

        text,

        (result) => {

          if (

            result.reason ===

            SpeechSDK.ResultReason
              .SynthesizingAudioCompleted

          ) {

            resolve(
              result.audioData
            );

          } else {

            reject(
              result.errorDetails
            );
          }
        },

        (err) => {

          reject(err);
        }
      );
    });
  }
}