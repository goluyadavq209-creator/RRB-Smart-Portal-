import { 
  TelegramMessageRecord, 
  WebsitePost, 
  AIProcessingLogRecord,
  PostCategory,
  PostType,
  PostStatus,
  NoticeItem,
  ResultItem,
  CandidatePortalLink,
  OFFICIAL_RRB_DIGIALM_LOGIN_URL
} from '../types';
import { telegramDb } from './telegramDb';
import { processTelegramWithAI, AIPostOutput } from './aiProcessor';

export interface TelegramWebhookResponse {
  success: boolean;
  duplicate?: boolean;
  messageId?: string;
  postId?: string;
  status?: string;
  autoPublished?: boolean;
  confidence?: number;
  error?: string;
}

// Generate unique slug by checking existing posts
export function generateUniqueSlug(baseSlug: string, existingPosts: WebsitePost[], currentPostId?: string): string {
  let clean = baseSlug
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!clean) clean = 'rrb-exam-update';

  let candidate = clean;
  let counter = 2;

  while (existingPosts.some((p) => p.slug === candidate && p.id !== currentPostId)) {
    candidate = `${clean}-${counter}`;
    counter++;
  }

  return candidate;
}

export interface ParsedTelegramMessage {
  chatId: string | number;
  messageId: string | number;
  channelTitle?: string;
  senderName?: string;
  text: string;
  caption?: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileId?: string;
  date?: number;
  updateType: string;
  isForwarded?: boolean;
  authorSignature?: string;
}

