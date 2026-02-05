 import { Capacitor } from '@capacitor/core';
 import { Preferences } from '@capacitor/preferences';
 
 /**
 * Custom storage adapter for Supabase that uses Capacitor Preferences on native platforms
 * and falls back to localStorage on web. This ensures session persistence on iOS/Android.
 */
 class CapacitorStorage {
   private isNative: boolean;
 
   constructor() {
     this.isNative = Capacitor.isNativePlatform();
   }
 
   async getItem(key: string): Promise<string | null> {
     if (this.isNative) {
       const { value } = await Preferences.get({ key });
       return value;
     }
     return localStorage.getItem(key);
   }
 
   async setItem(key: string, value: string): Promise<void> {
     if (this.isNative) {
       await Preferences.set({ key, value });
     } else {
       localStorage.setItem(key, value);
     }
   }
 
   async removeItem(key: string): Promise<void> {
     if (this.isNative) {
       await Preferences.remove({ key });
     } else {
       localStorage.removeItem(key);
     }
   }
 }
 
 export const capacitorStorage = new CapacitorStorage();
 
 /**
 * Check if we're running on a native platform (iOS/Android)
 */
 export const isNativePlatform = () => Capacitor.isNativePlatform();
 
 /**
  * Convenience functions for direct storage access (async)
  */
 export const storageGet = async (key: string): Promise<string | null> => {
   return capacitorStorage.getItem(key);
 };
 
 export const storageSet = async (key: string, value: string): Promise<void> => {
   return capacitorStorage.setItem(key, value);
 };
 
 export const storageRemove = async (key: string): Promise<void> => {
   return capacitorStorage.removeItem(key);
 };