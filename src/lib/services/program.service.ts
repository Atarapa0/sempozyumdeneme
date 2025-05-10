import { apiClient } from './api.client';
import { ProgramItem } from '@/lib/database';

/**
 * Program etkinliklerini getir
 * @param sempozyumId Sempozyum ID (opsiyonel)
 * @param gun Gün (opsiyonel)
 * @param tip Program tipi (opsiyonel)
 */
export const getProgramEtkinlikleri = async (
  sempozyumId?: number,
  gun?: string,
  tip?: string
): Promise<ProgramItem[]> => {
  try {
    // URL parametrelerini oluştur
    const params: Record<string, string> = {};
    if (sempozyumId) params.sempozyumId = sempozyumId.toString();
    if (gun) params.gun = gun;
    if (tip) params.tip = tip;

    // Query string oluştur
    const queryString = new URLSearchParams(params).toString();
    const url = `/program${queryString ? `?${queryString}` : ''}`;

    console.log('Program etkinlikleri getiriliyor...');
    const response = await apiClient.get(url);

    // API yanıtı model tipine dönüştür
    const programEtkinlikleri = response.data.map((item: any) => {
      return {
        id: item.id.toString(),
        day: item.gun,
        startTime: item.basTarih,
        endTime: item.bitTarih,
        title: item.title,
        speaker: item.konusmaci || undefined,
        location: item.lokasyon,
        type: mapApiTypeToUIType(item.tip),
        description: item.aciklama || undefined,
        sessionChair: item.oturumBaskani || undefined,
        papers: item.sunumlar?.map((sunum: any) => ({
          id: sunum.id.toString(),
          title: sunum.title,
          authors: sunum.yazarlar || [],
          time: sunum.zaman
        })),
        symposiumId: item.sempozyumId.toString(),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      } as ProgramItem;
    });

    console.log(`${programEtkinlikleri.length} program etkinliği yüklendi.`);
    return programEtkinlikleri;
  } catch (error) {
    console.error('Program etkinlikleri getirilirken hata oluştu:', error);
    throw error;
  }
};

/**
 * Program etkinliği ekle
 * @param data Program etkinliği verileri
 */
