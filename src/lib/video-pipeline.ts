'use client';

import { slugify } from './routing';

/**
 * Tarayıcıda video sıkıştırma.
 *
 * Güvercin uçuş videoları telefonla 4K çekiliyor ve bir dakikalık kayıt
 * kolayca 300 MB'ı buluyor. Bunu olduğu gibi yüklemek üç sorun üretiyor:
 * mobil veride dakikalarca yükleme, depolama maliyeti ve izleyici tarafında
 * bant genişliği. Sıkıştırma sunucuda değil tarayıcıda yapılıyor — sunucu
 * tarafında transcode altyapısı kurmak (veya bir video platformuna aylık
 * ödeme yapmak) bu aşamada gereksiz.
 *
 * ffmpeg.wasm çekirdeği (~30 MB) yalnızca kullanıcı gerçekten video seçtiğinde
 * CDN'den indiriliyor; ana paket etkilenmiyor. Tek çekirdekli (mt olmayan)
 * sürüm kullanılıyor: çok çekirdekli sürüm SharedArrayBuffer istiyor, o da
 * sitenin tamamına COOP/COEP başlıkları eklemeyi gerektirip harici görsel ve
 * gömülü içerikleri bozardı.
 *
 * NOT: Video hacmi büyüdüğünde doğru adım Cloudflare Stream / Bunny gibi bir
 * platforma geçmek. Şema bunu şema değişikliği olmadan destekliyor
 * (listing_videos.provider), bu dosya yalnızca "supabase" yolunu uyguluyor.
 */

const CORE_VERSION = '0.12.10';
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

/** Uzun kenar sınırı. 720p, uçuş videosunda fazlasıyla yeterli. */
const MAX_HEIGHT = 720;
/** Hedef görüntü bit hızı. 1.2 Mbps 720p için makul bir denge. */
const VIDEO_BITRATE = '1200k';
const AUDIO_BITRATE = '96k';

export type VideoMeta = {
  durationSeconds: number;
  width: number;
  height: number;
};

export type PreparedVideo = {
  file: File;
  meta: VideoMeta;
  originalBytes: number;
  /** Sıkıştırma yapılamadıysa false; dosya olduğu gibi yükleniyor. */
  compressed: boolean;
  previewUrl: string;
};

/** Videonun süresini ve çözünürlüğünü okur — sıkıştırmadan önce doğrulama için. */
export function readVideoMeta(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        durationSeconds: Math.round(video.duration),
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Video okunamadı. Desteklenmeyen bir biçim olabilir.'));
    };
    video.src = url;
  });
}

/** SEO uyumlu video dosya adı — görsellerdeki mantığın aynısı. */
export function buildVideoFilename(
  parts: { title: string; context?: string; city?: string },
  index: number
): string {
  const segments = [parts.title, parts.context, parts.city]
    .filter(Boolean)
    .map((s) => slugify(s as string))
    .filter(Boolean);

  const base = segments.join('-').slice(0, 110).replace(/-+$/, '') || 'video';
  return `${base}-video-${index + 1}.mp4`;
}

let ffmpegInstance: any = null;

async function loadFfmpeg(onProgress?: (ratio: number) => void) {
  // Dinamik import: ffmpeg ana pakete girmesin, video seçilmeden yüklenmesin.
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { toBlobURL } = await import('@ffmpeg/util');

  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }

  if (onProgress) {
    ffmpegInstance.on('progress', ({ progress }: { progress: number }) => {
      onProgress(Math.min(1, Math.max(0, progress)));
    });
  }

  return ffmpegInstance;
}

/**
 * Videoyu 720p H.264 MP4'e sıkıştırır.
 *
 * Sıkıştırma başarısız olursa (çekirdek indirilemedi, biçim desteklenmiyor,
 * bellek yetmedi) hata fırlatmıyor: orijinal dosyayı `compressed: false` ile
 * döndürüyor. Kullanıcının yüklemesi tamamen engellenmektense biraz büyük bir
 * dosya yüklenmesi yeğdir; boyut sınırı zaten kova tarafında zorlanıyor.
 */
export async function prepareVideo(
  file: File,
  naming: Parameters<typeof buildVideoFilename>[0],
  index: number,
  onProgress?: (stage: string, ratio: number) => void
): Promise<PreparedVideo> {
  const meta = await readVideoMeta(file);
  const filename = buildVideoFilename(naming, index);

  try {
    onProgress?.('Sıkıştırıcı hazırlanıyor', 0);
    const ffmpeg = await loadFfmpeg((ratio) => onProgress?.('Video sıkıştırılıyor', ratio));

    const { fetchFile } = await import('@ffmpeg/util');
    const inputName = 'girdi';
    const outputName = 'cikti.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      '-i', inputName,
      // Yüksekliği sınırla, genişliği oranı koruyarak hesapla.
      // -2: kodlayıcının istediği çift sayıya yuvarla.
      '-vf', `scale=-2:'min(${MAX_HEIGHT},ih)'`,
      '-c:v', 'libx264',
      // veryfast: tarayıcıda kalite/süre dengesi. slower ayarlar mobilde
      // kabul edilemez sürelere çıkıyor.
      '-preset', 'veryfast',
      '-b:v', VIDEO_BITRATE,
      '-maxrate', VIDEO_BITRATE,
      '-bufsize', '2400k',
      // yuv420p: Safari ve eski Android oynatıcılar başka biçimi açmıyor.
      '-pix_fmt', 'yuv420p',
      // faststart: metadata başa alınıyor, video tam inmeden oynamaya başlıyor.
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', AUDIO_BITRATE,
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // ffmpeg.wasm Uint8Array döndürüyor; Blob'a vermeden önce ArrayBuffer'a
    // çeviriyoruz — TypeScript'in BlobPart tanımı SharedArrayBuffer destekli
    // Uint8Array'i doğrudan kabul etmiyor.
    const bytes = data as Uint8Array;
    const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
      type: 'video/mp4',
    });
    const compressedFile = new File([blob], filename, { type: 'video/mp4' });

    // Sıkıştırma sonucu daha büyükse (zaten iyi sıkıştırılmış kısa video)
    // orijinali kullan.
    if (compressedFile.size >= file.size) {
      return {
        file: new File([file], filename, { type: file.type }),
        meta,
        originalBytes: file.size,
        compressed: false,
        previewUrl: URL.createObjectURL(file),
      };
    }

    onProgress?.('Video hazır', 1);
    return {
      file: compressedFile,
      meta,
      originalBytes: file.size,
      compressed: true,
      previewUrl: URL.createObjectURL(compressedFile),
    };
  } catch (error) {
    console.error('[video] sıkıştırma başarısız, orijinal yüklenecek:', error);
    return {
      file: new File([file], filename, { type: file.type || 'video/mp4' }),
      meta,
      originalBytes: file.size,
      compressed: false,
      previewUrl: URL.createObjectURL(file),
    };
  }
}
