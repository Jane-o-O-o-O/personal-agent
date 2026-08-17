import { z } from 'zod';
export type opticalCharRecognitionV1ToolName = 'optical_char_recognition.v1.image.basicRecognize';
export const opticalCharRecognitionV1ImageBasicRecognize = {
  project: 'optical_char_recognition',
  name: 'optical_char_recognition.v1.image.basicRecognize',
  sdkName: 'optical_char_recognition.v1.image.basicRecognize',
  path: '/open-apis/optical_char_recognition/v1/image/basic_recognize',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-AI-Optical character recognition-Recognize text in pictures-Basic picture recognition interface, recognize the text in the picture, and return the text list by area.File size must be less than 5M',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ image: z.string().describe('Picture data after base64').optional() }).optional(),
  },
};
export const opticalCharRecognitionV1Tools = [opticalCharRecognitionV1ImageBasicRecognize];
