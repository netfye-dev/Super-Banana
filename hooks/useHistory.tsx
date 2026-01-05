
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { HistoryItem, HistoryContextType, ImagePart } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [thumbnailHistory, setThumbnailHistory] = useState<HistoryItem[]>([]);
  const [productPhotoShootHistory, setProductPhotoShootHistory] = useState<HistoryItem[]>([]);
  const [reimaginerHistory, setReimaginerHistory] = useState<HistoryItem[]>([]);
  const [mathVisualizerHistory, setMathVisualizerHistory] = useState<HistoryItem[]>([]);
  const { user } = useAuth();

  const addThumbnail = async (imageData: string, prompt: string, assets: ImagePart[]) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      title: `Thumbnail #${thumbnailHistory.length + 1}`,
      imageData,
      createdAt: Date.now(),
      prompt,
      assets,
    };
    setThumbnailHistory(prev => [...prev, newItem]);

    if (user) {
      try {
        const { data, error } = await supabase.from('generated_images').insert({
          user_id: user.id,
          title: newItem.title,
          prompt,
          image_url: imageData,
          image_type: 'thumbnail',
          metadata: { assets }
        });

        if (error) {
          console.error('Error saving thumbnail to database:', error);
          alert('Failed to save thumbnail to history: ' + error.message);
        } else {
          console.log('Thumbnail saved successfully:', data);
        }
      } catch (error) {
        console.error('Error saving thumbnail to database:', error);
        alert('Failed to save thumbnail to history');
      }
    }
  };

  const addProductPhotoShoot = async (imageData: string, prompt: string, asset: ImagePart) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      title: `Photoshoot #${productPhotoShootHistory.length + 1}`,
      imageData,
      createdAt: Date.now(),
      prompt,
      assets: [asset],
    };
    setProductPhotoShootHistory(prev => [...prev, newItem]);

    if (user) {
      try {
        const { data, error } = await supabase.from('generated_images').insert({
          user_id: user.id,
          title: newItem.title,
          prompt,
          image_url: imageData,
          image_type: 'product',
          metadata: { asset }
        });

        if (error) {
          console.error('Error saving product photo to database:', error);
          alert('Failed to save product photo to history: ' + error.message);
        } else {
          console.log('Product photo saved successfully:', data);
        }
      } catch (error) {
        console.error('Error saving product photo to database:', error);
        alert('Failed to save product photo to history');
      }
    }
  };

  const addReimaginerItem = async (imageData: string, prompt: string, asset?: ImagePart) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      title: `Reimagined #${reimaginerHistory.length + 1}`,
      imageData,
      createdAt: Date.now(),
      prompt,
      assets: asset ? [asset] : [],
    };
    setReimaginerHistory(prev => [...prev, newItem]);

    if (user) {
      try {
        const { data, error } = await supabase.from('generated_images').insert({
          user_id: user.id,
          title: newItem.title,
          prompt,
          image_url: imageData,
          image_type: 'reimagine',
          metadata: asset ? { asset } : {}
        });

        if (error) {
          console.error('Error saving reimagined image to database:', error);
          alert('Failed to save reimagined image to history: ' + error.message);
        } else {
          console.log('Reimagined image saved successfully:', data);
        }
      } catch (error) {
        console.error('Error saving reimagined image to database:', error);
        alert('Failed to save reimagined image to history');
      }
    }
  };

  const addMathVisualization = async (imageData: string, prompt: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      title: `Visualization #${mathVisualizerHistory.length + 1}`,
      imageData,
      createdAt: Date.now(),
      prompt,
      assets: [],
    };
    setMathVisualizerHistory(prev => [...prev, newItem]);

    if (user) {
      try {
        await supabase.from('generated_images').insert({
          user_id: user.id,
          title: newItem.title,
          prompt,
          image_url: imageData,
          image_type: 'reimagine',
          metadata: {}
        });
      } catch (error) {
        console.error('Error saving visualization to database:', error);
      }
    }
  };

  const deleteThumbnail = (id: string) => {
    setThumbnailHistory(prev => prev.filter(item => item.id !== id));
  };
  
  const deleteProductPhotoShoot = (id: string) => {
    setProductPhotoShootHistory(prev => prev.filter(item => item.id !== id));
  };

  const deleteReimaginerItem = (id: string) => {
    setReimaginerHistory(prev => prev.filter(item => item.id !== id));
  };

  // Fix: Add function to delete math visualization from history.
  const deleteMathVisualization = (id: string) => {
    setMathVisualizerHistory(prev => prev.filter(item => item.id !== id));
  };

  const value = useMemo(() => ({
    thumbnailHistory,
    productPhotoShootHistory,
    reimaginerHistory,
    // Fix: Provide math visualizer history and actions.
    mathVisualizerHistory,
    addThumbnail,
    addProductPhotoShoot,
    addReimaginerItem,
    addMathVisualization,
    deleteThumbnail,
    deleteProductPhotoShoot,
    deleteReimaginerItem,
    deleteMathVisualization
  }), [thumbnailHistory, productPhotoShootHistory, reimaginerHistory, mathVisualizerHistory]);

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
