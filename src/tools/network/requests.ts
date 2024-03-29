import { isAxiosError } from "axios";

import { networkManager } from "./NetworkManager";

export async function sendGetRequest(url: string): Promise<{ status: number; data: any }> {
  try {
    const response = await networkManager!.axios.get(url, {
      proxy: process.env.http_proxy
        ? {
            host: new URL(process.env.http_proxy).hostname,
            port: parseInt(new URL(process.env.http_proxy).port),
          }
        : false,
    });
    return { status: response.status, data: response.data }; // Returning only status and data
  } catch (error: any) {
    if (isAxiosError(error) && error.response) {
      return { status: error.response.status, data: error.response.data };
    } else {
      return { status: 0, data: null };
    }
  }
}
