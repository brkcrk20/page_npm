'use server';

/**
 * @fileOverview A flow to improve pet listing descriptions.
 *
 * - improveListingDetails - A function that enhances a basic pet description.
 * - ImproveListingDetailsInput - The input type for the improveListingDetails function.
 * - ImproveListingDetailsOutput - The return type for the improveListingDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveListingDetailsInputSchema = z.object({
  description: z.string().describe('A basic description of the pet.'),
  animalType: z.string().describe('The type of animal (e.g., dog, cat).'),
  breed: z.string().describe('The breed of the animal.'),
  name: z.string().describe('The name of the animal.'),
});
export type ImproveListingDetailsInput = z.infer<
  typeof ImproveListingDetailsInputSchema
>;

const ImproveListingDetailsOutputSchema = z.object({
  improvedDescription: z
    .string()
    .describe('An enhanced and more appealing description of the pet.'),
});
export type ImproveListingDetailsOutput = z.infer<
  typeof ImproveListingDetailsOutputSchema
>;

export async function improveListingDetails(
  input: ImproveListingDetailsInput
): Promise<ImproveListingDetailsOutput> {
  return improveListingDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveListingDetailsPrompt',
  input: {schema: ImproveListingDetailsInputSchema},
  output: {schema: ImproveListingDetailsOutputSchema},
  prompt: `You are an expert copywriter specializing in writing compelling pet adoption listings. Your goal is to transform basic pet descriptions into engaging narratives that highlight the pet's unique qualities and attract potential adopters or buyers.

  Given the following information, create an improved description:

  Pet Name: {{{name}}}
  Animal Type: {{{animalType}}}
  Breed: {{{breed}}}
  Basic Description: {{{description}}}

  Focus on making the description more appealing, informative, and emotionally resonant. Include details about the pet's personality, temperament, and any special needs or quirks.  Write in a way that captures the heart of the reader and makes them want to learn more about the pet.
`,
});

const improveListingDetailsFlow = ai.defineFlow(
  {
    name: 'improveListingDetailsFlow',
    inputSchema: ImproveListingDetailsInputSchema,
    outputSchema: ImproveListingDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
