/**
 * meta.client.ts
 * Server-side only Meta Graph API HTTP client.
 * All credentials are read from environment variables — never returned to the browser.
 *
 * Graph API version: v20.0
 * Official docs: https://developers.facebook.com/docs/graph-api
 */

import logger from '../../utils/logger';

const GRAPH_BASE = 'https://graph.facebook.com/v20.0';

export interface MetaConfig {
  pageAccessToken: string;
  facebookPageId: string;
  instagramAccountId: string;
}

export interface FbPhotoResult {
  id: string;      // photo node id
  post_id?: string; // published post id
}

export interface IgPublishResult {
  id: string; // IG media ID
}

export interface MetaStatusResult {
  configured: boolean;
  facebookPageId: string | null;
  instagramAccountId: string | null;
  tokenValid: boolean | null;
  pageName?: string;
  error?: string;
}

/**
 * Read Meta credentials from environment variables.
 * Returns null if any required credential is missing.
 */
export function getMetaConfig(): MetaConfig | null {
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const facebookPageId = process.env.META_FACEBOOK_PAGE_ID;
  const instagramAccountId = process.env.META_INSTAGRAM_ACCOUNT_ID;

  if (!pageAccessToken || !facebookPageId || !instagramAccountId) {
    return null;
  }

  return { pageAccessToken, facebookPageId, instagramAccountId };
}

/**
 * Validate the configured Page Access Token by calling /me.
 * Returns the page name on success.
 */
export async function validateToken(config: MetaConfig): Promise<{ valid: boolean; pageName?: string; error?: string }> {
  try {
    const url = `${GRAPH_BASE}/${config.facebookPageId}?fields=name,id&access_token=${config.pageAccessToken}`;
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json() as any;

    if (data.error) {
      return { valid: false, error: data.error.message };
    }
    return { valid: true, pageName: data.name };
  } catch (err: any) {
    logger.error('[MetaClient] Token validation failed:', err.message);
    return { valid: false, error: err.message };
  }
}

/**
 * Get current Meta integration status.
 * Safe to call even when credentials are not configured — returns configured: false instead of throwing.
 */
export async function getMetaStatus(): Promise<MetaStatusResult> {
  const config = getMetaConfig();

  if (!config) {
    return {
      configured: false,
      facebookPageId: process.env.META_FACEBOOK_PAGE_ID || null,
      instagramAccountId: process.env.META_INSTAGRAM_ACCOUNT_ID || null,
      tokenValid: null,
    };
  }

  const { valid, pageName, error } = await validateToken(config);

  return {
    configured: true,
    facebookPageId: config.facebookPageId,
    instagramAccountId: config.instagramAccountId,
    tokenValid: valid,
    pageName,
    error,
  };
}

/**
 * Publish a photo post to a Facebook Page.
 * Uses the /{page-id}/photos endpoint with a public image URL.
 * https://developers.facebook.com/docs/graph-api/reference/page/photos/
 */
export async function publishToFacebook(
  config: MetaConfig,
  imageUrl: string,
  caption: string,
): Promise<FbPhotoResult> {
  const endpoint = `${GRAPH_BASE}/${config.facebookPageId}/photos`;

  const body = new URLSearchParams({
    url: imageUrl,
    caption,
    access_token: config.pageAccessToken,
    published: 'true',
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    body,
  });

  const data = await res.json() as any;

  if (data.error) {
    const msg = `Facebook publish failed: [${data.error.code}] ${data.error.message}`;
    logger.error('[MetaClient]', msg);
    throw new Error(msg);
  }

  logger.info('[MetaClient] Facebook photo published:', data);
  return data as FbPhotoResult;
}

/**
 * Publish a photo post to an Instagram Business / Professional account.
 * Uses the two-step process:
 *   Step 1: POST /{ig-user-id}/media  → creates a media container
 *   Step 2: POST /{ig-user-id}/media_publish → publishes the container
 * https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */
export async function publishToInstagram(
  config: MetaConfig,
  imageUrl: string,
  caption: string,
): Promise<IgPublishResult> {
  // ── Step 1: Create media container ──────────────────────
  const containerEndpoint = `${GRAPH_BASE}/${config.instagramAccountId}/media`;

  const containerBody = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: config.pageAccessToken,
  });

  const containerRes = await fetch(containerEndpoint, {
    method: 'POST',
    body: containerBody,
  });

  const containerData = await containerRes.json() as any;

  if (containerData.error) {
    const msg = `Instagram container creation failed: [${containerData.error.code}] ${containerData.error.message}`;
    logger.error('[MetaClient]', msg);
    throw new Error(msg);
  }

  const containerId: string = containerData.id;
  logger.info('[MetaClient] IG container created:', containerId);

  // ── Step 2: Publish the container ───────────────────────
  const publishEndpoint = `${GRAPH_BASE}/${config.instagramAccountId}/media_publish`;

  const publishBody = new URLSearchParams({
    creation_id: containerId,
    access_token: config.pageAccessToken,
  });

  const publishRes = await fetch(publishEndpoint, {
    method: 'POST',
    body: publishBody,
  });

  const publishData = await publishRes.json() as any;

  if (publishData.error) {
    const msg = `Instagram publish failed: [${publishData.error.code}] ${publishData.error.message}`;
    logger.error('[MetaClient]', msg);
    throw new Error(msg);
  }

  logger.info('[MetaClient] Instagram media published:', publishData);
  return publishData as IgPublishResult;
}
