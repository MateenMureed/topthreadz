import axios from 'axios';
import crypto from 'crypto';
import prisma from '../../utils/prisma';
import { env } from '../../config/env';
import { BadRequestError } from '../../utils/errors';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';

interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export class OAuthService {
  generateState() {
    return crypto.randomBytes(24).toString('hex');
  }

  getConfiguredProviders() {
    return {
      google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      facebook: Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET),
    };
  }

  getGoogleAuthUrl(state: string) {
    if (!this.getConfiguredProviders().google) {
      throw new BadRequestError('Google OAuth is not configured yet');
    }

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  getFacebookAuthUrl(state: string) {
    if (!this.getConfiguredProviders().facebook) {
      throw new BadRequestError('Facebook OAuth is not configured yet');
    }

    const params = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      redirect_uri: env.FACEBOOK_REDIRECT_URI,
      response_type: 'code',
      scope: 'email,public_profile',
      state,
    });

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string) {
    if (!this.getConfiguredProviders().google) {
      throw new BadRequestError('Google OAuth is not configured yet');
    }

    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data?.access_token as string | undefined;
    if (!accessToken) throw new BadRequestError('Unable to get Google access token');

    const profileRes = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = profileRes.data as OAuthProfile;
    return this.upsertOAuthUser('GOOGLE', profile);
  }

  async handleFacebookCallback(code: string) {
    if (!this.getConfiguredProviders().facebook) {
      throw new BadRequestError('Facebook OAuth is not configured yet');
    }

    const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: env.FACEBOOK_APP_ID,
        client_secret: env.FACEBOOK_APP_SECRET,
        redirect_uri: env.FACEBOOK_REDIRECT_URI,
        code,
      },
    });

    const accessToken = tokenRes.data?.access_token as string | undefined;
    if (!accessToken) throw new BadRequestError('Unable to get Facebook access token');

    const appSecretProof = crypto
      .createHmac('sha256', env.FACEBOOK_APP_SECRET)
      .update(accessToken)
      .digest('hex');

    const profileRes = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken,
        appsecret_proof: appSecretProof,
      },
    });

    const profile: OAuthProfile = {
      id: profileRes.data.id,
      email: profileRes.data.email,
      name: profileRes.data.name,
      picture: profileRes.data.picture?.data?.url,
    };

    return this.upsertOAuthUser('FACEBOOK', profile);
  }

  private async upsertOAuthUser(provider: 'GOOGLE' | 'FACEBOOK', profile: OAuthProfile) {
    if (!profile.email) {
      throw new BadRequestError(`${provider} account did not return an email`);
    }

    const providerField = provider === 'GOOGLE' ? 'googleId' : 'facebookId';

    const byProvider = await prisma.user.findFirst({
      where: {
        [providerField]: profile.id,
      },
    });

    if (byProvider) {
      return this.issueSession(byProvider.id);
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });

    if (existingByEmail) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          [providerField]: profile.id,
          profileImage: profile.picture || existingByEmail.profileImage,
          isVerified: true,
        },
      });

      return this.issueSession(existingByEmail.id);
    }

    const created = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        phone: null,
        password: null,
        isVerified: true,
        authProvider: provider,
        googleId: provider === 'GOOGLE' ? profile.id : null,
        facebookId: provider === 'FACEBOOK' ? profile.id : null,
        profileImage: profile.picture || null,
      },
    });

    return this.issueSession(created.id);
  }

  private async issueSession(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestError('User not found after OAuth login');

    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}

export const oauthService = new OAuthService();
