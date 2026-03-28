// MyMemory Translation API — FREE, no key needed
// Supports English ↔ Hindi ↔ Marathi

const LANG_CODES = {
  English: 'en',
  Hindi: 'hi',
  Marathi: 'mr',
};

export const LANGUAGES = ['English', 'Hindi', 'Marathi'];

/**
 * Helper to translate a small chunk
 */
async function translateChunk(chunk, langCode) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${langCode}`;
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return chunk;
  } catch (err) {
    return chunk;
  }
}

/**
 * Translate text using MyMemory free API - automatically chunks long text
 * @param {string} text - Text to translate
 * @param {string} targetLang - 'English' | 'Hindi' | 'Marathi'
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLang) {
  if (!text || targetLang === 'English') return text;
  
  const langCode = LANG_CODES[targetLang];
  const MAX_CHUNK_LENGTH = 400; // Keep under 500 characters for URL safety
  
  if (text.length <= MAX_CHUNK_LENGTH) {
      return await translateChunk(text, langCode);
  }

  // Chunking logic based on spaces/newlines so we don't cut words in half
  const chunks = [];
  let currentChunk = '';
  const words = text.split(/(\s+)/); // Preserve spaces exactly

  for (const word of words) {
    if ((currentChunk.length + word.length) > MAX_CHUNK_LENGTH) {
      if (currentChunk.trim() !== '') chunks.push(currentChunk);
      currentChunk = word;
    } else {
      currentChunk += word;
    }
  }
  if (currentChunk.trim() !== '') chunks.push(currentChunk);

  // Translate all chunks in parallel
  console.log(`Translating ${chunks.length} chunks...`);
  const translatedChunks = await Promise.all(
    chunks.map(chunk => translateChunk(chunk, langCode))
  );

  return translatedChunks.join('');
}

/**
 * Translate both headline and body together
 */
export async function translateNotice(headline, body, targetLang) {
  if (targetLang === 'English') return { headline, body };

  const [translatedHeadline, translatedBody] = await Promise.all([
    translateText(headline, targetLang),
    translateText(body, targetLang),
  ]);

  return { headline: translatedHeadline, body: translatedBody };
}
