// budget: 400 lines
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

// Reusable modal shell. On mobile it renders as a bottom sheet (slides up);
// on desktop it is a centered dialog.
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  @Input() title = '';
  @Output() close = new EventEmitter<void>();

  onBackdrop(): void {
    this.close.emit();
  }
}
