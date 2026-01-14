import React from 'react';

export default function FavoritesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Favori İlanlarım</h1>
      <div className="p-8 text-center border rounded-lg bg-gray-50 text-gray-500">
        Henüz favoriye eklediğiniz bir ilan yok.
      </div>
    </div>
  );
}