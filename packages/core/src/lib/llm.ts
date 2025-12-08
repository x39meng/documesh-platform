import { GoogleGenAI } from "@google/genai";
import { ZodType, toJSONSchema } from "zod";
import { env } from "@repo/config";
import { createLogger } from "./logger";

const logger = createLogger("llm");

// 1. Define the Interface
export interface LLMProvider {
  extract(
    input: string | Buffer,
    systemPrompt: string,
    extractionPrompt: string,
    schema: ZodType,
    mimeType?: string
  ): Promise<unknown>;
}

// 2. Real Implementation (Gemini)
export class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extract(
    input: string | Buffer,
    systemPrompt: string,
    extractionPrompt: string,
    schema: ZodType,
    mimeType: string = "application/pdf"
  ): Promise<unknown> {
    logger.info({ mimeType }, "Calling Gemini API");

    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    try {
      const parts: Array<Record<string, unknown>> = [
        { text: systemPrompt + "\n\n" + extractionPrompt },
      ];

      if (Buffer.isBuffer(input)) {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: input.toString("base64"),
          },
        });
      } else {
        parts.push({ text: "\n\nDOCUMENT TEXT:\n" + input });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: parts,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: toJSONSchema(schema),
          temperature: 0.1,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      if (response.text) {
        const parsedData = JSON.parse(response.text);
        return schema.parse(parsedData);
      }

      return { error: "No response text" };
    } catch (error) {
      const err = error as Error;
      logger.error(
        {
          error: err.message,
          stack: err.stack,
        },
        "Gemini extraction failed"
      );
      return { error: "Extraction Failed", details: error };
    }
  }
}

// 3. Mock Implementation
export class MockProvider implements LLMProvider {
  async extract(
    _input: string | Buffer,
    _systemPrompt: string,
    _extractionPrompt: string,
    schema: ZodType,
    _mimeType: string = "application/pdf"
  ): Promise<unknown> {
    logger.info("Using Mock LLM Provider");

    const mockData = {
      fullName: "Mock Candidate (Gemini Bypass)",
      headline: "Senior Mock Engineer",
      contactEmail: "mock@example.com",
      location: { city: "Mock City", country: "Mockland" },
      workExperience: [],
      education: [],
      technicalSkills: ["Mocking", "Testing"],
      invoiceNumber: "INV-MOCK-9999",
      date: new Date().toISOString().split("T")[0],
      vendor: { name: "Mock Vendor Inc.", address: "123 Mock St" },
      customer: { name: "Mock Customer LLC" },
      lineItems: [
        {
          description: "Mock Service",
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        },
      ],
      subtotal: 100,
      tax: 10,
      total: 110,
      currency: "USD",
      visualMetaAnalysis: {
        pageCount: 1,
        documentQuality: "high",
      },
    };

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      return schema.parse(mockData);
    } catch (error) {
      const err = error as Error;
      logger.warn(
        { error: err.message },
        "Mock data failed schema validation, returning raw mock data"
      );
      return mockData;
    }
  }
}

// 4. Factory
export class LLMFactory {
  static getProvider(): LLMProvider {
    const useMock = env.MOCK_LLM || !env.GEMINI_API_KEY;

    if (useMock) {
      if (!env.GEMINI_API_KEY) {
        logger.warn("GEMINI_API_KEY not found, using Mock Provider");
      }
      return new MockProvider();
    }

    return new GeminiProvider(env.GEMINI_API_KEY!);
  }
}

// 5. Exported Wrapper
export async function extractStructuredData(
  input: string | Buffer,
  systemPrompt: string,
  extractionPrompt: string,
  schema: ZodType,
  mimeType: string = "application/pdf"
): Promise<unknown> {
  const provider = LLMFactory.getProvider();
  return provider.extract(
    input,
    systemPrompt,
    extractionPrompt,
    schema,
    mimeType
  );
}
