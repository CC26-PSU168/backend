import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { AuthService } from '../services/auth.service';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Use absolute URL — relative paths resolve to http:// on Render (proxy mismatch)
      // RENDER_EXTERNAL_URL is automatically injected by Render at runtime
      callbackURL: process.env.RENDER_EXTERNAL_URL
        ? `${process.env.RENDER_EXTERNAL_URL}/api/v1/auth/google/callback`
        : process.env.BACKEND_URL
          ? `${process.env.BACKEND_URL}/api/v1/auth/google/callback`
          : `http://localhost:${env.PORT}/api/v1/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Find or create the user in the database
        const result = await AuthService.handleOAuthLogin(profile);
        // Pass the result (which contains user and tokens) to passport's done callback
        done(null, result as any);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

export default passport;