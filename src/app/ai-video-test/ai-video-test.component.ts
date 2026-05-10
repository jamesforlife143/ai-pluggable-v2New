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
  sample1 = `Hello! Let me explain how this intelligent system works in a simple and engaging way. 
First, we take your input text and carefully analyze its meaning so we can understand the intent behind each sentence. 
This allows us to present information clearly and effectively.!`;
  sample2 = `Please pay attention. This is critical. Awesome, you understood it.`;
  sample3 = `Let me walk you through the process step by step. Good work so far!`;

  play(text: string) {
    this.isStopped.set(false);
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
  }

  transcriptText = '';

onText(
  word: string
) {

  this.transcriptText += word;
}
}