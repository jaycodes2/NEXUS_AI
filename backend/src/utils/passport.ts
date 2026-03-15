import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel.js";
import { authLogger } from "./logger.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL!;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          authLogger.warn({ event: "google_oauth_no_email", googleId: profile.id }, "Google OAuth — no email returned");
          return done(new Error("No email returned from Google"), undefined);
        }

        // Check if user already exists by googleId or email
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (user) {
          // Existing user — update Google fields if missing
          if (!user.googleId) {
            user.googleId = profile.id;
            user.authProvider = "google";
            user.displayName = user.displayName || profile.displayName;
            user.avatar = user.avatar || profile.photos?.[0]?.value || null;
            await user.save();
            authLogger.info({ event: "google_oauth_linked", userId: user._id.toString(), email }, "Existing account linked to Google");
          } else {
            authLogger.info({ event: "google_oauth_login", userId: user._id.toString(), email }, "User logged in via Google");
          }
        } else {
          // New user — create account
          user = await User.create({
            email,
            googleId: profile.id,
            displayName: profile.displayName,
            avatar: profile.photos?.[0]?.value || null,
            authProvider: "google",
            passwordHash: null,
          });
          authLogger.info({ event: "google_oauth_register", userId: user._id.toString(), email }, "New user registered via Google");
        }

        return done(null, user);
      } catch (err) {
        authLogger.error({ err, event: "google_oauth_error" }, "Google OAuth strategy error");
        return done(err as Error, undefined);
      }
    }
  )
);

export default passport;
