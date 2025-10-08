/**
 * Artifact Service
 * Manages AI-generated code artifacts (HTML, React, Three.js, etc.)
 */

import { supabase } from '@/lib/supabase';

export type ArtifactLanguage = 'html' | 'react' | 'javascript' | 'typescript';
export type ArtifactType = 'visualization' | 'component' | 'utility' | 'dashboard' | 'tool' | 'other';

export interface Artifact {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: ArtifactLanguage;
  artifact_type: ArtifactType;
  created_by: string;
  is_global: boolean;
  tags: string[] | null;
  thumbnail_url: string | null;
  view_count: number;
  fork_count: number;
  version: number;
  parent_artifact_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface CreateArtifactData {
  title: string;
  description?: string;
  code: string;
  language: ArtifactLanguage;
  artifact_type?: ArtifactType;
  tags?: string[];
  is_global?: boolean;
}

export interface UpdateArtifactData {
  title?: string;
  description?: string;
  code?: string;
  tags?: string[];
}

class ArtifactService {
  /**
   * Save a new artifact
   */
  async saveArtifact(userId: string, artifactData: CreateArtifactData): Promise<Artifact | null> {
    try {
      console.log('💾 artifact-service.saveArtifact called:', { userId, title: artifactData.title, language: artifactData.language });
      
      const { data, error } = await supabase
        .from('ai_artifacts')
        .insert({
          ...artifactData,
          created_by: userId,
          artifact_type: artifactData.artifact_type || 'other',
          is_global: artifactData.is_global || false,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error saving artifact:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return null;
      }

      console.log('✅ Artifact saved successfully:', data.id);
      return data as Artifact;
    } catch (error) {
      console.error('❌ Exception saving artifact:', error);
      return null;
    }
  }

  /**
   * Get user's artifacts (personal + global)
   */
  async getUserArtifacts(userId: string, includeGlobal: boolean = true): Promise<Artifact[]> {
    try {
      let query = supabase
        .from('ai_artifacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (includeGlobal) {
        // Get both personal and global artifacts
        query = query.or(`created_by.eq.${userId},is_global.eq.true`);
      } else {
        // Get only personal artifacts
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching artifacts:', error);
        return [];
      }

      return (data || []) as Artifact[];
    } catch (error) {
      console.error('❌ Exception fetching artifacts:', error);
      return [];
    }
  }

  /**
   * Get only personal artifacts
   */
  async getPersonalArtifacts(userId: string): Promise<Artifact[]> {
    return this.getUserArtifacts(userId, false);
  }

  /**
   * Get only global/published artifacts
   */
  async getGlobalArtifacts(): Promise<Artifact[]> {
    try {
      const { data, error } = await supabase
        .from('ai_artifacts')
        .select('*')
        .eq('is_global', true)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching global artifacts:', error);
        return [];
      }

      return (data || []) as Artifact[];
    } catch (error) {
      console.error('❌ Exception fetching global artifacts:', error);
      return [];
    }
  }

  /**
   * Get artifact by ID
   */
  async getArtifactById(artifactId: string): Promise<Artifact | null> {
    try {
      const { data, error } = await supabase
        .from('ai_artifacts')
        .select('*')
        .eq('id', artifactId)
        .single();

      if (error) {
        console.error('❌ Error fetching artifact:', error);
        return null;
      }

      // Increment view count
      await supabase.rpc('increment_artifact_view_count', { artifact_uuid: artifactId });

      return data as Artifact;
    } catch (error) {
      console.error('❌ Exception fetching artifact:', error);
      return null;
    }
  }

  /**
   * Update artifact
   */
  async updateArtifact(artifactId: string, updates: UpdateArtifactData): Promise<Artifact | null> {
    try {
      const { data, error } = await supabase
        .from('ai_artifacts')
        .update(updates)
        .eq('id', artifactId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating artifact:', error);
        return null;
      }

      console.log('✅ Artifact updated:', artifactId);
      return data as Artifact;
    } catch (error) {
      console.error('❌ Exception updating artifact:', error);
      return null;
    }
  }

  /**
   * Delete artifact
   */
  async deleteArtifact(artifactId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_artifacts')
        .delete()
        .eq('id', artifactId);

      if (error) {
        console.error('❌ Error deleting artifact:', error);
        return false;
      }

      console.log('✅ Artifact deleted:', artifactId);
      return true;
    } catch (error) {
      console.error('❌ Exception deleting artifact:', error);
      return false;
    }
  }

  /**
   * Publish artifact (make it global)
   */
  async publishArtifact(artifactId: string): Promise<Artifact | null> {
    try {
      const { data, error } = await supabase.rpc('publish_artifact', { artifact_uuid: artifactId });

      if (error) {
        console.error('❌ Error publishing artifact:', error);
        return null;
      }

      console.log('✅ Artifact published:', artifactId);
      return data as any as Artifact;
    } catch (error) {
      console.error('❌ Exception publishing artifact:', error);
      return null;
    }
  }

  /**
   * Unpublish artifact (make it private)
   */
  async unpublishArtifact(artifactId: string): Promise<Artifact | null> {
    try {
      const { data, error } = await supabase.rpc('unpublish_artifact', { artifact_uuid: artifactId });

      if (error) {
        console.error('❌ Error unpublishing artifact:', error);
        return null;
      }

      console.log('✅ Artifact unpublished:', artifactId);
      return data as any as Artifact;
    } catch (error) {
      console.error('❌ Exception unpublishing artifact:', error);
      return null;
    }
  }

  /**
   * Fork artifact (create a copy)
   */
  async forkArtifact(artifactId: string, userId: string, newTitle?: string): Promise<Artifact | null> {
    try {
      const original = await this.getArtifactById(artifactId);
      if (!original) return null;

      const title = newTitle || `${original.title} (Fork)`;

      const { data, error } = await supabase.rpc('fork_artifact', {
        artifact_uuid: artifactId,
        user_id_param: userId,
        new_title: title,
      });

      if (error) {
        console.error('❌ Error forking artifact:', error);
        return null;
      }

      console.log('✅ Artifact forked:', (data as any).id);
      return data as any as Artifact;
    } catch (error) {
      console.error('❌ Exception forking artifact:', error);
      return null;
    }
  }

  /**
   * Search artifacts
   */
  async searchArtifacts(query: string, userId?: string): Promise<Artifact[]> {
    try {
      let supabaseQuery = supabase
        .from('ai_artifacts')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      // If userId provided, include personal + global. Otherwise, only global
      if (userId) {
        supabaseQuery = supabaseQuery.or(`created_by.eq.${userId},is_global.eq.true`);
      } else {
        supabaseQuery = supabaseQuery.eq('is_global', true);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('❌ Error searching artifacts:', error);
        return [];
      }

      return (data || []) as Artifact[];
    } catch (error) {
      console.error('❌ Exception searching artifacts:', error);
      return [];
    }
  }

  /**
   * Get artifacts by tag
   */
  async getArtifactsByTag(tag: string): Promise<Artifact[]> {
    try {
      const { data, error } = await supabase
        .from('ai_artifacts')
        .select('*')
        .contains('tags', [tag])
        .eq('is_global', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching artifacts by tag:', error);
        return [];
      }

      return (data || []) as Artifact[];
    } catch (error) {
      console.error('❌ Exception fetching artifacts by tag:', error);
      return [];
    }
  }
}

// Export singleton instance
export const artifactService = new ArtifactService();

// Export class for testing
export default ArtifactService;
