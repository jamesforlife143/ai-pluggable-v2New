import { Component, signal } from '@angular/core';
import { AiVideoAgentComponent } from '../ai-video-plugin/ai-video-agent.component';
import { CommonModule } from '@angular/common'; // ✅ ADD THIS

@Component({
  selector: 'ai-video-test',
  standalone: true,
    imports: [CommonModule, AiVideoAgentComponent],
  templateUrl: './ai-video-test.component.html',    
  styleUrls: ['./ai-video-test.component.scss']
})
export class AiVideoTestComponent {

  // Controls
  response = signal<string>('');
  isPaused = signal<boolean>(false);
  isStopped = signal<boolean>(false);

  transcriptLog = signal<string[]>([]);

  // Sample texts
//   sample1 = `Hello! Let me explain how this intelligent system works in a simple and engaging way. 
// First, we take your input text and carefully analyze its meaning so we can understand the intent behind each sentence. 
// This allows us to present information clearly and effectively.!`;

sample1 = `Hello! Welcome to this full AI video agent test. Today, I will walk you through a longer conversation so we can check whether the avatar, voice, transcript, emotion switching, and playback timing continue to work smoothly.

First, let us begin with a simple explanation. This system receives a block of text, cleans the spacing, splits it into smaller playable chunks, analyzes the emotional tone, creates speech audio, and then plays the matching avatar video while the transcript appears word by word.

Now, please pay attention to this important part. Long text can sometimes create problems if it is sent as one giant sentence. That is why the text should include natural punctuation, short paragraphs, and clear sentence breaks.

Good work so far. If the avatar is still speaking clearly, the transcript is moving forward, and the video continues without freezing, then the longer playback path is working as expected.

Let me continue with a more detailed walkthrough. In a real conversation, the user may provide several minutes of content. The system should not try to synthesize everything as one large audio request. Instead, it should process smaller pieces in sequence.

This also helps emotion detection. A short sentence can be marked as explanation, approval, or attention. When the emotion changes, the video changes. When the emotion stays the same, the video continues naturally.

Please note this carefully. If you push new text while the current conversation is still running, the previous run should stop and the new run should begin. This prevents overlapping audio and confusing transcript output.

Excellent. That means we can test interruption behavior after this sample starts playing.

Now I will keep speaking in a steady explanatory tone. The goal is not only to test one short message, but also to verify that the system remains stable for a longer session. The audio should continue sentence by sentence. The browser should not lock up. The video should not disappear. The transcript should not append old text from the previous run.

Here is another important checkpoint. If the script becomes too long, the system should limit it to the maximum allowed running duration. For this test, we are keeping the maximum video conversation length to ten minutes.

That is a good safety boundary. It protects the browser, the speech service, and the user experience.

Let us finish this sample with a final confirmation. If you can hear this message, see the avatar moving, and read the transcript below the video, then the long conversation flow is working properly. Great job testing the AI video agent!`;

  sample2 = `Please pay attention. This is critical. Awesome, you understood it.`;
  sample3 = `Let me walk you through the process step by step. Good work so far!`;

  play(text: string) {
    this.isStopped.set(false);
    this.transcriptText = '';
    this.response.set(text);
  }

  pause() {
    this.isPaused.set(true);
  }

  resume() {
    this.isPaused.set(false);
  }

  stop() {
    this.isStopped.set(true);
    this.isPaused.set(false);
  }

//   onText(text: string) {
//     this.transcriptLog.update(arr => [...arr, text]);
//   }

  clearLogs() {
    this.transcriptLog.set([]);
    this.transcriptText = '';
  }

  transcriptText = '';

onText(
  word: string
) {

  this.transcriptText += word;
}
}
