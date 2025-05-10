import { supabase } from './supabase';

/**
 * Supabase storage'a dosya yüklemek için kullanılan fonksiyon
 * @param file Yüklenecek dosya
 * @param bucket Supabase'deki bucket adı
 * @param path Dosyanın kaydedileceği yol
 * @returns Yüklenen dosyanın URL'si veya hata
 */
export async function uploadFile(file: File, bucket: string, path: string): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Dosya adını ve uzantısını al
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}_${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    // Dosyayı Supabase'e yükle
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Dosyanın public URL'sini al
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data?.path || '');

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    return { url: null, error: error as Error };
  }
}

/**
 * Supabase storage'dan dosya silmek için kullanılan fonksiyon
 * @param bucket Supabase'deki bucket adı
 * @param filePath Silinecek dosyanın tam yolu
 * @returns İşlem sonucu
 */
export async function deleteFile(bucket: string, filePath: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Dosya silme hatası:', error);
    return { success: false, error: error as Error };
  }
} 