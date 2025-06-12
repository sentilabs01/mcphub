import { supabase } from '../lib/supabase';
import type { Installation } from '../types';

export class InstallationService {
  static async getUserInstallations(userId: string): Promise<Installation[]> {
    const { data, error } = await supabase
      .from('user_server_installations')
      .select(`
        *,
        mcp_servers (
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching installations:', error);
      throw new Error('Failed to fetch installations');
    }

    // Get latest metrics for each installation
    const installationsWithMetrics = await Promise.all(
      data.map(async (installation) => {
        const metrics = await this.getLatestMetrics(installation.id);
        return this.transformInstallationData(installation, metrics);
      })
    );

    return installationsWithMetrics;
  }

  static async installServer(userId: string, serverId: string, configuration: Record<string, any> = {}): Promise<string> {
    const { data, error } = await supabase
      .from('user_server_installations')
      .insert({
        user_id: userId,
        server_id: serverId,
        status: 'installing',
        configuration,
        installed_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error installing server:', error);
      throw new Error('Failed to install server');
    }

    // Simulate installation process
    setTimeout(async () => {
      await this.updateInstallationStatus(data.id, 'running');
    }, 3000);

    return data.id;
  }

  static async updateInstallationStatus(installationId: string, status: Installation['status']): Promise<void> {
    const { error } = await supabase
      .from('user_server_installations')
      .update({ 
        status,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', installationId);

    if (error) {
      console.error('Error updating installation status:', error);
      throw new Error('Failed to update installation status');
    }
  }

  static async updateConfiguration(installationId: string, configuration: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('user_server_installations')
      .update({ 
        configuration,
        updated_at: new Date().toISOString()
      })
      .eq('id', installationId);

    if (error) {
      console.error('Error updating configuration:', error);
      throw new Error('Failed to update configuration');
    }
  }

  static async deleteInstallation(installationId: string): Promise<void> {
    const { error } = await supabase
      .from('user_server_installations')
      .delete()
      .eq('id', installationId);

    if (error) {
      console.error('Error deleting installation:', error);
      throw new Error('Failed to delete installation');
    }
  }

  private static async getLatestMetrics(installationId: string) {
    const { data, error } = await supabase
      .from('server_usage_metrics')
      .select('*')
      .eq('installation_id', installationId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return {
        requests: 0,
        uptime: 0,
        errorRate: 0
      };
    }

    return {
      requests: data.requests,
      uptime: data.uptime,
      errorRate: data.error_rate
    };
  }

  private static transformInstallationData(data: any, metrics: any): Installation {
    return {
      id: data.id,
      serverId: data.server_id,
      serverName: data.mcp_servers?.name || 'Unknown Server',
      status: data.status,
      installedAt: data.installed_at,
      lastActive: data.last_active,
      usageMetrics: metrics,
      configuration: data.configuration
    };
  }
}