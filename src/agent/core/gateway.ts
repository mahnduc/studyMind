// src/core/agent/gateway.ts
import { keyApi } from "@/app/dashboard/settings/api-key/_api/key.api";
import { GROQ_API_URL } from "@/utils/constant";

export async function requestGroq(body: object): Promise<any> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await keyApi.getRandomKey("groq")}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}