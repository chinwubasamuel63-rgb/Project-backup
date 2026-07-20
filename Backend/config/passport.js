import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

const getRole = (email) => {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  return adminEmail && email.toLowerCase() === adminEmail ? "admin" : "student";
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          googleId: profile.id,
        });
        if (user) {
          return done(null, user);
        }

        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(
            new Error("Google account did not provide an email address"),
            null,
          );
        }

        user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }

          return done(null, user);
        }

        const baseUsername = email.split("@")[0];

        let username = baseUsername;
        let counter = 1;

        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter++}`;
        }

        user = await User.create({
          username,
          email,
          password: "",
          role: getRole(email),
          authProvider: "google",
          googleId: profile.id,
          isVerified: true,
          avatar: {
            publicId: "",
            url: profile.photos?.[0]?.value || "",
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          githubId: profile.id,
        });

        if (user) {
          return done(null, user);
        }

        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(
            new Error("GitHub account does not provide an email address"),
            null,
          );
        }

        user = await User.findOne({ email });

        if (user) {
          if (!user.githubId) {
            user.githubId = profile.id;
            await user.save();
          }

          return done(null, user);
        }

        const baseUsername = profile.username || email.split("@")[0];

        let username = baseUsername;
        let counter = 1;

        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter++}`;
        }

        user = await User.create({
          username,
          email,
          password: "",
          role: getRole(email),
          authProvider: "github",
          githubId: profile.id,
          isVerified: true,
          avatar: {
            publicId: "",
            url: profile.photos?.[0]?.value || "",
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

export default passport;
