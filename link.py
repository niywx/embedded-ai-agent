import os
import requests
from pydantic import BaseModel, Field
from typing import Optional


class Tools:
    def __init__(self):
        pass

    def call_my_http_service(
        self,
        user_input: str = Field(
            ..., description="The input query to send to the external service."
        ),
    ) -> str:
        """
        Call your own HTTP service and return the result.
        """

        url = "http://59.77.39.46/v1/chat-messages"
        headers = {
            "Authorization": f"Bearer app-Hb24THB9NnfkFXYQdtJt6bRJ",
            "Content-Type": "application/json",
        }
        payload = {
            "inputs": {},
            "query": user_input,
            "response_mode": "blocking",
            "conversation_id": "",
            "user": "abc-123",
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=500)
            response.raise_for_status()  # 抛出 4xx/5xx 异常

            # 假设返回 JSON，且结果在 data 字段中
            result = response.json()
            return result.get("answer", "No answer returned from service.")

        except requests.exceptions.Timeout:
            return "Error: Request to your service timed out."
        except requests.exceptions.ConnectionError:
            return "Error: Failed to connect to your service."
        except requests.exceptions.HTTPError as e:
            return f"HTTP error from your service: {e.response.status_code} - {e.response.text}"
        except ValueError:
            # JSON 解析失败
            return "Error: Invalid JSON response from your service."
        except Exception as e:
            return f"Unexpected error: {str(e)}"