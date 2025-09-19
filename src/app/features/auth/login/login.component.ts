import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <h1>Login</h1>
          <p>Sign in to your account</p>
        </div>
        
        <form class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              id="email" 
              type="email" 
              placeholder="Enter your email"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="Enter your password"
              class="form-input"
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">
              Sign In
            </button>
            <button type="button" class="btn-secondary">
              Sign in with Google
            </button>
          </div>
        </form>
        
        <div class="auth-footer">
          <p>Don't have an account?</p>
          <a href="/register">Create an account</a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss'
})
export class LoginComponent {}