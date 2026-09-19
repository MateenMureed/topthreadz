'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FiGrid,
  FiUpload,
  FiEdit2,
  FiTrash2,
  FiX,
  FiPackage,
  FiInfo,
  FiCheck,
} from 'react-icons/fi';

export default function CategoriesManager() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () =>
      api.get('/categories?all=true').then((r) => r.data),
  });

  const [name, setName] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);

  // Edit state
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editBannerImage, setEditBannerImage] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [isEditBannerUploading, setIsEditBannerUploading] = useState(false);

  const categories = data?.data || [];

  const handleFileUpload = async (
    file: File,
    setter: (url: string) => void,
    loader: (loading: boolean) => void
  ) => {
    try {
      loader(true);

      const formData = new FormData();
      formData.append('images', file);
      formData.append('type', 'category');

      const res = await api.post('/products/upload-images?type=category', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url =
        res.data?.data?.urls?.[0] ||
        res.data?.data?.images?.[0]?.url;

      if (url) {
        setter(url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Error uploading image'
      );
    } finally {
      loader(false);
    }
  };

  const create = useMutation({
    mutationFn: () =>
      api.post('/categories', {
        name: name.trim(),
        coverImage: coverImage.trim() || undefined,
        bannerImage: bannerImage.trim() || undefined,
        description: description.trim() || undefined,
        sortOrder: categories.length,
      }),

    onSuccess: () => {
      setName('');
      setCoverImage('');
      setBannerImage('');
      setDescription('');

      qc.invalidateQueries({
        queryKey: ['admin-categories'],
      });

      qc.invalidateQueries({
        queryKey: ['home', 'categories'],
      });

      toast.success('Category created successfully');
    },

    onError: (err: any) => {
      const status = err?.response?.status;

      const message =
        err?.response?.data?.message ||
        (status === 401 || status === 403
          ? 'Admin session expired. Please log in again.'
          : 'Could not create category. Ensure database migrations have been applied.');

      toast.error(message);
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: any;
    }) => api.patch(`/categories/${id}`, data),

    onSuccess: () => {
      setEditingCategory(null);

      qc.invalidateQueries({
        queryKey: ['admin-categories'],
      });

      qc.invalidateQueries({
        queryKey: ['home', 'categories'],
      });

      toast.success('Category updated successfully');
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          'Failed to update category'
      );
    },
  });

  const toggle = useMutation({
    mutationFn: (c: any) =>
      api.patch(`/categories/${c.id}`, {
        isActive: !c.isActive,
      }),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['admin-categories'],
      });

      qc.invalidateQueries({
        queryKey: ['home', 'categories'],
      });
    },
  });

  const deleteCat = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/categories/${id}`),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['admin-categories'],
      });

      qc.invalidateQueries({
        queryKey: ['home', 'categories'],
      });

      toast.success('Category deleted');
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          'Failed to delete category'
      );
    },
  });

  const startEdit = (c: any) => {
    setEditingCategory(c);
    setEditName(c.name || '');
    setEditCoverImage(
      c.cardImage || c.rawCoverImage || ''
    );
    setEditBannerImage(
      c.bannerImage || c.rawCoverImage || ''
    );
    setEditDescription(c.description || '');
  };

  return (
    <div className="rounded-2xl border border-surface-200/80 bg-white p-5 sm:p-6 shadow-card space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-surface-100">
        <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-100/60 shadow-subtle">
          <FiGrid className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-base font-bold text-surface-900">
            Category Catalog & Display
          </h2>

          <p className="text-xs text-surface-500">
            Configure department banners, collection card pictures, and SEO descriptions.
          </p>
        </div>
      </div>

      {/* Recommended Banner Specs */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex items-start gap-3">

          <FiInfo className="h-4 w-4 text-accent-600 shrink-0 mt-0.5" />

          <div className="text-xs space-y-1 text-surface-700">

            <p className="font-bold text-surface-900 uppercase tracking-wider text-[10px]">
              Recommended Category Banner Specs
            </p>

            <p className="text-[11px] leading-relaxed">
              • <strong>Dimensions:</strong> 1920 × 1080 px (16:9) or 1600 × 900 px.
            </p>

            <p className="text-[11px] leading-relaxed">
              • <strong>Aspect Ratio:</strong> 16:9 widescreen.
            </p>

            <p className="text-[11px] leading-relaxed">
              • <strong>File Size:</strong> 150 KB – 400 KB (Max 2 MB). WebP or compressed JPG.
            </p>

            <p className="text-[11px] leading-relaxed">
              • <strong>Object Fit:</strong> Cover — image fills the entire banner area.
            </p>

            <p className="text-[11px] leading-relaxed">
              • <strong>Alignment:</strong> Keep important subjects near the center because
              <code className="mx-1 rounded bg-white/70 px-1 py-0.5">
                object-cover
              </code>
              may crop the edges on different screen sizes.
            </p>

          </div>
        </div>
      </div>

      {/* Create Form */}
      <div className="rounded-2xl border border-surface-200/80 bg-surface-50/50 p-5 space-y-4">

        <h3 className="text-xs font-bold uppercase tracking-wider text-surface-800">
          Add New Category
        </h3>

        <div className="space-y-3">

          {/* Category Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">
              Category Name *
            </label>

            <input
              className="admin-input-field w-full text-xs"
              placeholder="e.g. Unstitched, Stitched Suits, Wash & Wear, Shawls..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category Top Banner */}
          <div>

            <div className="flex items-center justify-between mb-1">

              <label className="block text-xs font-semibold text-surface-700">
                Category Top Banner (Hero Banner)
              </label>

              <span className="text-[10px] text-surface-400 font-medium">
                Rec: 1920 × 1080 px · 16:9
              </span>

            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

              <input
                className="admin-input-field flex-1 text-xs"
                placeholder="Paste Banner URL or upload below..."
                value={bannerImage}
                onChange={(e) =>
                  setBannerImage(e.target.value)
                }
              />

              <label className="admin-btn-secondary flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap !py-2 text-xs">

                <FiUpload className="h-3.5 w-3.5 text-surface-500" />

                <span>
                  {isBannerUploading
                    ? 'Uploading...'
                    : 'Upload Banner'}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isBannerUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      handleFileUpload(
                        file,
                        setBannerImage,
                        setIsBannerUploading
                      );
                    }
                  }}
                />

              </label>

              {bannerImage && (
                <button
                  type="button"
                  onClick={() => setBannerImage('')}
                  className="admin-btn-secondary !py-2 text-xs !text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear
                </button>
              )}

            </div>

            {/* 16:9 Banner Preview — FULL FILL, NO WHITE SPACE */}
            {bannerImage && (
              <div
                className="mt-2 w-full overflow-hidden rounded-xl border border-surface-200 bg-black/5 shadow-inner"
                style={{ aspectRatio: '16 / 9' }}
              >
                <img
                  src={bannerImage}
                  alt="Banner Preview"
                  className="block"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>
            )}

          </div>

          {/* Category Card Picture */}
          <div>

            <label className="mb-1 block text-xs font-semibold text-surface-700">
              Homepage Category Card Picture (Optional)
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

              <input
                className="admin-input-field flex-1 text-xs"
                placeholder="Paste Card URL or upload (leave blank to auto-use latest product photo)..."
                value={coverImage}
                onChange={(e) =>
                  setCoverImage(e.target.value)
                }
              />

              <label className="admin-btn-secondary flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap !py-2 text-xs">

                <FiUpload className="h-3.5 w-3.5 text-surface-500" />

                <span>
                  {isUploading
                    ? 'Uploading...'
                    : 'Upload Card Pic'}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      handleFileUpload(
                        file,
                        setCoverImage,
                        setIsUploading
                      );
                    }
                  }}
                />

              </label>

              {coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="admin-btn-secondary !py-2 text-xs !text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear
                </button>
              )}

            </div>

            {coverImage && (
              <div className="mt-2 flex items-center gap-3">

                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-surface-200">

                  <img
                    src={coverImage}
                    alt="Card Preview"
                    className="h-full w-full object-cover"
                  />

                </div>

                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">

                  <FiCheck className="w-3.5 h-3.5" />

                  Custom card picture ready

                </span>

              </div>
            )}

          </div>

          {/* Category Description */}
          <div>

            <div className="flex items-center justify-between mb-1">

              <label className="block text-xs font-semibold text-surface-700">
                Category Description (Editorial SEO Copy)
              </label>

              <span className="text-[10px] text-surface-400">
                Appears above footer for brand storytelling
              </span>

            </div>

            <textarea
              className="admin-input-field w-full text-xs min-h-[75px] leading-relaxed"
              placeholder="Discover timeless elegance crafted for the modern wardrobe..."
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />

          </div>

          {/* Add Category */}
          <div className="flex justify-end pt-1">

            <button
              className="admin-btn-primary !py-2.5 !px-5 text-xs font-semibold"
              disabled={
                !name.trim() ||
                create.isPending ||
                isUploading ||
                isBannerUploading
              }
              onClick={() => create.mutate()}
            >
              {create.isPending
                ? 'Adding Category...'
                : 'Add Category'}
            </button>

          </div>

        </div>
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div
          className="admin-sheet-backdrop"
          onClick={() => setEditingCategory(null)}
        >

          <div
            className="admin-sheet-panel sm:max-w-xl shadow-2xl border border-surface-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between pb-3 border-b border-surface-100">

              <h3 className="text-base font-bold text-surface-900">
                Edit Category
              </h3>

              <button
                onClick={() =>
                  setEditingCategory(null)
                }
                className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-surface-600"
              >
                <FiX className="h-4 w-4" />
              </button>

            </div>

            <div className="space-y-3.5">

              {/* Category Name */}
              <div>

                <label className="mb-1 block text-xs font-semibold text-surface-700">
                  Category Name
                </label>

                <input
                  className="admin-input-field w-full text-xs"
                  value={editName}
                  onChange={(e) =>
                    setEditName(e.target.value)
                  }
                />

              </div>

              {/* Category Banner */}
              <div>

                <div className="flex items-center justify-between mb-1">

                  <label className="block text-xs font-semibold text-surface-700">
                    Category Top Banner
                  </label>

                  <span className="text-[10px] text-surface-400 font-medium">
                    1920 × 1080 px · 16:9
                  </span>

                </div>

                <div className="flex flex-col gap-2">

                  <input
                    className="admin-input-field w-full text-xs"
                    placeholder="Banner Image URL..."
                    value={editBannerImage}
                    onChange={(e) =>
                      setEditBannerImage(e.target.value)
                    }
                  />

                  <div className="flex gap-2">

                    <label className="admin-btn-secondary flex-1 flex cursor-pointer items-center justify-center gap-1.5 !py-1.5 text-xs">

                      <FiUpload className="h-3.5 w-3.5 text-surface-500" />

                      <span>
                        {isEditBannerUploading
                          ? 'Uploading...'
                          : 'Upload Banner'}
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isEditBannerUploading}
                        onChange={(e) => {
                          const file =
                            e.target.files?.[0];

                          if (file) {
                            handleFileUpload(
                              file,
                              setEditBannerImage,
                              setIsEditBannerUploading
                            );
                          }
                        }}
                      />

                    </label>

                    {editBannerImage && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditBannerImage('')
                        }
                        className="admin-btn-secondary !py-1.5 text-xs !text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}

                  </div>

                  {/* 16:9 Edit Banner Preview — FULL FILL, NO WHITE SPACE */}
                  {editBannerImage && (
                    <div
                      className="mt-1 w-full overflow-hidden rounded-xl border border-surface-200 bg-black/5"
                      style={{ aspectRatio: '16 / 9' }}
                    >
                      <img
                        src={editBannerImage}
                        alt="Banner Preview"
                        className="block"
                        style={{
                          objectFit: 'cover',
                          objectPosition: 'center',
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    </div>
                  )}

                </div>
              </div>

              {/* Category Card Picture */}
              <div>

                <label className="mb-1 block text-xs font-semibold text-surface-700">
                  Category Card Picture (Homepage Card)
                </label>

                <div className="flex flex-col gap-2">

                  <input
                    className="admin-input-field w-full text-xs"
                    placeholder="Image URL..."
                    value={editCoverImage}
                    onChange={(e) =>
                      setEditCoverImage(e.target.value)
                    }
                  />

                  <div className="flex gap-2">

                    <label className="admin-btn-secondary flex-1 flex cursor-pointer items-center justify-center gap-1.5 !py-1.5 text-xs">

                      <FiUpload className="h-3.5 w-3.5 text-surface-500" />

                      <span>
                        {isEditUploading
                          ? 'Uploading...'
                          : 'Upload Card Pic'}
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isEditUploading}
                        onChange={(e) => {
                          const file =
                            e.target.files?.[0];

                          if (file) {
                            handleFileUpload(
                              file,
                              setEditCoverImage,
                              setIsEditUploading
                            );
                          }
                        }}
                      />

                    </label>

                    {editCoverImage && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditCoverImage('')
                        }
                        className="admin-btn-secondary !py-1.5 text-xs !text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}

                  </div>

                  {editCoverImage && (
                    <div className="mt-1 flex items-center gap-3">

                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-surface-200">

                        <img
                          src={editCoverImage}
                          alt="Card Preview"
                          className="h-full w-full object-cover"
                        />

                      </div>

                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">

                        <FiCheck className="w-3 h-3" />

                        Custom card image set

                      </span>

                    </div>
                  )}

                </div>
              </div>

              {/* Category Description */}
              <div>

                <label className="mb-1 block text-xs font-semibold text-surface-700">
                  Category Description (Editorial Text)
                </label>

                <textarea
                  className="admin-input-field w-full text-xs min-h-[75px] leading-relaxed"
                  placeholder="Discover the Sultan Collection..."
                  value={editDescription}
                  onChange={(e) =>
                    setEditDescription(e.target.value)
                  }
                />

              </div>

              {/* Modal Actions */}
              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-surface-100">

                <button
                  onClick={() =>
                    setEditingCategory(null)
                  }
                  className="admin-btn-secondary !py-2 text-xs"
                >
                  Cancel
                </button>

                <button
                  disabled={
                    !editName.trim() ||
                    update.isPending ||
                    isEditUploading ||
                    isEditBannerUploading
                  }
                  onClick={() =>
                    update.mutate({
                      id: editingCategory.id,
                      data: {
                        name: editName.trim(),
                        coverImage: editCoverImage,
                        bannerImage: editBannerImage,
                        description: editDescription,
                      },
                    })
                  }
                  className="admin-btn-primary !py-2 text-xs font-semibold"
                >
                  {update.isPending
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div>

        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-surface-700">
          Existing Categories
        </h3>

        {isLoading ? (
          <p className="text-xs text-surface-400 py-4 text-center">
            Loading categories...
          </p>
        ) : categories.length === 0 ? (
          <p className="text-xs text-surface-500 py-4 text-center">
            No categories created yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">

            {categories.map((c: any) => (

              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-surface-200/80 bg-white p-3.5 shadow-card hover:border-surface-300 transition-colors"
              >

                <div className="flex items-center gap-3 overflow-hidden min-w-0">

                  <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl border border-surface-200 bg-surface-100">

                    {c.bannerImage || c.coverImage ? (

                      <img
                        src={
                          c.bannerImage ||
                          c.coverImage
                        }
                        alt={c.name}
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <div className="flex h-full w-full items-center justify-center text-surface-400">

                        <FiPackage className="h-5 w-5" />

                      </div>

                    )}

                  </div>

                  <div className="min-w-0">

                    <h4 className="truncate font-bold text-surface-900 text-xs">
                      {c.name}
                    </h4>

                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] mt-0.5">

                      {c.bannerImage ? (
                        <span className="text-accent-600 font-semibold bg-accent-50 px-1.5 py-0.5 rounded">
                          Banner
                        </span>
                      ) : null}

                      {c.description && (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          Editorial
                        </span>
                      )}

                      {c.hasCustomImage && (
                        <span className="text-surface-600 bg-surface-100 px-1.5 py-0.5 rounded">
                          Card Pic
                        </span>
                      )}

                    </div>

                  </div>

                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">

                  <button
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                      c.isActive
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-surface-500 bg-surface-100 border-surface-200'
                    }`}
                    onClick={() =>
                      toggle.mutate(c)
                    }
                  >
                    {c.isActive
                      ? 'Active'
                      : 'Inactive'}
                  </button>

                  <button
                    onClick={() => startEdit(c)}
                    className="p-1.5 text-surface-500 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
                    title="Edit Category"
                  >
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Delete category "${c.name}"?`
                        )
                      ) {
                        deleteCat.mutate(c.id);
                      }
                    }}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
}