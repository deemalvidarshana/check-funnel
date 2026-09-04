import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { ClientService } from '../client/client.service';

@Injectable()
export class GoogleAnalyticsService {
  constructor(
    private readonly settingsService: SystemSettingsService,
    private readonly clientService: ClientService,
    private readonly configService: ConfigService,
  ) {}

  private stateSecret() {
    return (
      this.configService.get<string>('GOOGLE_OAUTH_STATE_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'change-this-google-oauth-state-secret'
    );
  }

  private signState(payload: object) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.stateSecret())
      .update(encoded)
      .digest('base64url');
    return `${encoded}.${signature}`;
  }

  private verifyState(state: string) {
    const [encoded, signature] = String(state || '').split('.');
    if (!encoded || !signature)
      throw new UnauthorizedException('Invalid OAuth state');
    const expected = createHmac('sha256', this.stateSecret())
      .update(encoded)
      .digest('base64url');
    const valid =
      signature.length === expected.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) throw new UnauthorizedException('Invalid OAuth state');
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString(),
    ) as { redirectUri: string; createdAt: number };
    if (!payload.createdAt || Date.now() - payload.createdAt > 10 * 60 * 1000)
      throw new UnauthorizedException('OAuth state expired');
    return payload;
  }

  private async requireConfig() {
    const settings = await this.settingsService.getSettings();
    if (
      !settings.googleAnalyticsClientId ||
      !settings.googleAnalyticsClientSecret
    ) {
      throw new BadRequestException(
        'Configure the Google OAuth Client ID and Client Secret first',
      );
    }
    return settings;
  }

  async getAuthUrl(isLocal: boolean) {
    const settings = await this.requireConfig();
    const redirectUri =
      (isLocal
        ? settings.googleAnalyticsLocalRedirectUri
        : settings.googleAnalyticsProductionRedirectUri) ||
      (isLocal
        ? 'http://localhost:3000/google-analytics/callback'
        : 'https://reports.checkfunnels.com/api/google-analytics/callback');
    const state = this.signState({ redirectUri, createdAt: Date.now() });
    const params = new URLSearchParams({
      client_id: settings.googleAnalyticsClientId!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email https://www.googleapis.com/auth/analytics.readonly',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    });
    return {
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  async exchangeCode(code: string, state: string) {
    const { redirectUri } = this.verifyState(state);
    const settings = await this.requireConfig();
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: settings.googleAnalyticsClientId!,
        client_secret: settings.googleAnalyticsClientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const tokens = tokenResponse.data;
    let connectedEmail = '';
    try {
      const profile = await axios.get(
        'https://openidconnect.googleapis.com/v1/userinfo',
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      );
      connectedEmail = profile.data.email || '';
    } catch {
      /* Analytics access remains usable without profile display data. */
    }

    await this.settingsService.saveGoogleTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(
        Date.now() + Number(tokens.expires_in || 3600) * 1000,
      ),
      connectedEmail,
    });
  }

  async getAccessToken() {
    const settings = await this.requireConfig();
    const stillValid =
      settings.googleAnalyticsAccessToken &&
      settings.googleAnalyticsTokenExpiresAt &&
      new Date(settings.googleAnalyticsTokenExpiresAt).getTime() >
        Date.now() + 60_000;
    if (stillValid) return settings.googleAnalyticsAccessToken!;
    if (!settings.googleAnalyticsRefreshToken)
      throw new UnauthorizedException('Google Analytics is not connected');
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: settings.googleAnalyticsClientId!,
        client_secret: settings.googleAnalyticsClientSecret!,
        refresh_token: settings.googleAnalyticsRefreshToken,
        grant_type: 'refresh_token',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    await this.settingsService.saveGoogleTokens({
      accessToken: response.data.access_token,
      expiresAt: new Date(
        Date.now() + Number(response.data.expires_in || 3600) * 1000,
      ),
      connectedEmail: settings.googleAnalyticsConnectedEmail || undefined,
    });
    return response.data.access_token as string;
  }

  async listAccountSummaries() {
    const token = await this.getAccessToken();
    const response = await axios.get(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return (response.data.accountSummaries || []).map((account: any) => ({
      id: String(account.account || '').replace('accounts/', ''),
      name: account.displayName,
      properties: (account.propertySummaries || []).map((property: any) => ({
        id: String(property.property || '').replace('properties/', ''),
        name: property.displayName,
      })),
    }));
  }

  async testClient(clientId: number) {
    const client = await this.clientService.findOne(clientId);
    if (!client.googleAnalyticsPropertyId)
      throw new BadRequestException('No GA4 property is mapped to this client');
    const token = await this.getAccessToken();
    const response = await axios.post(
      `https://analyticsdata.googleapis.com/v1beta/properties/${client.googleAnalyticsPropertyId}:runReport`,
      {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 1,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return {
      connected: true,
      propertyId: client.googleAnalyticsPropertyId,
      propertyName: client.googleAnalyticsPropertyName,
      activeUsers: response.data.rows?.[0]?.metricValues?.[0]?.value || '0',
    };
  }
}
