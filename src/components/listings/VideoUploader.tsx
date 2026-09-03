'use client';

import { useState } from 'react';
import { Film, Loader2, X } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/image-pipeline';
import { readVideoMeta, type PreparedVideo } from '@/lib/video-pipeline';

/**
 * İlan videosu seçici.
 *
 * Sıkıştırma burada değil, gönderim anında yapılıyor — dosya adı ilan
 * başlığından türetiliyor ve başlık seçimden sonra değişebilir. Burada
 * yalnızca süre/boyut doğrulaması ve önizleme var; kullanıcı 10 dakikalık bir
 * videoyu sıkıştırmayı bekleyip sonra "çok uzun" uyarısı almasın.
 */

export type SelectedVideo = {
  file: File;
  previewUrl: string;
  durationSeconds: number;
  width: number;
  height: number;
};

export function VideoUploader({
  videos,
  onChange,
  maxVideos,
  maxDurationSeconds,
  maxSizeMb,
  /** Sıkıştırma ilerlemesi (gönderim sırasında dışarıdan verilir). */
  progress,
}: {
  videos: SelectedVideo[];
  onChange: (videos: SelectedVideo[]) => void;
  maxVideos: number;
  maxDurationSeconds: number;
  maxSizeMb: number;
  progress?: { stage: string; ratio: number } | null;
}) {
  const { toast } = useToast();
  const [isReading, setIsReading] = useState(false);

  async function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setIsReading(true);
    const accepted: SelectedVideo[] = [];

    for (const file of files) {
      if (videos.length + accepted.length >= maxVideos) {
        toast({
          variant: 'destructive',
          title: 'Video sınırı',
          description: `En fazla ${maxVideos} video ekleyebilirsiniz.`,
        });
        break;
      }

      // Ham dosya sınırı sıkıştırma öncesi olduğu için cömert: 4K bir kayıt
      // sıkıştırma sonrası küçülecek, kullanıcıyı baştan reddetmenin anlamı yok.
      const rawLimitMb = maxSizeMb * 8;
      if (file.size > rawLimitMb * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Dosya çok büyük',
          description: `${file.name} ${formatBytes(file.size)}. En fazla ${rawLimitMb} MB'lık dosya yükleyebilirsiniz.`,
        });
        continue;
      }

      try {
        const meta = await readVideoMeta(file);

        if (meta.durationSeconds > maxDurationSeconds) {
          toast({
            variant: 'destructive',
            title: 'Video çok uzun',
            description: `${Math.round(meta.durationSeconds)} saniye. En fazla ${maxDurationSeconds} saniyelik video yükleyebilirsiniz.`,
          });
          continue;
        }

        accepted.push({
          file,
          previewUrl: URL.createObjectURL(file),
          durationSeconds: meta.durationSeconds,
          width: meta.width,
          height: meta.height,
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Video okunamadı',
          description: error?.message ?? 'Desteklenmeyen bir biçim olabilir.',
        });
      }
    }

    setIsReading(false);
    if (accepted.length > 0) onChange([...videos, ...accepted]);
  }

  function remove(index: number) {
    URL.revokeObjectURL(videos[index].previewUrl);
    onChange(videos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {videos.map((video, i) => (
          <div key={video.previewUrl} className="relative w-40 overflow-hidden rounded-md border">
            <video
              src={video.previewUrl}
              className="h-24 w-full bg-black object-cover"
              muted
              playsInline
              preload="metadata"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              aria-label={`${i + 1}. videoyu kaldır`}
            >
              <X className="h-3 w-3" />
            </button>
            <p className="px-2 py-1 text-[11px] text-muted-foreground">
              {Math.round(video.durationSeconds)} sn · {formatBytes(video.file.size)}
            </p>
          </div>
        ))}

        {videos.length < maxVideos && (
          <label className="flex h-[7.5rem] w-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary">
            {isReading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Film className="h-5 w-5" />
                Video Ekle
              </>
            )}
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              multiple
              className="hidden"
              onChange={handleSelect}
              disabled={isReading}
            />
          </label>
        )}
      </div>

      {progress && (
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {progress.stage}… %{Math.round(progress.ratio * 100)}
          </p>
          <Progress value={progress.ratio * 100} />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        En fazla {maxVideos} video, her biri en çok {maxDurationSeconds} saniye. Videolar
        yüklenirken tarayıcınızda otomatik küçültülür — yükleme başlayınca sekmeyi
        kapatmayın.
      </p>
    </div>
  );
}