export function parseTelegramUpdate(body: any): ParsedTelegramMessage | null {
  if (!body || typeof body !== 'object') return null;

  // 1. Identify which property carries the message
  let msg: any = null;
  let updateType = 'unknown';

  if (body.channel_post) {
    msg = body.channel_post;
    updateType = 'channel_post';
  } else if (body.edited_channel_post) {
    msg = body.edited_channel_post;
    updateType = 'edited_channel_post';
  } else if (body.message) {
    msg = body.message;
    updateType = 'message';
  } else if (body.edited_message) {
    msg = body.edited_message;
    updateType = 'edited_message';
  } else if (body.business_message) {
    msg = body.business_message;
    updateType = 'business_message';
  } else if (body.post) {
    msg = body.post;
    updateType = 'post';
  } else if (body.chat && (body.message_id || body.text || body.caption)) {
    msg = body;
    updateType = 'direct_message';
  }

  if (!msg) {
    // Check if this was a system membership event (e.g. bot added as admin)
    if (body.my_chat_member || body.chat_member) {
      const memberEvent = body.my_chat_member || body.chat_member;
      return {
        chatId: memberEvent.chat?.id || 'channel',
        messageId: Date.now(),
        channelTitle: memberEvent.chat?.title || 'Telegram Channel',
        senderName: memberEvent.from?.first_name || 'Administrator',
        text: `[System Event]: Bot permissions updated in channel "${memberEvent.chat?.title || ''}" (${memberEvent.new_chat_member?.status || 'member'})`,
        updateType: 'chat_member_event',
        date: memberEvent.date || Math.floor(Date.now() / 1000),
      };
    }
    return null;
  }

  // 2. Extract Chat and Message IDs
  const chatId = msg.chat?.id || msg.sender_chat?.id || 'unknown_chat';
  const messageId = msg.message_id || Date.now();
  const channelTitle = 
    msg.chat?.title || 
    msg.sender_chat?.title || 
    (msg.chat?.username ? `@${msg.chat.username}` : undefined) || 
    (msg.sender_chat?.username ? `@${msg.sender_chat.username}` : undefined) || 
    'Telegram Channel';

  const authorSignature = msg.author_signature;
  const senderName = msg.from 
    ? `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() 
    : (authorSignature || channelTitle);

  let text = msg.text || '';
  let caption = msg.caption || '';

  let mediaUrl: string | undefined = undefined;
  let mediaType: string | undefined = undefined;
  let fileName: string | undefined = undefined;
  let fileSize: number | undefined = undefined;
  let mimeType: string | undefined = undefined;
  let fileId: string | undefined = undefined;

  // 3. Extract Media & Documents (PDF, images, etc.)
  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    const largestPhoto = msg.photo[msg.photo.length - 1];
    fileId = largestPhoto.file_id;
    mediaUrl = `telegram_file_id:${largestPhoto.file_id}`;
    mediaType = 'photo';
    if (!text && !caption) {
      caption = 'Official Railway Circular / Visual Notification';
    }
  } else if (msg.document) {
    fileId = msg.document.file_id;
    fileName = msg.document.file_name;
    fileSize = msg.document.file_size;
    mimeType = msg.document.mime_type || 'application/pdf';
    mediaUrl = `telegram_doc_id:${msg.document.file_id}`;
    mediaType = mimeType;

    if (!text && !caption) {
      caption = fileName 
        ? `Official Railway PDF Document: ${fileName}` 
        : 'Official Railway Recruitment Board Document Release';
    }
  } else if (msg.video) {
    fileId = msg.video.file_id;
    mediaUrl = `telegram_video_id:${msg.video.file_id}`;
    mediaType = 'video';
  } else if (msg.audio) {
    fileId = msg.audio.file_id;
    mediaUrl = `telegram_audio_id:${msg.audio.file_id}`;
    mediaType = 'audio';
  }

  // If text and caption are still empty, create fallback representation
  if (!text && !caption) {
    if (fileName) {
      text = `Official Document: ${fileName}`;
    } else {
      text = 'Official Railway Recruitment Board Telegram Announcement';
    }
  }

  return {
    chatId,
    messageId,
    channelTitle,
    senderName,
    text,
    caption,
    mediaUrl,
    mediaType,
    fileName,
    fileSize,
    mimeType,
    fileId,
    date: msg.date,
    updateType,
    isForwarded: Boolean(msg.forward_from || msg.forward_from_chat || msg.forward_date),
    authorSignature,
  };
}

// Helper to resolve Telegram file URL from Telegram Bot API
export async function resolveTelegramFileUrl(botToken: string, fileId: string): Promise<string | null> {
  try {
    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
    const res = await fetch(getFileUrl);
    const data = await res.json();
    if (data.ok && data.result && data.result.file_path) {
      return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
    }
  } catch (err) {
    console.warn('Could not resolve Telegram file_id to public URL:', err);
  }
  return null;
}

// Background AI processing worker
export async function executeAiProcessingPipeline(
  initialRecord: TelegramMessageRecord,
  parsed: ParsedTelegramMessage,
  rawInput: string,
  resolvedMediaUrl: string | undefined,
  settings: any
): Promise<{ success: boolean; postId?: string; status?: PostStatus; error?: string }> {
  const { chatId, messageId, channelTitle, updateType } = parsed;

  if (!settings.telegram_enabled) {
    initialRecord.status = 'DRAFT';
    initialRecord.error_message = 'Telegram auto-processing paused in admin settings';
    telegramDb.saveMessage(initialRecord);
    return { success: true, status: 'DRAFT' };
  }

  try {
    initialRecord.status = 'PROCESSING';
    telegramDb.saveMessage(initialRecord);

    const { result: aiOutput, rawResponse, durationMs } = await processTelegramWithAI(
      parsed.text,
      parsed.caption || (parsed.fileName ? `Official Document: ${parsed.fileName}` : undefined),
      resolvedMediaUrl,
      settings.ai_model || 'gemini-3.7-flash'
    );

    // Save success log
    const aiLogRecord: AIProcessingLogRecord = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      telegram_message_id: messageId,
      model: settings.ai_model || 'gemini-3.7-flash',
      prompt: `[${updateType}] Chat: ${chatId} (${channelTitle}), Msg: ${messageId}\n${rawInput.slice(0, 200)}...`,
      response: rawResponse,
      status: 'SUCCESS',
      created_at: new Date().toISOString(),
      execution_time_ms: durationMs,
    };
    telegramDb.saveLog(aiLogRecord);

    // Determine auto-publish vs draft
    const allPosts = telegramDb.getPosts();
    const finalSlug = generateUniqueSlug(aiOutput.slug, allPosts);

    const shouldAutoPublish = 
      settings.auto_publish && 
      settings.ai_enabled && 
      (aiOutput.confidence >= (settings.confidence_threshold || 0.80));

    const postStatus: PostStatus = shouldAutoPublish ? 'PUBLISHED' : (settings.default_status || 'DRAFT');

    const seoMeta = {
      title: `${aiOutput.title} | Official RRB Portal`,
      metaDescription: aiOutput.summary.slice(0, 160),
      keywords: aiOutput.tags,
      ogTitle: aiOutput.title,
      ogDescription: aiOutput.summary.slice(0, 160),
    };

    const newPost: WebsitePost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      telegram_message_id: messageId,
      telegram_chat_id: chatId,
      category: aiOutput.category,
      post_type: aiOutput.postType,
      exam: aiOutput.exam,
      title: aiOutput.title,
      slug: finalSlug,
      summary: aiOutput.summary,
      content: aiOutput.content,
      important_points: aiOutput.importantPoints,
      tags: aiOutput.tags,
      source_text: rawInput,
      source_url: aiOutput.sourceUrl || resolvedMediaUrl,
      official_reference: aiOutput.officialReference,
      media_url: resolvedMediaUrl,
      status: postStatus,
      confidence: aiOutput.confidence,
      published_at: shouldAutoPublish ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seo: seoMeta,
    };

    telegramDb.savePost(newPost);

    initialRecord.status = shouldAutoPublish ? 'PUBLISHED' : 'PROCESSED';
    initialRecord.processed_at = new Date().toISOString();
    telegramDb.saveMessage(initialRecord);

    console.log(`[Telegram Pipeline] Post "${newPost.title}" created (${postStatus}, ${(aiOutput.confidence * 100).toFixed(1)}%) for message ${messageId}`);

    return {
      success: true,
      postId: newPost.id,
      status: postStatus,
    };
  } catch (err: any) {
    console.error(`[Telegram Pipeline] AI processing failed for message ${messageId}:`, err);
    initialRecord.status = 'FAILED';
    initialRecord.error_message = err.message || 'AI processing error';
    telegramDb.saveMessage(initialRecord);

    telegramDb.saveLog({
      id: `log-err-${Date.now()}`,
      telegram_message_id: messageId,
      model: settings.ai_model || 'gemini-3.7-flash',
      prompt: `[${updateType}] Chat: ${chatId}, Msg: ${messageId}\n${rawInput.slice(0, 200)}`,
      response: '',
      status: 'FAILED',
      error: err.message || 'AI processing failure',
      created_at: new Date().toISOString(),
    });

    return {
      success: false,
      error: err.message,
    };
  }
}

export async function handleIncomingTelegramUpdate(
  body: any,
  secretHeader?: string,
  forceSync: boolean = false
): Promise<TelegramWebhookResponse> {
  const settings = telegramDb.getSettings();
  const botToken = process.env.TELEGRAM_BOT_TOKEN || settings.bot_token || '8580504765:AAEAULLAiL0DZL4WNfj45Mj9pxwlduckHKk';

  // 1. Verify Webhook Secret if configured (via env or database settings)
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET || settings.webhook_secret;
  if (configuredSecret) {
    if (!secretHeader || secretHeader !== configuredSecret) {
      console.warn('Telegram webhook secret mismatch! Rejecting update.');
      telegramDb.saveLog({
        id: `log-sec-${Date.now()}`,
        telegram_message_id: 'auth_failed',
        model: 'security_check',
        prompt: `Webhook request rejected: secret token mismatch`,
        response: 'Unauthorized webhook secret mismatch',
        status: 'FAILED',
        error: 'Unauthorized webhook secret mismatch',
        created_at: new Date().toISOString(),
      });
      return { success: false, error: 'Unauthorized webhook secret mismatch' };
    }
  }

  // 2. Parse Telegram Payload
  const parsed = parseTelegramUpdate(body);
  if (!parsed) {
    const rawStr = JSON.stringify(body || {});
    console.warn('[Telegram Webhook] Unable to extract message from payload:', rawStr.slice(0, 200));
    telegramDb.saveLog({
      id: `log-unparsed-${Date.now()}`,
      telegram_message_id: 'unknown',
      model: 'parser',
      prompt: `Unparsed Telegram Payload: ${rawStr.slice(0, 300)}`,
      response: rawStr,
      status: 'FAILED',
      error: 'No recognizable channel_post or message structure found in update',
      created_at: new Date().toISOString(),
    });
    return { success: false, error: 'No readable channel_post or message found in update payload' };
  }

  const { 
    chatId, 
    messageId, 
    channelTitle, 
    senderName, 
    text, 
    caption, 
    mediaUrl: initialMediaUrl,
    fileName,
    fileId,
    updateType 
  } = parsed;

  console.log(`[Telegram Webhook Ingestion] Received ${updateType} from Chat: ${chatId} (${channelTitle}), Message ID: ${messageId}`);

  // Resolve media URL to direct Telegram CDN link if possible
  let resolvedMediaUrl = initialMediaUrl;
  if (fileId && botToken) {
    try {
      const directUrl = await resolveTelegramFileUrl(botToken, fileId);
      if (directUrl) {
        resolvedMediaUrl = directUrl;
      }
    } catch (err) {
      console.warn('Could not resolve Telegram direct file URL:', err);
    }
  }

  // 3. DUPLICATE CHECK: telegram_chat_id + telegram_message_id
  const existingMsg = telegramDb.findMessageByTelegramId(chatId, messageId);
  if (existingMsg) {
    console.log(`[Telegram Webhook] Duplicate message detected: chat ${chatId}, message ${messageId}. Skipping reprocessing.`);
    telegramDb.saveLog({
      id: `log-dup-${Date.now()}`,
      telegram_message_id: messageId,
      model: 'duplicate_checker',
      prompt: `Duplicate update received for Chat: ${chatId}, Message ID: ${messageId}`,
      response: JSON.stringify({ duplicate: true, existingId: existingMsg.id, status: existingMsg.status }),
      status: 'SUCCESS',
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      duplicate: true,
      messageId: existingMsg.id,
      status: existingMsg.status,
    };
  }

  const rawInput = [text, caption, fileName ? `File: ${fileName}` : '']
    .filter(Boolean)
    .join('\n\n');
  const internalMsgId = `tg-${chatId}-${messageId}`;

  // 4. Save initial record in telegram_messages store
  const initialRecord: TelegramMessageRecord = {
    id: internalMsgId,
    telegram_chat_id: chatId,
    telegram_message_id: messageId,
    channel_title: channelTitle,
    sender_name: senderName,
    message_text: text,
    caption: caption,
    media_url: resolvedMediaUrl,
    received_at: new Date().toISOString(),
    status: 'RECEIVED',
    raw_payload: body,
  };
  telegramDb.saveMessage(initialRecord);

  // 5. REQUIREMENT 8: Save received Telegram update in Telegram Logs BEFORE AI processing
  telegramDb.saveLog({
    id: `log-recv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    telegram_message_id: messageId,
    model: 'telegram_ingestion',
    prompt: `[${updateType}] Ingested from Chat: ${chatId} (${channelTitle}), Msg: ${messageId}`,
    response: JSON.stringify({
      updateType,
      chatId,
      messageId,
      channelTitle,
      hasText: Boolean(text),
      hasCaption: Boolean(caption),
      fileName: fileName || null,
      fileId: fileId || null,
      mediaUrl: resolvedMediaUrl || null,
    }),
    status: 'RECEIVED',
    created_at: new Date().toISOString(),
  });

  // 6. REQUIREMENT 9: If not synchronous mode, execute AI processing asynchronously in background and return 200 immediately
  if (!forceSync) {
    // Asynchronous background execution
    setImmediate(async () => {
      try {
        await executeAiProcessingPipeline(initialRecord, parsed, rawInput, resolvedMediaUrl, settings);
      } catch (bgErr) {
        console.error('[Telegram Webhook Background Error]:', bgErr);
      }
    });

    return {
      success: true,
      duplicate: false,
      messageId: initialRecord.id,
      status: 'RECEIVED',
    };
  }

  // Synchronous execution for Simulator or explicit test requests
  const syncResult = await executeAiProcessingPipeline(initialRecord, parsed, rawInput, resolvedMediaUrl, settings);

  return {
    success: syncResult.success,
    duplicate: false,
    messageId: initialRecord.id,
    postId: syncResult.postId,
    status: syncResult.status,
    error: syncResult.error,
  };
}

