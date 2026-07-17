// budget: 400 lines
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  host: { 'data-testid': 'app-ready' }
})
export class AppComponent {}
