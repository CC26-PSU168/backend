import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { AuthService } from '../services/auth.service';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `/api/v1/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Find or create the user in the database
        const result = await AuthService.handleOAuthLogin(profile);
        // Pass the result (which contains user and tokens) to passport's done callback
        done(null, result);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

export default passport;
