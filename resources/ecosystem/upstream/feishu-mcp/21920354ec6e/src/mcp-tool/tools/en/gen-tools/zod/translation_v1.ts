import { z } from 'zod';
export type translationV1ToolName = 'translation.v1.text.detect' | 'translation.v1.text.translate';
export const translationV1TextDetect = {
  project: 'translation',
  name: 'translation.v1.text.detect',
  sdkName: 'translation.v1.text.detect',
  path: '/open-apis/translation/v1/text/detect',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-AI-Machine Translation-Text language recognition-Machine translation (MT), supporting recognition of over 100 languages. The return value is ISO 639-1 compliant',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ text: z.string().describe('Text whose language is to be recognized') }),
  },
};
export const translationV1TextTranslate = {
  project: 'translation',
  name: 'translation.v1.text.translate',
  sdkName: 'translation.v1.text.translate',
  path: '/open-apis/translation/v1/text/translate',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-AI-Machine Translation-Translate text-The following languages are supported for translation: "Zh": Chinese ; "Zh-Hant": Traditional Chinese ; "En": English; " Ja ": Japanese ; " Ru ": Russian ; " de ": German ; " Fr ": French ; "It": Italian ; " pl ": Polish ; " Th ": Thai ; "Hi": Hindi ; "Id": Indonesian ; " es ": Spanish ; " Pt ": Portuguese ; " Ko ": Korean ; " vi ": Vietnamese',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      source_language: z.string().describe('Source language'),
      text: z.string().describe('Source text, character limit is 1,000'),
      target_language: z.string().describe('Target language'),
      glossary: z
        .array(z.object({ from: z.string().describe('Associated text'), to: z.string().describe('Translation') }))
        .describe('Request level glossary with at most 128 terms, valid only in this translation')
        .optional(),
    }),
  },
};
export const translationV1Tools = [translationV1TextDetect, translationV1TextTranslate];