export const programEtkinligiEkle = async (
  data: Omit<ProgramItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ProgramItem> => {
  try {
    // UI tipini API tipine dönüştür
    const apiData = {
      sempozyumId: parseInt(data.symposiumId),
      gun: data.day,
      basTarih: data.startTime,
      bitTarih: data.endTime,
      title: data.title,
      konusmaci: data.speaker,
      lokasyon: data.location,
      tip: mapUITypeToApiType(data.type),
      aciklama: data.description,
      oturumBaskani: data.sessionChair,
      // Bildiriler varsa onları da ekle
      sunumlar: data.papers?.map(paper => ({
        title: paper.title,
        yazarlar: paper.authors,
        zaman: paper.time
      }))
    };

    console.log('Program etkinliği ekleniyor:', apiData);
    const response = await apiClient.post('/program', apiData);

    // API yanıtını dönüştür
    const addedItem = response.data.programEtkinligi;
    return {
      id: addedItem.id.toString(),
      day: addedItem.gun,
      startTime: addedItem.basTarih,
      endTime: addedItem.bitTarih,
      title: addedItem.title,
      speaker: addedItem.konusmaci || undefined,
      location: addedItem.lokasyon,
      type: mapApiTypeToUIType(addedItem.tip),
      description: addedItem.aciklama || undefined,
      sessionChair: addedItem.oturumBaskani || undefined,
      papers: addedItem.sunumlar?.map((sunum: any) => ({
        id: sunum.id.toString(),
        title: sunum.title,
        authors: sunum.yazarlar || [],
        time: sunum.zaman
      })),
      symposiumId: addedItem.sempozyumId.toString(),
      createdAt: addedItem.createdAt,
      updatedAt: addedItem.updatedAt
    } as ProgramItem;
  } catch (error) {
    console.error('Program etkinliği eklenirken hata oluştu:', error);
    throw error;
  }
};

/**
 * Program etkinliği güncelle
 * @param id Program etkinliği ID
 * @param data Güncellenecek veriler
 */
export const programEtkinligiGuncelle = async (
  id: string,
  data: Partial<ProgramItem>
): Promise<ProgramItem> => {
  try {
    // UI verilerini API'ye uygun formata dönüştür
    const apiData: Record<string, any> = {};
    
    if (data.symposiumId !== undefined) apiData.sempozyumId = parseInt(data.symposiumId);
    if (data.day !== undefined) apiData.gun = data.day;
    if (data.startTime !== undefined) apiData.basTarih = data.startTime;
    if (data.endTime !== undefined) apiData.bitTarih = data.endTime;
    if (data.title !== undefined) apiData.title = data.title;
    if (data.speaker !== undefined) apiData.konusmaci = data.speaker;
    if (data.location !== undefined) apiData.lokasyon = data.location;
    if (data.type !== undefined) apiData.tip = mapUITypeToApiType(data.type);
    if (data.description !== undefined) apiData.aciklama = data.description;
    if (data.sessionChair !== undefined) apiData.oturumBaskani = data.sessionChair;
    
    // Bildiriler varsa onları da ekle
    if (data.papers) {
      apiData.sunumlar = data.papers.map(paper => ({
        title: paper.title,
        yazarlar: paper.authors,
        zaman: paper.time
      }));
    }

    console.log(`Program etkinliği güncelleniyor (ID: ${id}):`, apiData);
    const response = await apiClient.put(`/program/${id}`, apiData);

    // API yanıtını dönüştür
    const updatedItem = response.data.programEtkinligi;
    return {
      id: updatedItem.id.toString(),
      day: updatedItem.gun,
      startTime: updatedItem.basTarih,
      endTime: updatedItem.bitTarih,
      title: updatedItem.title,
      speaker: updatedItem.konusmaci || undefined,
      location: updatedItem.lokasyon,
      type: mapApiTypeToUIType(updatedItem.tip),
      description: updatedItem.aciklama || undefined,
      sessionChair: updatedItem.oturumBaskani || undefined,
      papers: updatedItem.sunumlar?.map((sunum: any) => ({
        id: sunum.id.toString(),
        title: sunum.title,
        authors: sunum.yazarlar || [],
        time: sunum.zaman
      })),
      symposiumId: updatedItem.sempozyumId.toString(),
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt
    } as ProgramItem;
  } catch (error) {
    console.error(`Program etkinliği güncellenirken hata oluştu (ID: ${id}):`, error);
    throw error;
  }
};

/**
 * Program etkinliği sil
 * @param id Program etkinliği ID
 */
export const programEtkinligiSil = async (id: string): Promise<boolean> => {
  try {
    console.log(`Program etkinliği siliniyor (ID: ${id})...`);
    await apiClient.delete(`/program/${id}`);
    return true;
  } catch (error) {
    console.error(`Program etkinliği silinirken hata oluştu (ID: ${id}):`, error);
    throw error;
  }
};

/**
 * UI program tipi değerini API program tipi değerine dönüştür
 */
function mapUITypeToApiType(type: string): string {
  const typeMap: Record<string, string> = {
    'opening': 'acilis',
    'keynote': 'keynote',
    'session': 'oturum',
    'break': 'ara',
    'social': 'sosyal',
    'closing': 'kapanis',
    'poster': 'poster',
    'workshop': 'calistay'
  };
  
  return typeMap[type] || 'oturum'; // Varsayılan olarak 'oturum'
}

/**
 * API program tipi değerini UI program tipi değerine dönüştür
 */
function mapApiTypeToUIType(type: string): 'opening' | 'keynote' | 'session' | 'break' | 'social' | 'closing' {
  const typeMap: Record<string, any> = {
    'acilis': 'opening',
    'keynote': 'keynote',
    'oturum': 'session',
    'ara': 'break',
    'yemek': 'break',
    'sosyal': 'social',
    'kapanis': 'closing',
    'poster': 'session',
    'calistay': 'session'
  };
  
  return typeMap[type] || 'session'; // Varsayılan olarak 'session'
} 