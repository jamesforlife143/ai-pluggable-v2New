import { Injectable } from '@angular/core';

import type * as SpeechSDKTypes
from 'microsoft-cognitiveservices-speech-sdk';

declare global {
  interface Window {
    SpeechSDK: typeof SpeechSDKTypes;
  }
}

const getSpeechSdk = () =>
  window.SpeechSDK;

const speechSdkAssetPath =
  'assets/speech-sdk/microsoft.cognitiveservices.speech.sdk.bundle.js';

@Injectable({
  providedIn: 'root'
})
export class TtsService {

  private speechConfig:
    SpeechSDKTypes.SpeechConfig | null = null;

  private speechSdkLoad:
    Promise<typeof SpeechSDKTypes> | null = null;

  speak(
    text: string
  ): Promise<ArrayBuffer> {

    return this.ensureSpeechConfig()
      .then(({ SpeechSDK, speechConfig }) =>
        new Promise<ArrayBuffer>(
      (resolve, reject) => {

      const synthesizer =
        new SpeechSDK
          .SpeechSynthesizer(

            speechConfig,

            null
          );

      synthesizer
        .speakTextAsync(

        text,

        (
          result:
            SpeechSDKTypes.SpeechSynthesisResult
        ) => {

          synthesizer.close();

          if (
            result.reason ===
            SpeechSDK.ResultReason
              .SynthesizingAudioCompleted
          ) {

            resolve(
              result.audioData
            );

            return;
          }

          reject(
            result.errorDetails
          );
        },

        (err: string) => {

          synthesizer.close();

          reject(err);
        }
      );
    }));
  }

  private async ensureSpeechConfig() {

    const SpeechSDK =
      await this.waitForSpeechSdk();

    if (!this.speechConfig) {

      this.speechConfig =
        SpeechSDK.SpeechConfig
          .fromSubscription(

            '5uE2FAFX7Ezy2xERQhRVIo7P6TpLsna8f3hcSJX9T13qGvxtgGFaJQQJ99CDACYeBjFXJ3w3AAAYACOGn0La',

            'eastus'
          );

      this.speechConfig
        .speechSynthesisVoiceName =
          'en-IN-PrabhatNeural';

      this.speechConfig
        .speechSynthesisOutputFormat =
          SpeechSDK
            .SpeechSynthesisOutputFormat
            .Audio16Khz128KBitRateMonoMp3;
    }

    return {
      SpeechSDK,
      speechConfig: this.speechConfig
    };
  }

  private waitForSpeechSdk() {

    if (getSpeechSdk()?.SpeechConfig) {
      return Promise.resolve(
        getSpeechSdk()
      );
    }

    if (this.speechSdkLoad) {
      return this.speechSdkLoad;
    }

    this.speechSdkLoad =
      this.loadSpeechSdkScript();

    return this.speechSdkLoad;
  }

  private loadSpeechSdkScript() {

    return import(
      'microsoft-cognitiveservices-speech-sdk/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle'
    )
      .then(() => {

        const SpeechSDK =
          getSpeechSdk();

        if (SpeechSDK?.SpeechConfig) {
          return SpeechSDK;
        }

        return this.loadSpeechSdkAsset();
      })
      .catch(() =>
        this.loadSpeechSdkAsset()
      );
  }

  private loadSpeechSdkAsset() {

    return new Promise<typeof SpeechSDKTypes>(
      (resolve, reject) => {

      const existing =
        document.getElementById(
          'speech-sdk-script'
        ) as HTMLScriptElement | null;

      const script =
        existing ??
        document.createElement(
          'script'
        );

      script.id =
        'speech-sdk-script';

      script.onload = () => {

        const SpeechSDK =
          getSpeechSdk();

        if (SpeechSDK?.SpeechConfig) {

          resolve(SpeechSDK);

          return;
        }

        reject(
          'Speech SDK script loaded, but window.SpeechSDK is missing.'
        );
      };

      script.onerror = () => {

        reject(
          `Speech SDK failed to load from ${script.src}.`
        );
      };

      if (!existing) {

        script.src =
          new URL(
            speechSdkAssetPath,
            document.baseURI
          ).toString();

        document.head
          .appendChild(script);
      }
    });
  }
}
