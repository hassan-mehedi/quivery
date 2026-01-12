'use client';

import { useEffect, useCallback } from 'react';
import { useTagStore } from '@/stores/tag-store';
import { Tag } from '@prisma/client';
import { toast } from 'sonner';

export function useTags() {
  const {
    tags,
    isLoading,
    error,
    setTags,
    addTag,
    updateTag,
    deleteTag,
    setLoading,
    setError,
  } = useTagStore();

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tags');

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = await response.json();
      setTags(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tags';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [setTags, setLoading, setError]);

  const createTag = useCallback(
    async (data: {
      name: string;
      color?: string;
    }) => {
      try {
        const response = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create tag');
        }

        const tag = await response.json();
        addTag(tag);
        toast.success('Tag created successfully');
        return tag;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create tag';
        toast.error(message);
        throw err;
      }
    },
    [addTag]
  );

  const editTag = useCallback(
    async (id: string, data: Partial<Tag>) => {
      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update tag');
        }

        const tag = await response.json();
        updateTag(id, tag);
        toast.success('Tag updated successfully');
        return tag;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tag';
        toast.error(message);
        throw err;
      }
    },
    [updateTag]
  );

  const removeTag = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete tag');
        }

        deleteTag(id);
        toast.success('Tag deleted successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete tag';
        toast.error(message);
        throw err;
      }
    },
    [deleteTag]
  );

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    isLoading,
    error,
    createTag,
    editTag,
    removeTag,
    refetch: fetchTags,
  };
}
