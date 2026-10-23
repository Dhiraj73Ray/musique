from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from google.oauth2 import service_account
import google.auth.transport.requests
import httpx
import os
import time

router = APIRouter(prefix="/stream", tags=["stream"])

# Token cache — module level (server memory mein rehta hai)
_token_cache = {
    "token": None,
    "expires_at": 0
}

def get_token():
    now = time.time()
    
    # Agar token valid hai (5 min buffer rakho expiry se pehle)
    if _token_cache["token"] and now < _token_cache["expires_at"] - 300:
        return _token_cache["token"]
    
    # Naya token generate karo
    creds = service_account.Credentials.from_service_account_file(
        os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE"),
        scopes=["https://www.googleapis.com/auth/drive.readonly"]
    )
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    
    # Cache mein store karo
    _token_cache["token"] = creds.token
    
    # YEH PART UPDATE KARO:
    if creds.expiry is not None:
        _token_cache["expires_at"] = creds.expiry.timestamp()
    else:
        _token_cache["expires_at"] = now + 3600
    
    return creds.token

@router.get("/{file_id}")
async def stream_track(file_id: str, request: Request):
    try:
        token = get_token()
        url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"

        headers = {"Authorization": f"Bearer {token}"}
        range_header = request.headers.get("range")
        if range_header:
            headers["Range"] = range_header

        client = httpx.AsyncClient(timeout=None)
        req = client.build_request("GET", url, headers=headers)
        response = await client.send(req, stream=True, follow_redirects=True)

        response_headers = {
            "Accept-Ranges": "bytes",
            "Content-Type": response.headers.get("Content-Type", "audio/mpeg"),
            "Cache-Control": "public, max-age=86400",
        }
        if "Content-Length" in response.headers:
            response_headers["Content-Length"] = response.headers["Content-Length"]
        if "Content-Range" in response.headers:
            response_headers["Content-Range"] = response.headers["Content-Range"]

        async def generate():
            try:
                async for chunk in response.aiter_bytes(chunk_size=32768):
                    yield chunk
            finally:
                await response.aclose()
                await client.aclose()

        return StreamingResponse(
            generate(),
            status_code=response.status_code,
            headers=response_headers,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))