import logging
from typing import Any, Dict, List, Optional

import aiohttp

from bot.config import config

logger = logging.getLogger(__name__)


def _normalize_auth_payload(data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not data:
        return None
    token = data.get("accessToken") or data.get("token")
    if token:
        out = {**data, "token": token}
        return out
    return data


class ApiClient:
    def __init__(self):
        self.base_url = config.api_url.rstrip("/")
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    def _headers(self, token: Optional[str] = None) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def _request(
        self,
        method: str,
        path: str,
        token: Optional[str] = None,
        json: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Optional[Any]:
        session = await self._get_session()
        url = f"{self.base_url}{path}"
        try:
            async with session.request(
                method,
                url,
                headers=self._headers(token),
                json=json,
                params=params,
            ) as resp:
                if resp.status >= 400:
                    text = await resp.text()
                    logger.error("API error %s %s: %s %s", method, path, resp.status, text)
                    return None
                if resp.content_type and "application/json" in resp.content_type:
                    return await resp.json()
                if resp.status == 204:
                    return {}
                return None
        except aiohttp.ClientError as e:
            logger.error("API connection error %s %s: %s", method, path, e)
            return None

    # ── Auth ──────────────────────────────────────────────────────────

    async def register(
        self, telegram_id: int, username: str, first_name: str, role: str
    ) -> Optional[Dict]:
        data = await self._request(
            "POST",
            "/auth/telegram",
            json={
                "telegramId": str(telegram_id),
                "username": username or "",
                "firstName": first_name or "",
                "role": role,
            },
        )
        return _normalize_auth_payload(data) if isinstance(data, dict) else None

    async def login(self, telegram_id: int) -> Optional[Dict]:
        data = await self._request(
            "POST",
            "/auth/telegram",
            json={"telegramId": str(telegram_id)},
        )
        return _normalize_auth_payload(data) if isinstance(data, dict) else None

    # ── Profile ───────────────────────────────────────────────────────

    async def get_profile(self, token: str) -> Optional[Dict]:
        return await self._request("GET", "/users/me", token=token)

    # ── Tasks ─────────────────────────────────────────────────────────

    async def get_tasks(
        self, token: str, params: Optional[Dict] = None
    ) -> Optional[List[Dict]]:
        return await self._request("GET", "/tasks", token=token, params=params)

    async def get_available_tasks(self, token: str) -> Optional[List[Dict]]:
        return await self._request("GET", "/tasks/available", token=token)

    async def create_task(self, token: str, data: Dict) -> Optional[Dict]:
        payload = {
            "title": data.get("title"),
            "description": data.get("description"),
            "instructions": data.get("instructions"),
            "pricePerExecution": data.get("pricePerExecution"),
            "totalBudget": data.get("totalBudget"),
            "verificationType": data.get("verificationType"),
            "controlQuestion": data.get("controlQuestion"),
            "controlAnswer": data.get("controlAnswer"),
        }
        photos = data.get("photos") or data.get("imageUrls") or []
        if photos:
            payload["imageUrls"] = photos
        return await self._request("POST", "/tasks", token=token, json=payload)

    async def get_my_tasks(self, token: str) -> Optional[List[Dict]]:
        return await self._request("GET", "/tasks/my", token=token)

    async def get_task(self, token: str, task_id: int) -> Optional[Dict]:
        return await self._request("GET", f"/tasks/{task_id}", token=token)

    async def pause_task(self, token: str, task_id: int) -> Optional[Dict]:
        return await self._request(
            "PATCH",
            f"/tasks/{task_id}/status",
            token=token,
            json={"status": "paused"},
        )

    async def resume_task(self, token: str, task_id: int) -> Optional[Dict]:
        return await self._request(
            "PATCH",
            f"/tasks/{task_id}/status",
            token=token,
            json={"status": "active"},
        )

    async def delete_task(self, token: str, task_id: int) -> Optional[Dict]:
        session = await self._get_session()
        url = f"{self.base_url}/tasks/{task_id}"
        try:
            async with session.delete(url, headers=self._headers(token)) as resp:
                if resp.status >= 400:
                    text = await resp.text()
                    logger.error("API DELETE tasks/%s: %s %s", task_id, resp.status, text)
                    return None
                if resp.content_length and resp.content_type and "json" in resp.content_type:
                    return await resp.json()
                return {"ok": True}
        except aiohttp.ClientError as e:
            logger.error("API delete error: %s", e)
            return None

    # ── Submissions ───────────────────────────────────────────────────

    async def create_submission(self, token: str, data: Dict) -> Optional[Dict]:
        body: Dict[str, Any] = {"taskId": int(data["taskId"])}
        proof = data.get("proofImageUrl") or data.get("proofUrl")
        if proof:
            body["proofImageUrl"] = proof
        answer = data.get("answerText") or data.get("answer")
        if answer is not None:
            body["answerText"] = str(answer)
        return await self._request("POST", "/submissions", token=token, json=body)

    async def get_my_submissions(self, token: str) -> Optional[List[Dict]]:
        return await self._request("GET", "/submissions/my", token=token)

    async def get_task_submissions(
        self, token: str, task_id: int
    ) -> Optional[List[Dict]]:
        return await self._request(
            "GET", f"/submissions/task/{task_id}", token=token
        )

    async def review_submission(
        self, token: str, submission_id: int, approved: bool
    ) -> Optional[Dict]:
        return await self._request(
            "PATCH",
            f"/submissions/{submission_id}/review",
            token=token,
            json={"approved": approved},
        )

    # ── Wallet ────────────────────────────────────────────────────────

    async def get_balance(self, token: str) -> Optional[Dict]:
        return await self._request("GET", "/wallet/balance", token=token)

    async def create_payment(self, token: str, amount: float) -> Optional[Dict]:
        return await self._request(
            "POST", "/payments/create", token=token, json={"amount": amount}
        )

    async def withdraw(self, token: str, amount: float) -> Optional[Dict]:
        return await self._request(
            "POST", "/wallet/withdraw", token=token, json={"amount": amount}
        )

    async def get_transactions(self, token: str) -> Optional[List[Dict]]:
        return await self._request("GET", "/wallet/transactions", token=token)

    # ── Files ─────────────────────────────────────────────────────────

    async def upload_file(
        self, token: str, file_bytes: bytes, filename: str
    ) -> Optional[str]:
        session = await self._get_session()
        url = f"{self.base_url}/uploads"
        headers = {"Authorization": f"Bearer {token}"}
        data = aiohttp.FormData()
        data.add_field(
            "file",
            file_bytes,
            filename=filename,
            content_type="application/octet-stream",
        )
        try:
            async with session.post(url, headers=headers, data=data) as resp:
                if resp.status >= 400:
                    logger.error("Upload error: %s", await resp.text())
                    return None
                result = await resp.json()
                raw_url = result.get("url")
                if not raw_url:
                    return None
                if raw_url.startswith("http"):
                    return raw_url
                base = config.public_base_url.rstrip("/")
                return f"{base}{raw_url}" if raw_url.startswith("/") else f"{base}/{raw_url}"
        except aiohttp.ClientError as e:
            logger.error("Upload connection error: %s", e)
            return None


api_client = ApiClient()
