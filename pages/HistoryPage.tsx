import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { HistoryIcon, TrashIcon, DownloadIcon, LayoutTemplateIcon, ImagePlusIcon, SparklesIcon } from '../components/icons/LucideIcons';

interface GeneratedImage {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  image_url: string;
  image_type: 'thumbnail' | 'product' | 'reimagine';
  metadata: Record<string, any>;
  created_at: string;
}

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'thumbnail' | 'product' | 'reimagine'>('all');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  useEffect(() => {
    if (user) {
      loadImages();
    }
  }, [user, filter]);

  const loadImages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('image_type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading images:', error);
      } else {
        setImages(data || []);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting image:', error);
      } else {
        setImages(images.filter(img => img.id !== id));
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const downloadImage = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.image_url;
    link.download = `${image.title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'thumbnail':
        return <LayoutTemplateIcon className="w-5 h-5" />;
      case 'product':
        return <ImagePlusIcon className="w-5 h-5" />;
      case 'reimagine':
        return <SparklesIcon className="w-5 h-5" />;
      default:
        return <HistoryIcon className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'thumbnail':
        return 'Thumbnail';
      case 'product':
        return 'Product Photo';
      case 'reimagine':
        return 'Reimagined';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'thumbnail':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'product':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'reimagine':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your History</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage all your generated images</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({images.length})
        </Button>
        <Button
          variant={filter === 'thumbnail' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('thumbnail')}
        >
          <LayoutTemplateIcon className="w-4 h-4 mr-1" />
          Thumbnails
        </Button>
        <Button
          variant={filter === 'product' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('product')}
        >
          <ImagePlusIcon className="w-4 h-4 mr-1" />
          Products
        </Button>
        <Button
          variant={filter === 'reimagine' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('reimagine')}
        >
          <SparklesIcon className="w-4 h-4 mr-1" />
          Reimagined
        </Button>
      </div>

      {images.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center text-center py-20">
            <HistoryIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No images yet</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Start creating thumbnails, product photos, or reimagined images. They'll appear here for you to manage.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card
              key={image.id}
              className="group cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setSelectedImage(image)}
            >
              <div className="aspect-video relative overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 ${getTypeColor(image.image_type)}`}>
                    {getTypeIcon(image.image_type)}
                    <span>{getTypeLabel(image.image_type)}</span>
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">{image.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{image.prompt}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(image.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Card
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title}
                className="w-full rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedImage.title}</h2>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${getTypeColor(selectedImage.image_type)}`}>
                    {getTypeIcon(selectedImage.image_type)}
                    <span>{getTypeLabel(selectedImage.image_type)}</span>
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadImage(selectedImage)}
                  >
                    <DownloadIcon className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => deleteImage(selectedImage.id)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Prompt</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedImage.prompt}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Created</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(selectedImage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
