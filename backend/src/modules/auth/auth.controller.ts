import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { env } from '../../config/env';
import { oauthService } from './oauth.service';
import { BadRequestError } from '../../utils/errors';
import { sessionCookies, sessionService } from './session.service';

export class AuthController {
  private setOauthStateCookie(res: Response, provider: 'google' | 'facebook', state: string) {
    res.cookie(`oauth_state_${provider}`, state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: `/api/auth/${provider}/callback`,
    });
  }

  private clearOauthStateCookie(res: Response, provider: 'google' | 'facebook') {
    res.clearCookie(`oauth_state_${provider}`, {
      path: `/api/auth/${provider}/callback`,
    });
  }

  private redirectOauthError(res: Response, message: string) {
    const redirectUrl = `${env.FRONTEND_URL}/login?oauthError=${encodeURIComponent(message)}`;
    res.redirect(redirectUrl);
  }

  private getOauthProviderError(req: Request, provider: 'Google' | 'Facebook') {
    const providerError = req.query.error as string | undefined;
    const errorDescription = req.query.error_description as string | undefined;
    const errorReason = req.query.error_reason as string | undefined;

    if (!providerError) return null;

    return errorDescription || errorReason || `${provider} sign-in was cancelled`;
  }

  private redirectOauthSuccess(res: Response) {
    const redirectUrl = `${env.FRONTEND_URL}/auth/callback`;
    res.redirect(redirectUrl);
  }

  async providers(_req: Request, res: Response) {
    res.json({
      success: true,
      data: oauthService.getConfiguredProviders(),
    });
  }

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signup(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      await sessionService.revoke(req.cookies?.[sessionCookies.ADMIN_COOKIE] || req.cookies?.[sessionCookies.USER_COOKIE]);
      sessionService.clearCookies(res);
      const result = await authService.login(req.body);
      const isAdmin = result.user.role === 'ADMIN';
      const session = await sessionService.create(result.user.id, isAdmin, req);
      sessionService.setCookies(res, session.token, session.csrfSecret, isAdmin);

      res.json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response) {
    await sessionService.revoke(req.cookies?.[sessionCookies.ADMIN_COOKIE] || req.cookies?.[sessionCookies.USER_COOKIE]);
    sessionService.clearCookies(res);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const state = oauthService.generateState();
      this.setOauthStateCookie(res, 'google', state);
      const authUrl = oauthService.getGoogleAuthUrl(state);
      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const cookieState = req.cookies?.oauth_state_google as string | undefined;
      const providerError = this.getOauthProviderError(req, 'Google');

      if (providerError) throw new BadRequestError(providerError);
      if (!code) throw new BadRequestError('Missing Google authorization code');
      if (!state || !cookieState || state !== cookieState) {
        throw new BadRequestError('Invalid OAuth state');
      }

      this.clearOauthStateCookie(res, 'google');
      const result = await oauthService.handleGoogleCallback(code);
      const session = await sessionService.create(result.user.id, result.user.role === 'ADMIN', req);
      sessionService.setCookies(res, session.token, session.csrfSecret, result.user.role === 'ADMIN');
      this.redirectOauthSuccess(res);
    } catch (error: any) {
      this.clearOauthStateCookie(res, 'google');
      if (error instanceof BadRequestError) {
        this.redirectOauthError(res, error.message);
        return;
      }
      next(error);
    }
  }

  async facebookAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const state = oauthService.generateState();
      this.setOauthStateCookie(res, 'facebook', state);
      const authUrl = oauthService.getFacebookAuthUrl(state);
      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async facebookCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const cookieState = req.cookies?.oauth_state_facebook as string | undefined;
      const providerError = this.getOauthProviderError(req, 'Facebook');

      if (providerError) throw new BadRequestError(providerError);
      if (!code) throw new BadRequestError('Missing Facebook authorization code');
      if (!state || !cookieState || state !== cookieState) {
        throw new BadRequestError('Invalid OAuth state');
      }

      this.clearOauthStateCookie(res, 'facebook');
      const result = await oauthService.handleFacebookCallback(code);
      const session = await sessionService.create(result.user.id, result.user.role === 'ADMIN', req);
      sessionService.setCookies(res, session.token, session.csrfSecret, result.user.role === 'ADMIN');
      this.redirectOauthSuccess(res);
    } catch (error: any) {
      this.clearOauthStateCookie(res, 'facebook');
      if (error instanceof BadRequestError) {
        this.redirectOauthError(res, error.message);
        return;
      }
      next(error);
    }
  }
}

export const authController = new AuthController();
