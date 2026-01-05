import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.model.js';
import { generateToken } from './jwt.utils.js';

// Google OAuth Strategy - Only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const { id, emails, displayName, photos } = profile;
      const email = emails?.[0]?.value;

      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      // Check if user exists with this email
      let user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        // User exists - link Google account if not already linked
        if (!user.oauthProviders?.google?.id) {
          user.oauthProviders = user.oauthProviders || {};
          user.oauthProviders.google = {
            id: id,
            email: email
          };
          user.authMethod = user.password ? 'email+google' : 'google';
          await user.save();
        }
      } else {
        // New user - create account
        user = await User.create({
          name: displayName || email.split('@')[0],
          email: email.toLowerCase(),
          password: undefined, // No password for OAuth users
          oauthProviders: {
            google: {
              id: id,
              email: email
            }
          },
          authMethod: 'google',
          emailVerified: true,
          profilePicture: photos?.[0]?.value || ''
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.log('⚠️  Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required');
}

// GitHub OAuth Strategy - Only initialize if credentials are provided
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const { id, username, displayName, emails, photos } = profile;
      const email = emails?.[0]?.value || `${username}@users.noreply.github.com`;

      // Check if user exists with this email
      let user = await User.findOne({ 
        $or: [
          { email: email.toLowerCase() },
          { 'oauthProviders.github.id': id.toString() }
        ]
      });

      if (user) {
        // User exists - link GitHub account if not already linked
        if (!user.oauthProviders?.github?.id) {
          user.oauthProviders = user.oauthProviders || {};
          user.oauthProviders.github = {
            id: id.toString(),
            email: email,
            username: username
          };
          user.authMethod = user.password ? 'email+github' : 'github';
          await user.save();
        }
      } else {
        // New user - create account
        user = await User.create({
          name: displayName || username || email.split('@')[0],
          email: email.toLowerCase(),
          password: undefined, // No password for OAuth users
          oauthProviders: {
            github: {
              id: id.toString(),
              email: email,
              username: username || ''
            }
          },
          authMethod: 'github',
          emailVerified: emails?.[0]?.value ? true : false,
          profilePicture: photos?.[0]?.value || ''
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.log('⚠️  GitHub OAuth not configured - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET required');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

