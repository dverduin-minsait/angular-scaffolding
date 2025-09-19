import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  standalone: true,
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <h1>Create Account</h1>
          <p>Join us and start your journey</p>
        </div>
        
        <form class="auth-form">
          <div class="form-group form-group-inline">
            <div>
              <label for="firstName">First Name</label>
              <input 
                id="firstName" 
                type="text" 
                placeholder="First name"
                class="form-input"
              />
            </div>
            <div>
              <label for="lastName">Last Name</label>
              <input 
                id="lastName" 
                type="text" 
                placeholder="Last name"
                class="form-input"
              />
            </div>
          </div>
          
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
              placeholder="Create a password"
              class="form-input"
            />
            <div class="password-strength">
              <div class="strength-bar">
                <div class="strength-fill weak"></div>
              </div>
              <span class="strength-text">Password strength: Weak</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input 
              id="confirmPassword" 
              type="password" 
              placeholder="Confirm your password"
              class="form-input"
            />
          </div>
          
          <div class="terms-group">
            <input type="checkbox" id="terms" />
            <label for="terms">
              I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
            </label>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">
              Create Account
            </button>
            <button type="button" class="btn-secondary">
              Sign up with Google
            </button>
          </div>
        </form>
        
        <div class="auth-footer">
          <p>Already have an account?</p>
          <a href="/login">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './register.component.scss'
})
export class RegisterComponent {}