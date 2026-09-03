'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquare, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { cn } from '@/lib/utils';

/**
 * Mesajlarım.
 *
 * Solda konuşma listesi, sağda seçili konuşma. Mobilde ikisi aynı anda
 * sığmadığı için tek seferde biri gösteriliyor.
 *
 * Yeni mesajlar Supabase Realtime ile geliyor: sayfayı yenilemeden görünmesi
 * gerekiyor, aksi hâlde karşılıklı yazışma kullanılabilir olmuyor.
 */

type Conversation = {
  id: number;
  listing_id: number | null;
  listing_title: string | null;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  buyer_unread: number;
  seller_unread: number;
  listings: { slug: string; id: number } | null;
};

type Message = {
  id: number;
  conversation_id: number;
  sender_id: string;
  body: string;
  created_at: string;
};

export function MessagesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useSupabaseAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const listingParam = searchParams.get('ilan');

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('conversations')
      .select(
        `id, listing_id, listing_title, buyer_id, seller_id,
         last_message_at, last_message_preview, buyer_unread, seller_unread,
         listings ( id, slug )`
      )
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Konuşmalar yüklenemedi', description: error.message });
      setIsLoading(false);
      return;
    }
    setConversations((data as unknown as Conversation[]) ?? []);
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // İlan sayfasından "Mesaj Gönder" ile gelindiyse konuşmayı aç.
  useEffect(() => {
    if (!user || !listingParam) return;
    const supabase = getSupabaseBrowserClient();

    supabase
      .rpc('start_conversation', { p_listing_id: Number(listingParam) })
      .then(({ data, error }) => {
        if (error) {
          toast({ variant: 'destructive', title: 'Konuşma başlatılamadı', description: error.message });
          return;
        }
        setActiveId(Number(data));
        loadConversations();
        // Adresi temizle: yenilemede tekrar RPC çağrılmasın.
        router.replace('/mesajlarim');
      });
  }, [user, listingParam, toast, router, loadConversations]);

  // Seçili konuşmanın mesajları + okundu işaretleme.
  useEffect(() => {
    if (!activeId || !user) {
      setMessages([]);
      return;
    }
    const supabase = getSupabaseBrowserClient();

    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .eq('conversation_id', activeId)
      .order('created_at')
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        supabase.rpc('mark_conversation_read', { p_conversation_id: activeId }).then(() => {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeId
                ? {
                    ...c,
                    buyer_unread: c.buyer_id === user.id ? 0 : c.buyer_unread,
                    seller_unread: c.seller_id === user.id ? 0 : c.seller_unread,
                  }
                : c
            )
          );
        });
      });
  }, [activeId, user]);

  // Realtime: karşı taraf yazdığında mesaj kendiliğinden düşsün.
  useEffect(() => {
    if (!activeId) return;
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`konusma-${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || !activeId || !user) return;

    setIsSending(true);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: activeId, sender_id: user.id, body })
      .select('id, conversation_id, sender_id, body, created_at')
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Mesaj gönderilemedi', description: error.message });
    } else {
      setDraft('');
      // Realtime kendi mesajımızı da döndürüyor; kopya eklememek için kontrol.
      setMessages((prev) =>
        prev.some((m) => m.id === (data as Message).id) ? prev : [...prev, data as Message]
      );
      loadConversations();
    }
    setIsSending(false);
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6">
      <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold">
        <MessageSquare className="h-6 w-6 text-primary" />
        Mesajlarım
      </h1>

      <div className="grid min-h-[32rem] grid-cols-1 overflow-hidden rounded-xl border bg-white md:grid-cols-[300px_1fr]">
        {/* --- Konuşma listesi --- */}
        <aside className={cn('border-r', active && 'hidden md:block')}>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Henüz mesajınız yok. Bir ilanın sayfasından satıcıya yazabilirsiniz.
            </p>
          ) : (
            <ul className="max-h-[32rem] overflow-y-auto">
              {conversations.map((conversation) => {
                const unread =
                  conversation.buyer_id === user.id
                    ? conversation.buyer_unread
                    : conversation.seller_unread;

                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(conversation.id)}
                      className={cn(
                        'flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-secondary',
                        conversation.id === activeId && 'bg-secondary'
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="line-clamp-1 text-sm font-semibold">
                          {conversation.listing_title ?? 'Silinmiş ilan'}
                        </span>
                        {unread > 0 && (
                          <span className="shrink-0 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                            {unread}
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {conversation.last_message_preview ?? 'Henüz mesaj yok'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* --- Seçili konuşma --- */}
        <section className={cn('flex flex-col', !active && 'hidden md:flex')}>
          {!active ? (
            <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Soldan bir konuşma seçin.
            </p>
          ) : (
            <>
              <header className="flex items-center gap-2 border-b px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setActiveId(null)}
                  aria-label="Konuşma listesine dön"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  {active.listings ? (
                    <Link
                      href={`/${active.listings.slug}-${active.listings.id}`}
                      className="line-clamp-1 font-semibold hover:text-primary"
                    >
                      {active.listing_title}
                    </Link>
                  ) : (
                    <span className="line-clamp-1 font-semibold text-muted-foreground">
                      {active.listing_title ?? 'Silinmiş ilan'}
                    </span>
                  )}
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    İlk mesajı siz yazın.
                  </p>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender_id === user.id;
                    return (
                      <div
                        key={message.id}
                        className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                            mine
                              ? 'rounded-br-sm bg-primary text-primary-foreground'
                              : 'rounded-bl-sm bg-secondary'
                          )}
                        >
                          <p className="whitespace-pre-line break-words">{message.body}</p>
                          <p
                            className={cn(
                              'mt-1 text-[10px]',
                              mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}
                          >
                            {new Date(message.created_at).toLocaleString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t p-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter gönderir, Shift+Enter satır atlar — mesajlaşmada
                      // beklenen davranış bu.
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Mesajınızı yazın..."
                    rows={2}
                    maxLength={4000}
                    className="resize-none"
                  />
                  <Button onClick={send} disabled={isSending || !draft.trim()} size="icon" className="h-10 w-10 shrink-0">
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Ödeme ve kişisel bilgilerinizi mesajda paylaşmayın. Kapora isteyen
                  kullanıcılara karşı dikkatli olun.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
