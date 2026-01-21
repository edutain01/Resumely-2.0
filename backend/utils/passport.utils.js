import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.model.js';
import { generateToken } from './jwt.utils.js';

// Helper to update auth method when linking providers
const getUpdatedAuthMethod = (user, newProvider) => {
  const hasPassword = !!user.password;
  const hasGoogle = !!user.oauthProviders?.google?.id;
  const hasGitHub = !!user.oauthProviders?.github?.id;
  
  const methods = [];
  if (hasPassword) methods.push('email');
  if (hasGoogle || newProvider === 'google') methods.push('google');
  if (hasGitHub || newProvider === 'github') methods.push('github');
  
  return methods.join('+') || 'email';
};

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

      // Check if user exists with this email OR Google ID (link accounts by email)
      let user = await User.findOne({ 
        $or: [
          { email: email.toLowerCase() },
          { 'oauthProviders.google.id': id }
        ]
      });

      if (user) {
        // User exists - link Google account if not already linked
        if (!user.oauthProviders?.google?.id) {
          user.oauthProviders = user.oauthProviders || {};
          user.oauthProviders.google = {
            id: id,
            email: email
          };
          user.authMethod = getUpdatedAuthMethod(user, 'google');
          // Update profile picture if not set
          if (!user.profilePicture && photos?.[0]?.value) {
            user.profilePicture = photos[0].value;
          }
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
    callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
    scope: ['user:email'] // Request email scope
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const { id, username, displayName, emails, photos } = profile;
      
      // Try to get the primary verified email, fallback to any email, then noreply
      let email = null;
      if (emails && emails.length > 0) {
        // First try to find primary email
        const primaryEmail = emails.find(e => e.primary && e.verified);
        // Then try any verified email
        const verifiedEmail = emails.find(e => e.verified);
        // Then any email
        email = primaryEmail?.value || verifiedEmail?.value || emails[0]?.value;
      }
      
      // Fallback to noreply if no email found
      if (!email) {
        email = `${username}@users.noreply.github.com`;
      }

      // Check if user exists with this email or GitHub ID
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
          user.authMethod = getUpdatedAuthMethod(user, 'github');
          // Update profile picture if not set
          if (!user.profilePicture && photos?.[0]?.value) {
            user.profilePicture = photos[0].value;
          }
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
          emailVerified: !email.includes('noreply.github.com'),
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

