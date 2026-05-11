import { Injectable } from '@angular/core';

import * as SpeechSDK
from 'microsoft-cognitiveservices-speech-sdk';

@Injectable({
  providedIn: 'root'
})
export class TtsService {

  private speechConfig:
    SpeechSDK.SpeechConfig;

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

  }

  speak(
    text: string
  ): Promise<ArrayBuffer> {

    return new Promise(
      (resolve, reject) => {

      // Use a fresh synthesizer per request so the next
      // chunk can be prepared while current audio plays.
      const synthesizer =
        new SpeechSDK
          .SpeechSynthesizer(

            this.speechConfig,

            null
          );

      synthesizer
        .speakTextAsync(

        text,

        (result) => {

          if (

            result.reason ===

            SpeechSDK.ResultReason
              .SynthesizingAudioCompleted

          ) {

            synthesizer.close();

            resolve(
              result.audioData
            );

          } else {

            synthesizer.close();

            reject(
              result.errorDetails
            );
          }
        },

        (err) => {

          synthesizer.close();

          reject(err);
        }
      );
    });
  }
}