export async function deleteTelegramWebhook(botToken: string, dropPendingUpdates = false): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const endpoint = `https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=${dropPendingUpdates}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    return { success: Boolean(data.ok), data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete webhook' };
  }
}

// Global Poller State
let pollerOffset = 0;
let isPollerRunning = false;
let pollerIntervalId: any = null;
let lastPolledTimestamp: string | null = null;
let totalUpdatesProcessedByPoller = 0;
let pollerLastError: string | null = null;
let isPollingInProgress = false;

export function getTelegramPollerStatus() {
  return {
    isActive: isPollerRunning,
    lastPolledAt: lastPolledTimestamp,
    totalPolled: totalUpdatesProcessedByPoller,
    currentOffset: pollerOffset,
    lastError: pollerLastError,
  };
}

export async function fetchAndProcessTelegramUpdates(botToken: string, limit = 50): Promise<{
  success: boolean;
  receivedCount: number;
  processedUpdates: any[];
  error?: string;
}> {
  if (isPollingInProgress) {
    return { success: true, receivedCount: 0, processedUpdates: [] };
  }
  isPollingInProgress = true;

  try {
    const allowedUpdatesJson = JSON.stringify(['channel_post', 'edited_channel_post', 'message', 'edited_message', 'my_chat_member', 'chat_member']);
    const endpoint = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${pollerOffset}&limit=${limit}&timeout=2&allowed_updates=${encodeURIComponent(allowedUpdatesJson)}`;
    
    let res = await fetch(endpoint);
    let data = await res.json();
    lastPolledTimestamp = new Date().toISOString();

    // Auto-resolve Webhook 409 conflict
    if (!data.ok && (data.error_code === 409 || (data.description && data.description.includes('webhook')))) {
      console.log('[Telegram Poller] Webhook active on Telegram. Auto-deleting webhook to enable direct polling...');
      await deleteTelegramWebhook(botToken, false);
      // Retry getUpdates
      res = await fetch(endpoint);
      data = await res.json();
    }

    if (!data.ok) {
      pollerLastError = data.description || 'Failed to get updates from Telegram';
      isPollingInProgress = false;
      return { success: false, receivedCount: 0, processedUpdates: [], error: pollerLastError };
    }

    pollerLastError = null;
    const updates = data.result || [];
    if (updates.length === 0) {
      isPollingInProgress = false;
      return { success: true, receivedCount: 0, processedUpdates: [] };
    }

    const processedUpdates: any[] = [];
    let highestUpdateId = pollerOffset;

    for (const update of updates) {
      if (update.update_id) {
        highestUpdateId = Math.max(highestUpdateId, update.update_id + 1);
      }

      try {
        console.log(`[Telegram Poller] Processing update ${update.update_id} (type: ${Object.keys(update).filter(k => k !== 'update_id').join(', ')})`);
        const result = await handleIncomingTelegramUpdate(update, undefined, true);
        processedUpdates.push({
          updateId: update.update_id,
          result,
        });
        totalUpdatesProcessedByPoller++;
      } catch (err: any) {
        console.error(`[Telegram Poller] Error processing update ${update.update_id}:`, err);
        processedUpdates.push({
          updateId: update.update_id,
          error: err.message,
        });
      }
    }

    // Advance offset to acknowledge updates with Telegram
    pollerOffset = highestUpdateId;
    if (updates.length > 0) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${pollerOffset}&limit=1&timeout=0`);
      } catch (ackErr) {
        console.warn('[Telegram Poller] Acknowledgment ping warning:', ackErr);
      }
    }

    isPollingInProgress = false;
    return {
      success: true,
      receivedCount: updates.length,
      processedUpdates,
    };
  } catch (err: any) {
    pollerLastError = err.message || 'Error fetching updates';
    isPollingInProgress = false;
    return {
      success: false,
      receivedCount: 0,
      processedUpdates: [],
      error: pollerLastError,
    };
  }
}

export function startTelegramPoller(botToken: string, intervalMs = 3000) {
  if (isPollerRunning) return;
  isPollerRunning = true;
  pollerLastError = null;
  console.log('[Telegram Poller] Starting live Telegram Background Polling service (every 3s)...');

  // First delete webhook so Telegram delivers directly to getUpdates
  deleteTelegramWebhook(botToken, false).then((res) => {
    console.log('[Telegram Poller] Webhook cleared for live polling mode:', res);
  }).catch((err) => {
    console.warn('[Telegram Poller] Could not delete webhook prior to polling:', err);
  });

  // Run immediate first check
  fetchAndProcessTelegramUpdates(botToken, 30).catch(console.error);

  pollerIntervalId = setInterval(async () => {
    if (!isPollerRunning) return;
    try {
      await fetchAndProcessTelegramUpdates(botToken, 30);
    } catch (err: any) {
      pollerLastError = err.message;
    }
  }, intervalMs);
}

export function stopTelegramPoller() {
  if (!isPollerRunning) return;
  isPollerRunning = false;
  if (pollerIntervalId) {
    clearInterval(pollerIntervalId);
    pollerIntervalId = null;
  }
  console.log('[Telegram Poller] Live Telegram Background Poller stopped.');
}

// Telegram Bot API Integration Helper Functions
export async function getTelegramMe(botToken: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const endpoint = `https://api.telegram.org/bot${botToken}/getMe`;
    const res = await fetch(endpoint);
    const data = await res.json();
    return { success: Boolean(data.ok), data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to call Telegram getMe API' };
  }
}

export async function setTelegramWebhook(
  botToken: string, 
  webhookUrl: string, 
  secretToken?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const endpoint = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const payload: any = {
      url: webhookUrl,
      allowed_updates: ['channel_post', 'edited_channel_post', 'message', 'edited_message', 'my_chat_member', 'chat_member'],
      drop_pending_updates: false,
    };
    if (secretToken) {
      payload.secret_token = secretToken;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return { success: Boolean(data.ok), data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to call Telegram setWebhook API' };
  }
}

export async function getTelegramWebhookInfo(botToken: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const endpoint = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const res = await fetch(endpoint);
    const data = await res.json();
    return { success: Boolean(data.ok), data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to get webhook info' };
  }
}

export async function sendTelegramNotification(botToken: string, chatId: string | number, text: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    return { success: Boolean(data.ok), data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send message' };
  }
}
