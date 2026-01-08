'use server';

import { improveListingDetails, ImproveListingDetailsInput } from '@/ai/flows/improve-listing-details';
import { suggestBreedsFromPhoto, SuggestBreedsFromPhotoInput } from '@/ai/flows/suggest-breeds-from-photo';

export async function handleSuggestBreeds(input: SuggestBreedsFromPhotoInput) {
  try {
    const result = await suggestBreedsFromPhoto(input);
    return result;
  } catch (error) {
    console.error('AI Error (suggestBreedsFromPhoto):', error);
    throw new Error('Failed to get breed suggestions from AI.');
  }
}

export async function handleImproveDescription(input: ImproveListingDetailsInput) {
  try {
    const result = await improveListingDetails(input);
    return result;
  } catch (error) {
    console.error('AI Error (improveListingDetails):', error);
    throw new Error('Failed to improve description with AI.');
  }
}
